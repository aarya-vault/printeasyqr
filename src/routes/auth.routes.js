import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

// Authentication routes
router.post('/auth/phone-login', AuthController.phoneLogin);
router.post('/auth/email-login', AuthController.emailLogin);
router.get('/auth/me', AuthController.getCurrentUser);
router.get('/auth/session', AuthController.getCurrentUser); // Alias for compatibility
router.post('/auth/logout', AuthController.logout);

export default router;