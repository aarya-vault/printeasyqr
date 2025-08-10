import { Router } from 'express';
import OrderController from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 100 // Up to 100 files at once
  },
  fileFilter: (req, file, cb) => {
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

export default router;