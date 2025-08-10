import { Router } from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Notification routes
router.get('/notifications/user/:userId', requireAuth, NotificationController.getNotificationsByUser);
router.get('/notifications/:userId', requireAuth, NotificationController.getNotificationsByUser); // Alias
router.patch('/notifications/:notificationId/read', requireAuth, NotificationController.markNotificationAsRead);
router.delete('/notifications/:notificationId', requireAuth, NotificationController.deleteNotification);
router.patch('/notifications/user/:userId/read-all', requireAuth, NotificationController.markAllAsRead);

export default router;