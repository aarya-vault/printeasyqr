import express from 'express';
import ShopOwnerAnalyticsController from '../controllers/shopOwnerAnalytics.controller.js';
import { requireAuth, requireShopOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// Shop owner analytics routes
router.get('/shop/:shopId/analytics', requireAuth, requireShopOwner, ShopOwnerAnalyticsController.getShopAnalytics);
router.get('/shop/:shopId/customer-insights', requireAuth, requireShopOwner, ShopOwnerAnalyticsController.getCustomerInsights);

export default router;