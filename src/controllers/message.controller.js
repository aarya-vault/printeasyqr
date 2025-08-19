import { Message, Order, User, Shop } from '../models/index.js';
import { Op } from 'sequelize';
import { sendToUser } from '../utils/websocket.js';
import { uploadFilesToObjectStorage } from '../utils/objectStorageUpload.js';

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

      // 🚀 OBJECT STORAGE FIX: Upload files to object storage for chat attachments
      let fileData = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`📤 Processing ${req.files.length} files for chat message object storage upload...`);
        try {
          const uploadedFiles = await uploadFilesToObjectStorage(req.files);
          fileData = uploadedFiles;
          console.log(`✅ Successfully uploaded ${uploadedFiles.length} files for chat message`);
        } catch (uploadError) {
          console.error('❌ Chat message object storage upload failed:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload files to storage',
            error: uploadError.message 
          });
        }
      }
      
      const message = await Message.create({
        orderId: parseInt(orderId),
        senderId: parseInt(senderId),
        senderName,
        senderRole: senderRole || 'customer',
        content: content || '',
        files: fileData ? JSON.stringify(fileData) : null,
        messageType: fileData ? 'file' : messageType,
        isRead: false  // Explicitly mark as unread for recipient
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
        
        // Send WebSocket notification to recipient
        console.log(`📨 Sending message notification: ${senderId} -> ${recipientId}`);
        sendToUser(recipientId, {
          type: 'new_message',
          message: transformedMessage,
          orderId: order.id
        });
        
        // Also send unread count update to recipient
        sendToUser(recipientId, {
          type: 'unread_count_update',
          trigger: 'new_message'
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
      const [updatedCount] = await Message.update(
        { isRead: true },
        {
          where: {
            orderId: parseInt(orderId),
            senderId: { [Op.ne]: userId }
          }
        }
      );
      
      console.log(`✅ Mark as read success: ${JSON.stringify({ updatedCount })}`);
      console.log(`🔄 Mark as read success - invalidating queries: ${JSON.stringify([`/api/orders/shop/${orderId}`])}`);
      
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
      const userRole = req.user.role;
      
      let whereCondition = {
        senderId: { [Op.ne]: userId },
        isRead: false
      };
      
      // For customers: count unread messages in their orders
      if (userRole === 'customer') {
        const customerOrders = await Order.findAll({
          where: { customerId: userId },
          attributes: ['id']
        });
        
        const orderIds = customerOrders.map(order => order.id);
        if (orderIds.length > 0) {
          whereCondition.orderId = { [Op.in]: orderIds };
        } else {
          return res.json({ unreadCount: 0 });
        }
      }
      // For shop owners: count unread messages in their shop's orders
      else if (userRole === 'shop_owner') {
        const ownerShops = await Shop.findAll({
          where: { ownerId: userId },
          attributes: ['id']
        });
        
        if (ownerShops.length === 0) {
          return res.json({ unreadCount: 0 });
        }
        
        const shopIds = ownerShops.map(shop => shop.id);
        const shopOrders = await Order.findAll({
          where: { shopId: { [Op.in]: shopIds } },
          attributes: ['id']
        });
        
        const orderIds = shopOrders.map(order => order.id);
        if (orderIds.length > 0) {
          whereCondition.orderId = { [Op.in]: orderIds };
        } else {
          return res.json({ unreadCount: 0 });
        }
      }
      
      const count = await Message.count({ where: whereCondition });
      
      res.json({ unreadCount: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  }

  // Delete file from message (fixes Issue #2)
  static async deleteMessageFile(req, res) {
    try {
      const { messageId, fileIndex } = req.params;
      const userId = req.user.id;
      
      // Get the message and verify permissions
      const message = await Message.findByPk(parseInt(messageId));
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      // Verify user has permission to delete this file
      if (message.senderId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this file' });
      }
      
      // Parse files array
      let files = [];
      if (message.files) {
        try {
          files = typeof message.files === 'string' ? JSON.parse(message.files) : message.files;
        } catch (error) {
          return res.status(400).json({ message: 'Invalid file data format' });
        }
      }
      
      const fileIndexNum = parseInt(fileIndex);
      if (fileIndexNum < 0 || fileIndexNum >= files.length) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const fileToDelete = files[fileIndexNum];
      console.log('Attempting to delete file:', fileToDelete);
      
      // Delete file from local storage
      const fs = await import('fs');
      const path = await import('path');
      
      try {
        // Construct local file path
        let filePath = fileToDelete.path;
        if (filePath.startsWith('/uploads/')) {
          filePath = path.join(process.cwd(), filePath);
        } else if (filePath.startsWith('/objects/')) {
          // Handle legacy object storage paths
          filePath = path.join(process.cwd(), 'uploads', path.basename(filePath));
        }
        
        // Check if file exists and delete it
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Successfully deleted file from local storage:', filePath);
        }
        
        // Remove file from array and update message
        files.splice(fileIndexNum, 1);
        await message.update({ files: JSON.stringify(files) });
        
        console.log('Successfully deleted file and updated message');
        res.json({ 
          success: true, 
          message: 'File deleted successfully',
          remainingFiles: files.length 
        });
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
        // Even if file deletion fails, remove from database
        files.splice(fileIndexNum, 1);
        await message.update({ files: JSON.stringify(files) });
        
        res.json({ 
          success: true, 
          message: 'File reference removed',
          remainingFiles: files.length 
        });
      }
      
    } catch (error) {
      console.error('Delete message file error:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  }
}

export default MessageController;