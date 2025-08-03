const router = require('express').Router();
const AdminController = require('../controllers/admin.controller');
const UserController = require('../controllers/user.controller');
const ShopController = require('../controllers/shop.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// Admin statistics
router.get('/stats', requireAuth, requireAdmin, AdminController.getPlatformStats);
router.get('/revenue-analytics', requireAuth, requireAdmin, AdminController.getRevenueAnalytics);

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

module.exports = router;