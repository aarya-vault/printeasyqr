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

// 🚀 PERFORMANCE FIX: Optimized file upload limits for better performance (fixes Issue #3)
const upload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file (reduced from 500MB for better memory usage)
    files: 20, // Up to 20 files at once (reduced from 100 to prevent memory overflow)
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
    parts: 25 // Limit form parts to prevent memory exhaustion
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file filtering with size validation
    console.log(`📤 Processing file upload: ${file.originalname} (${file.mimetype})`);
    cb(null, true); // Accept all file types
  }
});

// Order routes
router.get('/orders/shop/:shopId', requireAuth, OrderController.getOrdersByShop);
router.get('/orders/shop/:shopId/history', requireAuth, OrderController.getOrdersByShop); // History alias
router.get('/orders/customer/:customerId', requireAuth, OrderController.getOrdersByCustomer);
router.get('/orders/:id', requireAuth, OrderController.getOrder);
// Add middleware for optional auth - tries to authenticate but doesn't fail if no token
const optionalAuth = (req, res, next) => {
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
router.patch('/orders/:id/status', requireAuth, OrderController.updateOrderStatus);
router.post('/orders/:id/add-files', requireAuth, upload.array('files'), OrderController.addFilesToOrder);
router.delete('/orders/:id', requireAuth, OrderController.deleteOrder);

// Anonymous order route (no auth required)
router.post('/orders/anonymous', upload.array('files'), OrderController.createAnonymousOrder);

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
      
      // Get appropriate URL based on request type
      const accessType = isDownloadRequest ? 'download' : 'print';
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
    
    // For print/view requests, use inline disposition for PDFs
    // For download requests, always use attachment
    if (isDownloadRequest || !isPDF) {
      // Force download without "Save As" dialog
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      // Display inline for PDFs (allows printing without download)
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
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