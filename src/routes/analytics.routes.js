import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { requireAuth, requireAdmin, requireShopOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin analytics routes
router.get('/admin/enhanced', requireAuth, requireAdmin, AnalyticsController.getEnhancedAdminAnalytics);

// Shop owner analytics routes
router.get('/shop/:shopId', requireAuth, requireShopOwner, AnalyticsController.getShopOwnerAnalytics);

// Event tracking routes
router.post('/track/unlock', requireAuth, AnalyticsController.trackCustomerUnlock);
router.post('/track/qr-scan', AnalyticsController.trackQRScan); // Allow anonymous scans

export default router;