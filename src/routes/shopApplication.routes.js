import { Router } from 'express';
import ShopApplicationController from '../controllers/shopApplication.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public route for submitting applications
router.post('/shop-applications', ShopApplicationController.createApplication);

// Admin routes
router.get('/shop-applications', requireAuth, requireAdmin, ShopApplicationController.getAllApplications);
router.get('/shop-applications/:id', requireAuth, requireAdmin, ShopApplicationController.getApplication);
router.patch('/shop-applications/:id', requireAuth, requireAdmin, ShopApplicationController.updateApplicationStatus);

export default router;