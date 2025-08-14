import { Router } from 'express';

const router = Router();

// Dynamic import based on environment with explicit logging
const getQRController = async () => {
  const env = process.env.NODE_ENV;
  console.log(`🔍 QR Controller Environment Check: NODE_ENV=${env}, isProduction=${env === 'production'}`);
  
  if (env === 'production') {
    // Use lightweight controller in production to avoid Puppeteer
    console.log('✅ Using lightweight QR controller for production');
    const { default: QRLightweightController } = await import('../controllers/qr-lightweight.controller.js');
    return QRLightweightController;
  } else {
    // Use full-featured controller in development
    console.log('🎨 Using full QR controller for development');
    const { default: QRController } = await import('../controllers/qr.controller.js');
    return QRController;
  }
};

// QR generation routes with dynamic controller
router.post('/generate-qr', async (req, res) => {
  const controller = await getQRController();
  return controller.generateQR(req, res);
});

router.post('/generate-image', async (req, res) => {
  const controller = await getQRController();
  return controller.generateQR(req, res);
});

router.post('/simple-qr', async (req, res) => {
  const controller = await getQRController();
  return controller.generateSimpleQR(req, res);
});

export default router;