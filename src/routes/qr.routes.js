import { Router } from 'express';

const router = Router();

// Dynamic import based on environment
const getQRController = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Use lightweight controller in production to avoid Puppeteer
    const { default: QRLightweightController } = await import('../controllers/qr-lightweight.controller.js');
    return QRLightweightController;
  } else {
    // Use full-featured controller in development
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