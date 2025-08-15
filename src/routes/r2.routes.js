import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import storageManager from '../../server/storage/storageManager.js';
import r2Client from '../../server/storage/r2Client.js';
import { Order } from '../models/index.js';

const router = Router();

// Get presigned upload URL for order files
router.post('/orders/:orderId/upload-url', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { filename, mimetype, size } = req.body;
    
    if (!filename || !mimetype) {
      return res.status(400).json({ error: 'Missing filename or mimetype' });
    }
    
    // Verify order exists and user has access
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check permissions
    if (order.customerId !== req.user.id && req.user.role !== 'admin') {
      const isShopOwner = req.user.role === 'shop_owner' && order.shopId === req.user.shopId;
      if (!isShopOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Generate R2 key and presigned URL
    const key = r2Client.generateKey(orderId, filename);
    const uploadUrl = await r2Client.getPresignedUploadUrl(key, mimetype);
    
    res.json({
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Confirm file upload and save metadata
router.post('/orders/:orderId/confirm-upload', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { key, filename, size } = req.body;
    
    // Verify order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order files metadata
    let files = order.files || [];
    if (typeof files === 'string') {
      files = JSON.parse(files);
    }
    
    const newFile = {
      filename: filename,
      originalName: filename,
      r2Key: key,
      path: key,
      size: size,
      storageType: 'r2',
      uploadedAt: new Date().toISOString()
    };
    
    files.push(newFile);
    await order.update({ files });
    
    res.json({
      fileId: files.length - 1,
      cdnUrl: `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

// Get batch download URLs for order files
router.post('/orders/:orderId/download-urls', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { fileIds } = req.body;
    
    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get files
    let files = order.files || [];
    if (typeof files === 'string') {
      files = JSON.parse(files);
    }
    
    // Filter requested files
    const requestedFiles = fileIds 
      ? files.filter((_, index) => fileIds.includes(index))
      : files;
    
    // Generate download URLs
    const urls = await storageManager.getBatchUrls(requestedFiles, 'download');
    
    res.json({ urls });
  } catch (error) {
    console.error('Error generating download URLs:', error);
    res.status(500).json({ error: 'Failed to generate download URLs' });
  }
});

// Get batch print URLs for order files
router.post('/orders/:orderId/print-urls', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { fileIds } = req.body;
    
    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get files
    let files = order.files || [];
    if (typeof files === 'string') {
      files = JSON.parse(files);
    }
    
    // Filter requested files
    const requestedFiles = fileIds 
      ? files.filter((_, index) => fileIds.includes(index))
      : files;
    
    // Generate print URLs (inline disposition)
    const urls = await storageManager.getBatchUrls(requestedFiles, 'print');
    
    res.json({ urls });
  } catch (error) {
    console.error('Error generating print URLs:', error);
    res.status(500).json({ error: 'Failed to generate print URLs' });
  }
});

// Delete file from order
router.delete('/orders/:orderId/files/:fileId', requireAuth, async (req, res) => {
  try {
    const { orderId, fileId } = req.params;
    
    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check permissions
    if (order.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get files
    let files = order.files || [];
    if (typeof files === 'string') {
      files = JSON.parse(files);
    }
    
    const fileIndex = parseInt(fileId);
    if (fileIndex < 0 || fileIndex >= files.length) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete from storage
    const file = files[fileIndex];
    await storageManager.deleteFile(file);
    
    // Remove from array
    files.splice(fileIndex, 1);
    await order.update({ files });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Health check for R2
router.get('/r2/health', async (req, res) => {
  try {
    const isHealthy = await r2Client.healthCheck();
    const isAvailable = r2Client.isAvailable();
    
    res.json({
      healthy: isHealthy,
      available: isAvailable,
      bucket: process.env.R2_BUCKET_NAME,
      storageMode: isAvailable ? 'hybrid' : 'local-only'
    });
  } catch (error) {
    console.error('R2 health check error:', error);
    res.status(500).json({ 
      healthy: false,
      error: error.message 
    });
  }
});

export default router;