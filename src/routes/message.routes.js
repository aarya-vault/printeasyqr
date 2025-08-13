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

// 🚀 PERFORMANCE FIX: Optimized message file upload limits (consistent with orders)
const upload = multer({
  storage: createStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file (smaller than orders for faster chat)
    files: 5, // Up to 5 files per message (reduced for better UX)
    fieldSize: 5 * 1024 * 1024, // 5MB field size limit
    parts: 10 // Limit form parts
  },
  fileFilter: (req, file, cb) => {
    console.log(`💬 Processing message file: ${file.originalname} (${file.mimetype})`);
    cb(null, true); // Accept all file types
  }
});

// Message routes
router.get('/messages/order/:orderId', requireAuth, MessageController.getMessagesByOrder);
router.post('/messages', requireAuth, upload.array('files'), MessageController.sendMessage);
router.patch('/messages/mark-read', requireAuth, MessageController.markMessagesAsRead);
router.get('/messages/unread-count', requireAuth, MessageController.getUnreadCount);
router.delete('/messages/:messageId/files/:fileIndex', requireAuth, MessageController.deleteMessageFile);

export default router;