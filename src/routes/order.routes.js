import { Router } from 'express';
import OrderController from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import storageManager from '../../server/storage/storageManager.js';

const router = Router();

// Configure multer for file uploads - Lazy initialization to prevent module load failures
// 🚀 OBJECT STORAGE FIX: Use object storage for all file uploads
function createStorage() {
  // Always use memory storage and upload to object storage
  return multer.memoryStorage();
}

// 🚀 ULTRA PERFORMANCE: Optimized for 1GB files and hundreds of small files
const upload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB per file - Support huge files!
    files: 200, // Up to 200 files at once - Support bulk uploads!
    fieldSize: 50 * 1024 * 1024, // 50MB field size limit
    parts: 250 // Increased for handling many files
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file filtering with size validation
    console.log(`📤 Processing file upload: ${file.originalname} (${file.mimetype})`);
    cb(null, true); // Accept all file types
  }
});

// Order routes
router.post('/orders/authenticated', requireAuth, OrderController.createAuthenticatedOrder); // New authenticated order creation
router.get('/orders/shop/:shopId', requireAuth, OrderController.getOrdersByShop);
router.get('/orders/shop/:shopId/history', requireAuth, OrderController.getOrdersByShop); // History alias
router.get('/orders/customer/:customerId', requireAuth, OrderController.getOrdersByCustomer);
router.get('/orders/:id', requireAuth, OrderController.getOrder);
// Add middleware for optional auth - tries to authenticate but doesn't fail if no token
const optionalAuth = (req, res, next) => {
  req.user = null; // Default to no user
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Invalid token, but continue without authentication
      req.user = null;
    }
  }
  next();
};

router.get('/orders/:id/details', optionalAuth, OrderController.getOrder); // Public endpoint with optional auth
router.post('/orders', requireAuth, upload.array('files'), OrderController.createOrder);
router.patch('/orders/:id', requireAuth, OrderController.updateOrder); // General order update
router.patch('/orders/:id/status', requireAuth, OrderController.updateOrderStatus);
// Allow anonymous users to add files to their orders (they created the order, they should be able to add files)
router.post('/orders/:id/add-files', optionalAuth, upload.array('files'), OrderController.addFilesToOrder);
router.delete('/orders/:id', requireAuth, OrderController.deleteOrder);

// Anonymous order route (no auth required)
router.post('/orders/anonymous', upload.array('files'), OrderController.createAnonymousOrder);

// 🔥 ULTRA SPEED BOOST: Direct R2 upload with batch presigned URLs for massive performance
// Requires authentication for security
router.post('/orders/:id/get-upload-urls', requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { files } = req.body; // Array of {name, type, size}
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array required' });
    }
    
    // Verify order belongs to authenticated user
    const Order = (await import('../models/index.js')).Order;
    const order = await Order.findOne({
      where: {
        id: orderId,
        customerId: req.user.id
      }
    });
    
    if (!order) {
      return res.status(403).json({ error: 'Order not found or access denied' });
    }
    
    console.log(`🚀 Generating direct upload URLs for ${files.length} files (order ${orderId})`);
    
    // Import R2 client for direct uploads
    const r2Client = (await import('../../server/storage/r2Client.js')).default;
    
    // Check if R2 is available for direct uploads
    if (!r2Client.isAvailable()) {
      console.log('⚠️ R2 not available, falling back to server upload');
      return res.status(200).json({ useDirectUpload: false });
    }
    
    // 🚀 NEW: Use batch presigned URL generation for maximum speed
    const uploadUrls = await r2Client.getBatchPresignedUrls(files, orderId);
    
    console.log(`✅ Generated ${uploadUrls.length} direct upload URLs`);
    
    res.json({ 
      useDirectUpload: true,
      uploadUrls,
      serverBypass: true // Flag indicating server is completely bypassed
    });
  } catch (error) {
    console.error('Error generating upload URLs:', error);
    res.status(500).json({ error: 'Failed to generate upload URLs' });
  }
});

