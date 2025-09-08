// Download routes using StorageManager and R2Client
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import storageManager from '../../server/storage/storageManager.js';
import r2Client from '../../server/storage/r2Client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = Router();

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Download file - handles both R2 and local storage with proper inline/attachment headers
router.get('/download/*', async (req, res) => {
  try {
    // Get the file path from the URL
    const filePath = req.params[0];
    const originalName = req.query.originalName || 'download';
    const storageType = req.query.storageType || 'r2';
    
    console.log('📥 Download request for:', filePath, 'Storage:', storageType);
    
    // Check if this is a print request or download request
    const isPrintRequest = req.query.print === 'true';
    
    // Detect file type from extension
    const ext = originalName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === 'pdf') {
      contentType = 'application/pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
      contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    }
    
    if (storageType === 'local') {
      // **LOCAL FILE HANDLING**
      let localFilePath;
      if (filePath.startsWith('uploads/')) {
        localFilePath = path.join(__dirname, '..', '..', filePath);
      } else {
        localFilePath = path.join(__dirname, '..', '..', 'uploads', filePath);
      }
      
      console.log('🗂️ Local file path:', localFilePath);
      
      // Check if file exists
      if (!fs.existsSync(localFilePath)) {
        console.error('❌ Local file not found:', localFilePath);
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Set headers based on request type
      if (isPrintRequest) {
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        res.setHeader('Content-Type', contentType);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        res.setHeader('Content-Type', 'application/octet-stream');
      }
      
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream local file
      const fileStream = fs.createReadStream(localFilePath);
      fileStream.pipe(res);
      
    } else {
      // **R2 STORAGE HANDLING - USE AWS SDK TO GET OBJECT DIRECTLY**
      console.log('🔍 R2 file detected, fetching object directly...');
      console.log(`📋 Request details:`, {
        filePath,
        originalName,
        storageType,
        query: req.query
      });
      
      // Get the R2 key from file path
      let r2Key = filePath;
      
      // Validate r2Key
      if (!r2Key) {
        console.error('❌ Empty r2Key provided');
        return res.status(400).json({ message: 'Invalid file key' });
      }
      
      // **DIRECT R2 OBJECT RETRIEVAL** using AWS SDK
      try {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        
        const getObjectCommand = new GetObjectCommand({
          Bucket: r2Client.bucket,
          Key: r2Key
        });
        
        console.log(`🔗 Getting object directly from R2: ${r2Key}`);
        console.log(`🪣 R2 Bucket: ${r2Client.bucket}`);
        
        const s3Response = await r2Client.client.send(getObjectCommand);
        
        if (!s3Response.Body) {
          console.error('❌ No response body from R2 GetObject');
          return res.status(404).json({ message: 'File not found' });
        }
        
        // **CRITICAL FIX**: Set proper headers BEFORE streaming
        if (isPrintRequest) {
          // For print requests, serve inline so the file can be displayed in iframe
          res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`);
          res.setHeader('Content-Type', contentType);
          console.log('🖨️ Setting inline headers for print request');
        } else {
          // For download requests, force attachment
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
          res.setHeader('Content-Type', 'application/octet-stream');
          console.log('📥 Setting attachment headers for download request');
        }
        
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Accept-Ranges', 'bytes');
        
        // Set content length if available
        if (s3Response.ContentLength) {
          res.setHeader('Content-Length', s3Response.ContentLength);
        }
        
        // **STREAM R2 CONTENT DIRECTLY TO RESPONSE**
        if (s3Response.Body.pipe) {
          // Node.js readable stream - direct pipe
          console.log('📡 Streaming R2 content via pipe');
          s3Response.Body.pipe(res);
        } else if (s3Response.Body.transformToWebStream) {
          // AWS SDK v3 stream
          console.log('📡 Streaming R2 content via web stream');
          const webStream = s3Response.Body.transformToWebStream();
          const reader = webStream.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (!res.write(value)) {
                  // If write buffer is full, wait for drain
                  await new Promise(resolve => res.once('drain', resolve));
                }
              }
              res.end();
            } catch (error) {
              console.error('❌ Error streaming R2 content:', error);
              if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to stream file' });
              }
            }
          };
          
          await pump();
        } else {
          console.error('❌ Unknown R2 response body type');
          return res.status(500).json({ message: 'Failed to process file stream' });
        }
        
      } catch (r2Error) {
        console.error('❌ Direct R2 access failed:', {
          error: r2Error.message,
          code: r2Error.Code || r2Error.name,
          key: r2Key,
          bucket: r2Client.bucket
        });
        
        // Return 404 if object not found, 500 for other errors
        const statusCode = r2Error.name === 'NoSuchKey' || r2Error.Code === 'NoSuchKey' ? 404 : 500;
        const message = statusCode === 404 ? 'File not found in storage' : 'Failed to retrieve file';
        return res.status(statusCode).json({ message, details: r2Error.message });
      }
    }
    
  } catch (error) {
    console.error('❌ Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to download file' });
    }
  }
});

export default router;