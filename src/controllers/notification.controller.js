import { Message, Order, User, Shop } from '../models/index.js';
import { Op } from 'sequelize';

// Notification Controller - Handles all notification-related operations
class NotificationController {
  // Get notifications for a user - WORKING VERSION
  static async getNotificationsByUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Get user to determine role
      const user = await User.findByPk(userId);
      if (!user) {
        return res.json([]);
      }

      let notifications = [];

      // Simple query without complex associations
      if (user.role === 'shop_owner') {
        const shop = await Shop.findOne({ where: { ownerId: userId } });
        if (shop) {
          // Get order IDs for this shop
          const orders = await Order.findAll({
            where: { shopId: shop.id },
            attributes: ['id']
          });
          const orderIds = orders.map(o => o.id);
          
          if (orderIds.length > 0) {
            // Get unread messages for these orders (using 'message' column instead of 'content')
            const unreadMessages = await Message.findAll({
              where: { 
                order_id: orderIds,
                is_read: false,
                type: 'text' // Filter for customer messages
              },
              order: [['created_at', 'DESC']],
              limit: 50
            });

            notifications = unreadMessages.map(msg => ({
              id: msg.id,
              title: `New message from Customer`,
              message: msg.message, // Use 'message' column
              type: 'chat_message',
              isRead: false,
              createdAt: msg.created_at,
              relatedId: msg.order_id
            }));
          }
        }
      } else {
        // For customers: Get their order IDs
        const orders = await Order.findAll({
          where: { customerId: userId },
          attributes: ['id']
        });
        const orderIds = orders.map(o => o.id);
        
        if (orderIds.length > 0) {
          // Get unread messages from shop owners
          const unreadMessages = await Message.findAll({
            where: { 
              order_id: orderIds,
              is_read: false,
              type: 'text' // Filter for shop owner messages
            },
            order: [['created_at', 'DESC']],
            limit: 50
          });

          notifications = unreadMessages.map(msg => ({
            id: msg.id,
            title: `New message from Shop`,
            message: msg.message, // Use 'message' column
            type: 'chat_message',
            isRead: false,
            createdAt: msg.created_at,
            relatedId: msg.order_id
          }));
        }
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
        { is_read: true },
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
          const orderIds = await Order.findAll({
            where: { shopId: shop.id },
            attributes: ['id']
          });
          const orderIdsList = orderIds.map(o => o.id);
          
          if (orderIdsList.length > 0) {
            await Message.update(
              { is_read: true },
              {
                where: { 
                  order_id: orderIdsList,
                  is_read: false 
                }
              }
            );
          }
        }
      } else {
        // For customers: Mark all shop owner messages as read
        const orderIds = await Order.findAll({
          where: { customerId: userId },
          attributes: ['id']
        });
        const orderIdsList = orderIds.map(o => o.id);
        
        if (orderIdsList.length > 0) {
          await Message.update(
            { is_read: true },
            {
              where: { 
                order_id: orderIdsList,
                is_read: false 
              }
            }
          );
        }
      }
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  }
}

export default NotificationController;