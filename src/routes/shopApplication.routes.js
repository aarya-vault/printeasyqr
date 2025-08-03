const router = require('express').Router();
const ShopApplicationController = require('../controllers/shopApplication.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

// Public route for submitting applications
router.post('/shop-applications', ShopApplicationController.createApplication);

// Admin routes
router.get('/shop-applications', requireAuth, requireAdmin, ShopApplicationController.getAllApplications);
router.get('/shop-applications/:id', requireAuth, requireAdmin, ShopApplicationController.getApplication);
router.patch('/shop-applications/:id', requireAuth, requireAdmin, ShopApplicationController.updateApplicationStatus);

module.exports = router;