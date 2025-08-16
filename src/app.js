import express from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
// DISABLED: WebSocket import removed - handled by new system
// import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database validation
import { validateDatabaseConnection } from './models/index.js';

// ES Module compatibility fix for serverless environments
const __filename = import.meta ? fileURLToPath(import.meta.url) : __filename;
const __dirname = import.meta ? dirname(__filename) : __dirname;

// Validate database connection
validateDatabaseConnection();

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import shopOwnerAnalyticsRoutes from './routes/shopOwnerAnalytics.routes.js';
import orderRoutes from './routes/order.routes.js';
import messageRoutes from './routes/message.routes.js';
import shopApplicationRoutes from './routes/shopApplication.routes.js';
import adminRoutes from './routes/admin.routes.js';
import qrRoutes from './routes/qr.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import pincodeRoutes from './routes/pincode.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import otpRoutes from './routes/otp.routes.js';
import downloadRoutes from './routes/download.routes.js';
import printHostRoutes from './routes/print-host.routes.js';
import googleMapsImportRoutes from './routes/google-maps-import.routes.js';
import r2Routes from './routes/r2.routes.js';
import { setupWebSocket } from './utils/websocket.js';
import storageManager from '../server/storage/storageManager.js';

// Create Express app
const app = express();

// Create uploads directory if it doesn't exist (skip in serverless environments)
const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
if (!isServerless) {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Uploads directory created');
    } catch (error) {
      console.log('⚠️ Could not create uploads directory (serverless environment)');
    }
  }
}

