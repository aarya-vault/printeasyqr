import { Router } from 'express';

const router = Router();

// Always use the full QR controller with Puppeteer (no more lightweight approach)
const getQRController = async () => {
  console.log('🎨 Using full QR controller with Puppeteer for all environments');
  const { default: QRController } = await import('../controllers/qr.controller.js');
  return QRController;
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