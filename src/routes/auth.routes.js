import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Authentication routes
router.post('/auth/phone-login', AuthController.phoneLogin);
router.post('/auth/email-login', AuthController.emailLogin);
router.post('/auth/admin/login', AuthController.emailLogin); // Admin login alias for frontend compatibility
router.get('/auth/me', requireAuth, AuthController.getCurrentUser);
router.get('/auth/session', requireAuth, AuthController.getCurrentUser); // Alias for compatibility
router.post('/auth/logout', AuthController.logout);

export default router;