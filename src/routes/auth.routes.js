import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import OTPController from '../controllers/otp.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Traditional authentication routes
router.post('/auth/phone-login', AuthController.phoneLogin);
router.post('/auth/email-login', AuthController.emailLogin);
router.post('/auth/admin/login', AuthController.emailLogin); // Admin login alias for frontend compatibility
router.get('/auth/me', requireAuth, AuthController.getCurrentUser);
router.get('/auth/session', requireAuth, AuthController.getCurrentUser); // Alias for compatibility
router.post('/auth/logout', AuthController.logout);

// WhatsApp OTP authentication routes
router.post('/auth/send-otp', OTPController.sendOTP);
router.post('/auth/verify-otp', OTPController.verifyOTP);
router.post('/auth/refresh-token', OTPController.refreshToken);

export default router;