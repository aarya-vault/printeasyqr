const router = require('express').Router();
const OrderController = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

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
router.get('/orders/customer/:customerId', requireAuth, OrderController.getOrdersByCustomer);
router.get('/orders/:id', requireAuth, OrderController.getOrder);
router.post('/orders', requireAuth, upload.array('files'), OrderController.createOrder);
router.patch('/orders/:id/status', requireAuth, OrderController.updateOrderStatus);

// Anonymous order route (no auth required)
router.post('/orders/anonymous', upload.array('files'), OrderController.createAnonymousOrder);

module.exports = router;