// FINAL CORS FIX - Ensure credentials work properly
app.use((req, res, next) => {
  // Get origin
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For same-origin requests, allow the request
    const host = req.get('host');
    if (host) {
      res.setHeader('Access-Control-Allow-Origin', `https://${host}`);
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CRITICAL: Trust proxy for Replit environment
app.set('trust proxy', true);

// 🔍 Request Debug Middleware (Pure JWT)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('--- 🔍 JWT Request ---');
    console.log(`➡️  Request Origin: ${req.headers.origin || 'Same-origin'}`);
    console.log(`🔐 ${req.method} ${req.path}`);
    console.log(`🎫 JWT Token: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    console.log('--------------------');
  }
  next();
});


// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV === 'development') {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        if (jsonStr.length <= 80) {
          logLine += ` :: ${jsonStr}`;
        }
      }
      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});



// 🔥 CRITICAL FIX: Ensure API routes are handled before Vite middleware
// This prevents the Vite catch-all from intercepting API requests
app.use('/api*', (req, res, next) => {
  // Mark this as an API request to prevent Vite interference
  req.isApiRequest = true;
  next();
});

// Register API routes - SEQUELIZE SYSTEM ACTIVATED  
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', shopRoutes);
app.use('/api/shop-owner', shopOwnerAnalyticsRoutes);
app.use('/api', orderRoutes);
app.use('/api', messageRoutes);
app.use('/api', shopApplicationRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shop-owner', shopOwnerAnalyticsRoutes);
app.use('/api/auth', otpRoutes); // WhatsApp OTP routes
app.use('/api', printHostRoutes); // Print Host for PDF printing
app.use('/api/google-maps-import', googleMapsImportRoutes); // Google Maps shop creation
app.use('/api', r2Routes); // R2 storage routes for order files

// PDF Viewer Route - Serve dedicated pdf-viewer.html via API route to avoid Vite conflicts  
app.get('/api/pdf-viewer', (req, res) => {
  try {
    const pdfViewerPath = path.join(__dirname, '..', 'public', 'pdf-viewer.html');
    console.log('📄 Serving pdf-viewer.html from:', pdfViewerPath);
    
    const htmlContent = fs.readFileSync(pdfViewerPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(htmlContent);
  } catch (error) {
    console.error('❌ Error serving pdf-viewer.html:', error);
    res.status(404).send('PDF viewer not found');
  }
});

// 🚨 FALLBACK ROUTE: Redirect old QR routes to new structure for browser cache compatibility
app.post('/api/generate-image', async (req, res) => {
  console.log('⚠️ DEPRECATED ROUTE ACCESSED: /api/generate-image - forwarding to QR controller');
  
  try {
    // Always use full QR controller with Puppeteer
    console.log('🎨 Using full QR controller with Puppeteer in fallback route');
    const { default: QRController } = await import('./controllers/qr.controller.js');
    return QRController.generateQR(req, res);
  } catch (error) {
    console.error('❌ Error in fallback route:', error);
    res.status(500).json({ success: false, message: 'QR generation failed', error: error.message });
  }
});

app.post('/api/generate-qr', async (req, res) => {
  console.log('⚠️ DEPRECATED ROUTE ACCESSED: /api/generate-qr - forwarding to QR controller');
  try {
    // Always use full QR controller with Puppeteer
    console.log('🎨 Using full QR controller with Puppeteer in fallback route');
    const { default: QRController } = await import('./controllers/qr.controller.js');
    return QRController.generateQR(req, res);
  } catch (error) {
    console.error('❌ Error in fallback route:', error);
    res.status(500).json({ success: false, message: 'QR generation failed', error: error.message });
  }
});

// app.use('/api', downloadRoutes); // DISABLED - Using inline download route instead

// File download/print proxy - FIXED with proper R2 support
app.get('/api/download/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const urlParams = new URLSearchParams(req.query);
    const storageType = urlParams.get('storageType') || 'local';
    const originalName = urlParams.get('originalName') || path.basename(filePath);
    const isPrint = urlParams.get('print') === 'true';
    const isDownload = urlParams.get('download') === 'true';
    
    console.log('📥 File access request:', {
      filePath,
      storageType,
      originalName,
      isPrint,
      isDownload,
      fullUrl: req.url
    });

    // Create file info object based on storage type
    let fileInfo;
    if (storageType === 'r2') {
      fileInfo = {
        r2Key: filePath,
        path: filePath,
        storageType: 'r2',
        originalName: originalName,
        mimetype: 'application/pdf' // Default for most files, will be overridden by R2
      };
    } else {
      // Local file
      fileInfo = {
        path: filePath,
        storageType: 'local',
        originalName: originalName
      };
    }
    
    // Determine access type
    const accessType = isPrint ? 'print' : 'download';
    
    if (storageType === 'r2') {
      // Use storage manager for R2 files
      const signedUrl = await storageManager.getFileAccess(fileInfo, accessType);
      
      if (!signedUrl) {
        console.error('❌ Failed to get signed URL for R2 file:', filePath);
        return res.status(404).json({ error: 'File not found' });
      }
      
      console.log('✅ Got R2 presigned URL, redirecting...');
      return res.redirect(signedUrl);
      
    } else {
      // Handle local files
      const localFilePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(localFilePath)) {
        console.error('❌ Local file not found:', localFilePath);
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Determine content type
      const ext = path.extname(originalName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.txt') contentType = 'text/plain';
      
      // Set appropriate headers
      const disposition = isPrint ? 'inline' : 'attachment';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${originalName}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      console.log(`✅ Serving local file: ${originalName} (${contentType}, ${disposition})`);
      
      // Stream the file
      const stream = fs.createReadStream(localFilePath);
      return stream.pipe(res);
    }
    
  } catch (error) {
    console.error('❌ File access error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to access file' });
    }
  }
});

// Object Storage serving routes - PROXY APPROACH FOR CORS COMPATIBILITY
app.get('/objects/*', async (req, res) => {
  try {
    let objectPath = req.path.replace('/objects/', '');
    const bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1b4dcb0d-4d6c-4bd5-9fa1-4c7d43cf178f';
    
    // 🔥 CRITICAL FIX: Keep the .private prefix as files ARE stored with it in the bucket
    // The files are uploaded to .private/uploads/ path, so we need to preserve this structure
    
    console.log('🔍 Object request (FIXED):', {
      requestPath: req.path,
      objectPathInBucket: objectPath,
      bucketName: bucketName
    });
    
    // Generate a signed URL for accessing the object
    const signedUrlResponse = await fetch('http://127.0.0.1:1106/object-storage/signed-object-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectPath,
        method: 'GET',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      }),
    });

    if (!signedUrlResponse.ok) {
      console.error('Failed to get signed URL:', signedUrlResponse.status);
      return res.status(404).json({ error: 'Object not found' });
    }

    const { signed_url: signedUrl } = await signedUrlResponse.json();
    console.log('✅ Got signed URL, proxying image:', signedUrl);
    
    // 🔥 CRITICAL FIX: Proxy the image instead of redirecting to avoid CORS issues
    const imageResponse = await fetch(signedUrl);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image from signed URL:', imageResponse.status);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set appropriate headers for image serving
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = imageResponse.headers.get('content-length');
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin for images
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Stream the image data to the client
    const reader = imageResponse.body.getReader();
    const pump = () => {
      return reader.read().then(({ done, value }) => {
        if (done) return res.end();
        res.write(value);
        return pump();
      });
    };
    
    pump().catch(error => {
      console.error('Image streaming error:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to serve image' });
    });

  } catch (error) {
    console.error('Error serving object:', error);
    res.status(500).json({ error: 'Failed to serve object' });
  }
});


// Remove old download route - moved above

// 🔥 CRITICAL FIX: File serving route for viewing files (not downloading)
// This allows frontend to display uploaded files in chat, order details, etc.
// Note: Browser img tags can't send auth headers, so we use a more permissive approach
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // In serverless environments, files are stored in memory and can't be served after request
  const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
  if (isServerless) {
    return res.status(404).json({ 
      message: 'File serving not available in serverless environment. Files are processed in memory during upload.' 
    });
  }
  
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  // Basic security check - ensure file exists and path is safe
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  
  if (fs.existsSync(filePath)) {
    // Set appropriate headers for file viewing
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set proper MIME types for common file types
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Security header
    
    console.log(`📁 Serving file: ${filename} (${contentType})`);
    res.sendFile(path.resolve(filePath));
  } else {
    console.log(`❌ File not found: ${filename}`);
    res.status(404).json({ message: 'File not found' });
  }
});

// REMOVED: This catch-all was blocking new TypeScript routes
// Unmatched API routes are now handled by the new system

// WebSocket setup is now handled in server/dev-server.ts

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;