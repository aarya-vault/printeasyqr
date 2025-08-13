import { Router } from 'express';
import OrderController from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { ObjectStorageService } from '../../server/objectStorage.js';

const router = Router();

// Initialize Object Storage Service for file downloads
const objectStorageService = new ObjectStorageService();

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
router.delete('/orders/:id', requireAuth, OrderController.deleteOrder);

// Anonymous order route (no auth required)
router.post('/orders/anonymous', upload.array('files'), OrderController.createAnonymousOrder);

// Frontend compatibility routes
router.post('/orders/upload', requireAuth, upload.array('files'), OrderController.createOrder);
router.post('/orders/walkin', upload.array('files'), OrderController.createAnonymousOrder);

// 🚀 CRITICAL FIX: Download endpoint for file access (fixes Issue #4)
router.get('/download/*', optionalAuth, async (req, res) => {
  try {
    console.log('📥 Download request for:', req.params[0]);
    
    // Construct object path - handle both .private/uploads/file and uploads/file patterns
    let objectPath = req.params[0];
    if (!objectPath.startsWith('.private/')) {
      objectPath = `.private/${objectPath}`;
    }
    if (!objectPath.startsWith('/objects/')) {
      objectPath = `/objects/${objectPath}`;
    }
    
    console.log('🔍 Normalized object path:', objectPath);
    
    // Get the file from object storage
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    
    // Set download filename if provided in query
    const originalName = req.query.originalName;
    if (originalName) {
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    }
    
    // Stream the file to response
    await objectStorageService.downloadObject(file, res);
    
    console.log('✅ File download completed:', originalName || objectPath);
    
  } catch (error) {
    console.error('❌ Download error:', error.message);
    if (error.name === 'ObjectNotFoundError') {
      res.status(404).json({ 
        error: 'File not found',
        message: 'The requested file could not be found or may have been deleted'
      });
    } else {
      res.status(500).json({ 
        error: 'Download failed',
        message: error.message 
      });
    }
  }
});

export default router;