// 🚀 DIRECT R2 UPLOAD PROXY: Handle direct uploads through server to bypass CORS
router.put('/orders/:id/direct-upload/:fileIndex', requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const fileIndex = parseInt(req.params.fileIndex);
    const { uploadUrl, filename } = req.query;
    
    // Verify order belongs to authenticated user
    const Order = (await import('../models/index.js')).Order;
    const order = await Order.findOne({
      where: {
        id: orderId,
        customerId: req.user.id
      }
    });
    
    if (!order) {
      return res.status(403).json({ error: 'Order not found or access denied' });
    }
    
    console.log(`🚀 Proxying direct upload for file ${filename} (order ${orderId})`);
    
    // Stream the file directly to R2
    const fetch = (await import('node-fetch')).default;
    
    // Forward the upload to R2
    const r2Response = await fetch(uploadUrl, {
      method: 'PUT',
      body: req,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        'Content-Length': req.headers['content-length']
      }
    });
    
    if (r2Response.ok) {
      console.log(`✅ Direct upload completed for ${filename}`);
      res.json({ success: true, filename });
    } else {
      console.error(`❌ Direct upload failed: ${r2Response.status}`);
      res.status(500).json({ error: 'Upload failed' });
    }
  } catch (error) {
    console.error('Direct upload proxy error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Frontend compatibility routes
router.post('/orders/upload', requireAuth, upload.array('files'), OrderController.createOrder);
router.post('/orders/walkin', upload.array('files'), OrderController.createAnonymousOrder);

// 📁 HYBRID FILE DOWNLOAD: Serve files from R2 or local storage
router.get('/download/*', optionalAuth, async (req, res) => {
  try {
    console.log('📥 Download request for:', req.params[0]);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Parse query params
    const originalName = req.query.originalName || 'download';
    const isDownloadRequest = req.query.download === 'true';
    const isPrintRequest = req.query.print === 'true';  // NEW: Check for print request
    const storageType = req.query.storageType || 'local';
    
    // If this is an R2 file with a key
    if (storageType === 'r2' || req.params[0].includes('orders/')) {
      console.log('🔍 R2 file detected, generating presigned URL...');
      
      const fileInfo = {
        r2Key: req.params[0],
        path: req.params[0],
        storageType: 'r2',
        originalName: originalName,
        mimetype: req.query.mimetype || 'application/octet-stream'
      };
      
      // Get appropriate URL based on request type - prioritize print over download
      const accessType = isPrintRequest ? 'print' : (isDownloadRequest ? 'download' : 'view');
      const presignedUrl = await storageManager.getFileAccess(fileInfo, accessType);
      
      // Redirect to presigned URL
      return res.redirect(presignedUrl);
    }
    
    // Otherwise handle local file
    let filePath = req.params[0];
    if (!filePath.startsWith('uploads/')) {
      filePath = `uploads/${filePath}`;
    }
    
    console.log('🔍 Local file path:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        message: 'The requested file could not be found or may have been deleted'
      });
    }
    
    // Get file stats for content-length
    const stats = fs.statSync(filePath);
    
    // Determine file type
    const ext = path.extname(filePath).toLowerCase();
    const isPDF = ext === '.pdf';
    
    // Set appropriate content type
    if (isPDF) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    // EXECUTIVE DECISION: Content-Disposition Header Fix
    // For print requests: ALWAYS use inline disposition (for all file types)
    // For download requests: ALWAYS use attachment disposition
    if (isPrintRequest) {
      // Print mode: Use inline for ALL file types to enable in-browser display
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
      res.setHeader('Cache-Control', 'no-cache');
    } else if (isDownloadRequest) {
      // Download mode: Force download without "Save As" dialog
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      // Default view mode: Use inline for PDFs, attachment for others
      if (isPDF) {
        res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      }
    }
    
    res.setHeader('Content-Length', stats.size);
    
    // Create read stream and pipe to response
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    
    console.log('✅ Local file download completed:', originalName);
    
  } catch (error) {
    console.error('❌ File download error:', error.message);
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    });
  }
});

export default router;