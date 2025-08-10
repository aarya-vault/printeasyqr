import { Router } from 'express';
import MessageController from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for message attachments - Use memory storage for serverless environments
const isServerless = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
const storage = isServerless
  ? multer.memoryStorage() // Use memory storage for Netlify/serverless
  : multer.diskStorage({   // Use disk storage for development
      destination: 'uploads/',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage: storage,
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