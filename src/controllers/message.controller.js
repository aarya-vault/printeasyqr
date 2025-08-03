import { Message, Order, User, Shop } from '../models/index.js';
import { Op } from 'sequelize';
import { sendToUser } from '../utils/websocket.js';

class MessageController {
  // Data transformation helper for consistent API responses
  static transformMessageData(message) {
    if (!message) return null;
    
    const messageData = message.toJSON ? message.toJSON() : message;
    
    return {
      id: messageData.id,
      orderId: messageData.orderId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      content: messageData.content,
      files: messageData.files,
      messageType: messageData.messageType,
      isRead: messageData.isRead,
      createdAt: messageData.createdAt,
      // Include sender data if present
      sender: messageData.sender ? {
        id: messageData.sender.id,
        name: messageData.sender.name,
        phone: messageData.sender.phone,
        role: messageData.sender.role
      } : undefined
    };
  }
  // Get messages by order
  static async getMessagesByOrder(req, res) {
    try {
      const orderId = parseInt(req.params.orderId);
      const messages = await Message.findAll({
        where: { orderId },
        include: [{ model: User, as: 'sender' }],
        order: [['createdAt', 'ASC']]
      });
      
      const transformedMessages = messages.map(message => MessageController.transformMessageData(message));
      res.json(transformedMessages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  }

  // Send message
  static async sendMessage(req, res) {
    try {
      const { orderId, senderId, senderName, senderRole, content, messageType = 'text' } = req.body;
      
      if (!orderId || !senderId || !senderName) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Handle file uploads
      let fileData = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        fileData = req.files.map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        }));
      }
      
      const message = await Message.create({
        orderId: parseInt(orderId),
        senderId: parseInt(senderId),
        senderName,
        senderRole: senderRole || 'customer',
        content: content || '',
        files: fileData ? JSON.stringify(fileData) : null,
        messageType: fileData ? 'file' : messageType
      });
      
      const messageWithSender = await Message.findByPk(message.id, {
        include: [{ model: User, as: 'sender' }]
      });
      
      // Send real-time notification to the other party
      const order = await Order.findByPk(parseInt(orderId), {
        include: [{ model: Shop, as: 'shop' }]
      });
      
      const transformedMessage = MessageController.transformMessageData(messageWithSender);
      
      if (order) {
        const recipientId = parseInt(senderId) === order.customerId 
          ? order.shop.ownerId 
          : order.customerId;
        
        sendToUser(recipientId, {
          type: 'new_message',
          message: transformedMessage,
          orderId: order.id
        });
      }
      
      res.json(transformedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(req, res) {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;
      
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID required' });
      }
      
      // Mark all messages in the order as read for this user
      await Message.update(
        { isRead: true },
        {
          where: {
            orderId: parseInt(orderId),
            senderId: { [Op.ne]: userId }
          }
        }
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  }

  // Get unread message count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      const count = await Message.count({
        where: {
          senderId: { [Op.ne]: userId },
          isRead: false
        },
        include: [{
          model: Order,
          as: 'order',
          where: {
            [Op.or]: [
              { customerId: userId },
              { '$order.shop.ownerId$': userId }
            ]
          },
          include: [{ model: Shop, as: 'shop' }]
        }]
      });
      
      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  }
}

export default MessageController;