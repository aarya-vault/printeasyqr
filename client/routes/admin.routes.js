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

export default router;