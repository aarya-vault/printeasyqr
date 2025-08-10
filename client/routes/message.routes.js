import { Router } from 'express';
import MessageController from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = Router();

// Configure multer for message attachments
const upload = multer({
  dest: 'uploads/',
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