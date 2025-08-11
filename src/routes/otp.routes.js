// OTP Authentication Routes
import express from 'express';
import OTPController from '../controllers/otp.controller.js';

const router = express.Router();

// WhatsApp OTP routes
router.post('/send-otp', OTPController.sendOTP);
router.post('/verify-otp', OTPController.verifyOTP);
router.post('/refresh-token', OTPController.refreshToken);

export default router;