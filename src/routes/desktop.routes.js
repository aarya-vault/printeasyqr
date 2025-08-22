import express from 'express';
import { Order, Shop, User } from '../models/index.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../server/storage/r2Client.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to authenticate desktop app requests
const authenticateDesktopApp = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;
  
  // Check for API key (desktop app authentication)
  if (apiKey) {
    // For MVP, we'll use a simple API key validation
    // In production, store these in database with shop associations
    if (apiKey === process.env.DESKTOP_API_KEY || apiKey === 'printeasy-desktop-2025') {
      next();
    } else {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }
  // Also allow JWT authentication for shop owners
  else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Generate pre-signed URLs for R2 files
const generatePresignedUrl = async (r2Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'printeasy-qr',
      Key: r2Key,
    });
    
    // Generate URL with 1 hour expiration
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return null;
  }
};

// Get job details for desktop app
router.get('/job/:jobId', authenticateDesktopApp, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Handle both regular orders and batch jobs
    if (jobId.startsWith('BATCH-')) {
      // Handle batch job (multiple orders)
      const batchId = jobId.replace('BATCH-', '');
      const orderIds = batchId.split(',');
      
      const orders = await Order.findAll({
        where: { 
          id: orderIds 
        },
        include: [
          { model: Shop, as: 'shop' },
          { model: User, as: 'customer' }
        ]
      });
      
      if (!orders || orders.length === 0) {
        return res.status(404).json({ error: 'Batch orders not found' });
      }
      
      // Collect all files from all orders
      const allFiles = [];
      for (const order of orders) {
        if (order.files) {
          const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
          
          for (const file of files) {
            let fileUrl;
            
            // Generate appropriate URL based on storage type
            if (file.storageType === 'r2' && file.r2Key) {
              fileUrl = await generatePresignedUrl(file.r2Key);
            } else {
              // Local storage - use download endpoint
              const host = req.get('host');
              const protocol = req.protocol;
              fileUrl = `${protocol}://${host}/api/download/${file.path || file.filename}?storageType=local`;
            }
            
            allFiles.push({
              name: file.originalName || file.filename || 'document',
              url: fileUrl,
              type: file.mimetype ? file.mimetype.split('/')[1] : 'unknown',
              size: file.size || 0,
              orderId: order.publicId || order.id
            });
          }
        }
      }
      
      return res.json({
        jobId: jobId,
        type: 'batch',
        orderCount: orders.length,
        shopId: orders[0].shopId,
        shopName: orders[0].shop?.name || 'Unknown Shop',
        files: allFiles,
        totalFiles: allFiles.length
      });
      
    } else {
      // Handle single order
      const order = await Order.findOne({
        where: { 
          publicId: jobId 
        },
        include: [
          { model: Shop, as: 'shop' },
          { model: User, as: 'customer' }
        ]
      });
      
      if (!order) {
        // Try with numeric ID as fallback
        const orderById = await Order.findOne({
          where: { id: parseInt(jobId) || 0 },
          include: [
            { model: Shop, as: 'shop' },
            { model: User, as: 'customer' }
          ]
        });
        
        if (!orderById) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        order = orderById;
      }
      
      // Parse files and generate URLs
      const filesArray = [];
      if (order.files) {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        
        for (const file of files) {
          let fileUrl;
          
          // Generate appropriate URL based on storage type
          if (file.storageType === 'r2' && file.r2Key) {
            fileUrl = await generatePresignedUrl(file.r2Key);
          } else {
            // Local storage - use download endpoint
            const host = req.get('host');
            const protocol = req.protocol;
            fileUrl = `${protocol}://${host}/api/download/${file.path || file.filename}?storageType=local`;
          }
          
          filesArray.push({
            name: file.originalName || file.filename || 'document',
            url: fileUrl,
            type: file.mimetype ? file.mimetype.split('/')[1] : 'unknown',
            size: file.size || 0
          });
        }
      }
      
      return res.json({
        jobId: order.publicId || order.id,
        orderNumber: order.orderNumber,
        shopId: order.shopId,
        shopName: order.shop?.name || 'Unknown Shop',
        customerName: order.customer?.name || 'Unknown Customer',
        customerPhone: order.customer?.phone || '',
        files: filesArray,
        specifications: order.specifications || '',
        isUrgent: order.isUrgent || false,
        createdAt: order.createdAt
      });
    }
    
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// Create batch job for multiple orders
router.post('/batch', authenticateDesktopApp, async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Invalid order IDs' });
    }
    
    // Generate batch ID
    const batchId = `BATCH-${orderIds.join(',')}`;
    
    // Verify all orders exist
    const orders = await Order.findAll({
      where: { id: orderIds }
    });
    
    if (orders.length !== orderIds.length) {
      return res.status(404).json({ error: 'Some orders not found' });
    }
    
    return res.json({
      batchId: batchId,
      orderCount: orders.length,
      protocolUrl: `printeasy-connect://?jobId=${batchId}`
    });
    
  } catch (error) {
    console.error('Error creating batch job:', error);
    return res.status(500).json({ error: 'Failed to create batch job' });
  }
});

export default router;