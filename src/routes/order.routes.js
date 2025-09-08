import { Router } from 'express';
import OrderController from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import storageManager from '../../server/storage/storageManager.js';
import { 
  r2UploadLimiter, 
  uploadQueueMiddleware,
  systemHealthMonitor 
} from '../middleware/rateLimiter.js';

const router = Router();

// File upload limits for R2 direct uploads
const FILE_LIMITS = {
  maxFileSize: 300 * 1024 * 1024, // 300MB per file
  maxTotalSize: 1024 * 1024 * 1024, // 1GB total per order
  maxFiles: 200 // Up to 200 files per order
};

// Order routes - Files handled via R2 direct upload, not multer
router.post('/orders/authenticated', requireAuth, OrderController.createAuthenticatedOrder); // Authenticated order creation (no files via multer)
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
router.post('/orders', requireAuth, OrderController.createOrder); // Legacy route (files handled separately)
router.patch('/orders/:id', requireAuth, OrderController.updateOrder); // General order update
router.patch('/orders/:id/status', requireAuth, OrderController.updateOrderStatus);
// Add files endpoint - now uses R2 direct upload instead of multer
router.post('/orders/:id/add-files', requireAuth, OrderController.addFilesToOrderR2);
router.delete('/orders/:id', requireAuth, OrderController.deleteOrder);

// Anonymous order route - deprecated (use authenticated flow)
// router.post('/orders/anonymous', upload.array('files'), OrderController.createAnonymousOrder);

// Direct R2 upload with batch presigned URLs - WITH RATE LIMITING
router.post('/orders/:id/get-upload-urls', 
  requireAuth, 
  systemHealthMonitor, // Check system health first
  r2UploadLimiter, // Apply rate limiting
  uploadQueueMiddleware, // Manage concurrent uploads
  async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { files } = req.body; // Array of {name, type, size}
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array required' });
    }

    // Validate file limits for R2 direct upload
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Check individual file size limits
    const oversizedFiles = files.filter(file => file.size > FILE_LIMITS.maxFileSize);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({ 
        error: 'File size limit exceeded',
        details: `Maximum file size is ${Math.round(FILE_LIMITS.maxFileSize / (1024 * 1024))}MB. Files exceeding limit: ${oversizedFiles.map(f => f.name).join(', ')}` 
      });
    }

    // Check total size limit
    if (totalSize > FILE_LIMITS.maxTotalSize) {
      return res.status(400).json({ 
        error: 'Total size limit exceeded',
        details: `Maximum total size is ${Math.round(FILE_LIMITS.maxTotalSize / (1024 * 1024 * 1024))}GB. Current total: ${Math.round(totalSize / (1024 * 1024))}MB` 
      });
    }

    // Check file count limit
    if (files.length > FILE_LIMITS.maxFiles) {
      return res.status(400).json({ 
        error: 'Too many files',
        details: `Maximum ${FILE_LIMITS.maxFiles} files allowed per order` 
      });
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
    
    // Import R2 client for direct uploads
    const r2Client = (await import('../../server/storage/r2Client.js')).default;
    
    // Check if R2 is available for direct uploads
    if (!r2Client.isAvailable()) {
      return res.status(200).json({ useDirectUpload: false });
    }
    
    // Use batch presigned URL generation with file limit validation
    const uploadUrls = await r2Client.getBatchPresignedUrls(files, orderId);
    
    res.json({ 
      useDirectUpload: true,
      uploadUrls,
      limits: FILE_LIMITS, // Send limits to frontend
      serverBypass: true // Flag indicating server is completely bypassed
    });
  } catch (error) {
    console.error('Error generating upload URLs:', error);
    res.status(500).json({ error: 'Failed to generate upload URLs' });
  }
});

// 🚀 R2 DIRECT UPLOAD: File confirmation after direct upload to R2 - WITH RATE LIMITING
router.post('/orders/:orderId/confirm-files', 
  requireAuth,
  systemHealthMonitor, // Check system health
  r2UploadLimiter, // Apply rate limiting
  OrderController.confirmFilesUpload);

// Multipart upload endpoints removed - using direct upload only

// 🚀 TRUE R2 DIRECT UPLOAD: No proxy - files go directly to R2
// Proxy endpoint removed - files now upload directly to R2 using presigned URLs

// Frontend compatibility routes - REMOVED FALLBACK ROUTES TO PREVENT MEMORY ISSUES
// These routes were causing memory problems by buffering entire files in RAM
// All uploads now use direct R2 presigned URLs only

// Download routes moved to dedicated download.routes.js

export default router;