import { Router } from 'express';
import { requireAuth, requireShopOwner } from '../middleware/auth.middleware.js';
import { getShopAnalytics, getCustomerInsights } from '../controllers/shopOwnerAnalytics.controller.js';

const router = Router();

// Protected routes - require shop owner authentication
router.get('/shop/:shopId/analytics', requireAuth, getShopAnalytics);
router.get('/shop/:shopId/customer-insights', requireAuth, getCustomerInsights);

export default router;