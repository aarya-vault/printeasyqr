import { Router } from 'express';
import AdminController from '../controllers/admin.controller.js';
import UserController from '../controllers/user.controller.js';
import ShopController from '../controllers/shop.controller.js';
import ShopApplicationController from '../controllers/shopApplication.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Admin statistics
router.get('/stats', requireAuth, requireAdmin, AdminController.getPlatformStats);
router.get('/revenue-analytics', requireAuth, requireAdmin, AdminController.getRevenueAnalytics);
router.get('/shop-orders', requireAuth, requireAdmin, AdminController.getAllShopOrders);

// User management
router.get('/users', requireAuth, requireAdmin, UserController.getAllUsers);
router.delete('/users/:id', requireAuth, requireAdmin, UserController.deleteUser);
router.patch('/users/:id', requireAuth, requireAdmin, UserController.updateUser);
router.patch('/users/:id/status', requireAuth, requireAdmin, UserController.toggleUserStatus);

// Shop management
router.get('/shops', requireAuth, requireAdmin, ShopController.getAllShops);
router.get('/shops/:id/complete', requireAuth, requireAdmin, AdminController.getShopComplete);
router.put('/shops/:id', requireAuth, requireAdmin, ShopController.updateShop);
router.patch('/shops/:id/deactivate', requireAuth, requireAdmin, ShopController.deactivateShop);
router.patch('/shops/:id/activate', requireAuth, requireAdmin, ShopController.activateShop);

// Shop Application management
router.get('/shop-applications', requireAuth, requireAdmin, ShopApplicationController.getAllApplications);
router.patch('/shop-applications/:id', requireAuth, requireAdmin, ShopApplicationController.updateApplicationStatus);

// Object Storage endpoints for admin shop exterior images
router.post('/objects/upload', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Generate presigned URL for shop exterior image upload
    const response = await fetch('http://127.0.0.1:1106/object-storage/signed-object-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucket_name: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1b4dcb0d-4d6c-4bd5-9fa1-4c7d43cf178f',
        object_name: `${process.env.PRIVATE_OBJECT_DIR}/uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`,
        method: 'PUT',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const { signed_url: uploadURL } = await response.json();
    res.json({ uploadURL });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

router.put('/shop-exterior-image', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { shopId, exteriorImageURL } = req.body;

    if (!shopId || !exteriorImageURL) {
      return res.status(400).json({ error: 'shopId and exteriorImageURL are required' });
    }

    // Import Shop model and ObjectStorageService
    const { Shop } = await import('../models/index.js');
    const { ObjectStorageService } = await import('../../../server/objectStorage.js');
    
    const objectStorageService = new ObjectStorageService();
    const objectPath = objectStorageService.normalizeObjectEntityPath(exteriorImageURL);
    
    console.log('🖼️ Image path conversion:', {
      original: exteriorImageURL,
      normalized: objectPath
    });
    
    // Update the shop with the exterior image path
    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    await shop.update({ exteriorImage: objectPath });

    res.json({ 
      success: true, 
      objectPath,
      message: 'Shop exterior image updated successfully'
    });
  } catch (error) {
    console.error('Error updating shop exterior image:', error);
    res.status(500).json({ error: 'Failed to update shop exterior image' });
  }
});

export default router;