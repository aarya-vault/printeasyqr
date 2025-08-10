import { Router } from 'express';
import ShopController from '../controllers/shop.controller.js';
import { requireAuth, requireShopOwner, requireAdmin, requireShopOwnerOrAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/shops', ShopController.getActiveShops);
router.get('/shops/slug/:slug', ShopController.getShopBySlug);
router.get('/shops/check-slug/:slug', ShopController.checkSlug);

// Protected routes
router.get('/shops/owner/:ownerId', requireAuth, ShopController.getShopByOwnerId);
router.get('/shops/:id', requireAuth, ShopController.getShopById); // Get shop by ID
router.patch('/shops/settings', requireAuth, ShopController.updateShopSettings); // Shop settings
router.get('/customer/:customerId/unlocked-shops', requireAuth, ShopController.getUnlockedShops);
router.post('/unlock-shop/:shopSlug', requireAuth, ShopController.unlockShop);
router.patch('/shops/:id/toggle-status', requireAuth, ShopController.toggleShopStatus);

export default router;