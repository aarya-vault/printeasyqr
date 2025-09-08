import { Router } from 'express';
import ReportsController from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Generate comprehensive order history report
router.get('/orders/shop/:shopId', ReportsController.generateOrderHistoryReport);

// Track print job requests
router.post('/print-jobs', ReportsController.trackPrintJob);

export default router;