// Download routes for file access from object storage
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Download file from object storage
router.get('/download/*', async (req, res) => {  // Removed requireAuth temporarily for debugging
  try {
    // Get the file path from the URL
    const filePath = req.params[0];
    const originalName = req.query.originalName || 'download';
    
    console.log('📥 Download request for:', filePath);
    
    // Normalize the object path
    let objectPath = filePath;
    
    // Remove any duplicate .private paths
    objectPath = objectPath.replace(/^\.private\/\.private\//, '.private/');
    
    // Ensure proper /objects/ prefix
    if (!objectPath.startsWith('/objects/')) {
      objectPath = `/objects/${objectPath}`;
    }
    
    console.log('🔍 Normalized object path:', objectPath);
    
    // Use fetch to get file from object storage via signed URL
    const bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1b4dcb0d-4d6c-4bd5-9fa1-4c7d43cf178f';
    
    // Generate signed URL for downloading
    const signedUrlResponse = await fetch('http://127.0.0.1:1106/object-storage/signed-object-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucketName: bucketName,
        objectPath: objectPath,
        action: 'read',
        expiresIn: 3600
      })
    });
    
    if (!signedUrlResponse.ok) {
      console.error('❌ Failed to generate signed URL:', await signedUrlResponse.text());
      console.error('❌ Download error: Object not found');
      return res.status(404).json({ message: 'File not found' });
    }
    
    const { signedUrl } = await signedUrlResponse.json();
    
    // Fetch the file from the signed URL
    const fileResponse = await fetch(signedUrl);
    
    if (!fileResponse.ok) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if this is a print request or download request
    const isPrintRequest = req.query.print === 'true';
    
    if (isPrintRequest) {
      // For print requests, serve inline so the file can be displayed in iframe
      // Detect file type from extension
      const ext = originalName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
        contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      }
      
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      // For download requests, force attachment
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache');
    }
    
    // Stream the response
    const reader = fileResponse.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });
    
    // Convert to Node stream and pipe to response
    const nodeStream = require('stream').Readable.from(stream);
    nodeStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

export default router;