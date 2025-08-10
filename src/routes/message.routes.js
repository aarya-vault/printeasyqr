import { Router } from 'express';
import MessageController from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for message attachments - Lazy initialization to prevent module load failures
function createStorage() {
  const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
  
  if (isServerless) {
    return multer.memoryStorage(); // Use memory storage for Netlify/serverless
  } else {
    // Only create disk storage if we're not in serverless environment
    try {
      return multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
      });
    } catch (error) {
      console.log('⚠️ Falling back to memory storage due to disk storage error:', error.message);
      return multer.memoryStorage();
    }
  }
}

const upload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 10 // Up to 10 files per message
  }
});

// Message routes
router.get('/messages/order/:orderId', requireAuth, MessageController.getMessagesByOrder);
router.post('/messages', requireAuth, upload.array('files'), MessageController.sendMessage);
router.patch('/messages/mark-read', requireAuth, MessageController.markMessagesAsRead);
router.get('/messages/unread-count', requireAuth, MessageController.getUnreadCount);

export default router;