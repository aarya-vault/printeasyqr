import { Router } from 'express';
import QRController from '../controllers/qr.controller.js';

const router = Router();

// QR generation routes - LOCAL IMPLEMENTATION (No Vercel dependency)
router.post('/generate-qr', QRController.generateQR);
router.post('/generate-image', QRController.generateQR); // Alias for compatibility
router.post('/simple-qr', QRController.generateSimpleQR);

export default router;