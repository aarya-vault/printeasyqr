const router = require('express').Router();
const ShopController = require('../controllers/shop.controller');
const { requireAuth, requireShopOwner, requireAdmin, requireShopOwnerOrAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/shops', ShopController.getActiveShops);
router.get('/shops/slug/:slug', ShopController.getShopBySlug);
router.get('/shops/check-slug/:slug', ShopController.checkSlug);

// Protected routes
router.get('/shops/owner/:ownerId', requireAuth, ShopController.getShopByOwnerId);
router.get('/customer/:customerId/unlocked-shops', requireAuth, ShopController.getUnlockedShops);
router.post('/unlock-shop/:shopSlug', requireAuth, ShopController.unlockShop);
router.patch('/shops/:id/toggle-status', requireAuth, ShopController.toggleShopStatus);

module.exports = router;