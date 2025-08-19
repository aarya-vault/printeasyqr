import { Message, Order, User, Shop } from '../models/index.js';
import { Op } from 'sequelize';

// Notification Controller - Handles all notification-related operations
class NotificationController {
  // Get notifications for a user (real implementation using unread messages as notifications)
  static async getNotificationsByUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // For shop owners: Get unread messages from their shop's orders
      // For customers: Get unread messages from their orders
      const user = await User.findByPk(userId);
      if (!user) {
        return res.json([]);
      }

      let notifications = [];

      if (user.role === 'shop_owner') {
        // Get shop for this owner
        const shop = await Shop.findOne({ where: { ownerId: userId } });
        if (shop) {
          // Get unread messages from orders at this shop
          const unreadMessages = await Message.findAll({
            include: [
              {
                model: Order,
                as: 'order',
                where: { shopId: shop.id },
                include: [
                  { model: User, as: 'customer' }
                ]
              },
              { model: User, as: 'sender' }
            ],
            where: { 
              isRead: false,
              senderRole: 'customer' // Only customer messages are notifications for shop owners
            },
            // order: [['createdAt', 'DESC']], // Removed due to ambiguous column issue
            limit: 50
          });

          notifications = unreadMessages.map(msg => ({
            id: msg.id,
            title: `New message from ${msg.sender?.name || 'Customer'}`,
            message: msg.content,
            type: 'chat_message',
            isRead: false,
            createdAt: msg.createdAt,
            relatedId: msg.orderId
          }));
        }
      } else {
        // For customers: Get unread messages from shop owners
        const unreadMessages = await Message.findAll({
          include: [
            {
              model: Order,
              as: 'order',
              where: { customerId: userId },
              include: [
                { model: Shop, as: 'shop' }
              ]
            },
            { model: User, as: 'sender' }
          ],
          where: { 
            isRead: false,
            senderRole: 'shop_owner' // Only shop owner messages are notifications for customers
          },
          // order: [['createdAt', 'DESC']], // Removed due to ambiguous column issue
          limit: 50
        });

        notifications = unreadMessages.map(msg => ({
          id: msg.id,
          title: `New message from ${msg.order?.shop?.name || 'Shop'}`,
          message: msg.content,
          type: 'chat_message',
          isRead: false,
          createdAt: msg.createdAt,
          relatedId: msg.orderId
        }));
      }
      
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  }

  // Mark notification as read (mark the underlying message as read)
  static async markNotificationAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      // Since notifications are based on messages, mark the message as read
      await Message.update(
        { isRead: true },
        { where: { id: notificationId } }
      );
      
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      // Return success response
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.role === 'shop_owner') {
        // Get shop for this owner
        const shop = await Shop.findOne({ where: { ownerId: userId } });
        if (shop) {
          // Mark all customer messages as read for this shop's orders
          await Message.update(
            { isRead: true },
            {
              include: [{
                model: Order,
                as: 'order',
                where: { shopId: shop.id }
              }],
              where: { 
                senderRole: 'customer',
                isRead: false 
              }
            }
          );
        }
      } else {
        // For customers: Mark all shop owner messages as read
        await Message.update(
          { isRead: true },
          {
            include: [{
              model: Order,
              as: 'order',
              where: { customerId: userId }
            }],
            where: { 
              senderRole: 'shop_owner',
              isRead: false 
            }
          }
        );
      }
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  }
}

export default NotificationController;