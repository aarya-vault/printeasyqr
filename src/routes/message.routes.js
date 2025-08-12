import { Router } from 'express';
import MessageController from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for message attachments - Lazy initialization to prevent module load failures
// 🚀 OBJECT STORAGE FIX: Use object storage for all file uploads
function createStorage() {
  // Always use memory storage and upload to object storage
  return multer.memoryStorage();
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