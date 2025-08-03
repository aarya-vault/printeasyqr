import { Order, Shop, User, Message, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';

class OrderController {
  // Get orders by shop
  static async getOrdersByShop(req, res) {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await Order.findAll({
        where: { 
          shopId,
          deletedAt: null
        },
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.json(orders || []);
    } catch (error) {
      console.error('Get shop orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  }

  // Get orders by customer
  static async getOrdersByCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await Order.findAll({
        where: { 
          customerId,
          deletedAt: null
        },
        include: [
          { model: Shop, as: 'shop' },
          { model: User, as: 'customer' }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.json(orders || []);
    } catch (error) {
      console.error('Get customer orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  }

  // Create order
  static async createOrder(req, res) {
    try {
      const { shopId, customerId, orderType, instructions } = req.body;
      
      // Get next order number for the shop
      const lastOrder = await Order.findOne({
        where: { shopId: parseInt(shopId) },
        order: [['orderNumber', 'DESC']]
      });
      
      const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
      
      // Process file uploads
      const files = req.files && Array.isArray(req.files) 
        ? req.files.map((file) => ({
            name: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }))
        : [];
      
      const newOrder = await Order.create({
        shopId: parseInt(shopId),
        customerId: parseInt(customerId),
        orderNumber,
        type: orderType || 'file_upload',
        title: `Order #${orderNumber}`,
        description: instructions || '',
        files,
        status: 'new'
      });
      
      const orderWithDetails = await Order.findByPk(newOrder.id, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      res.json(orderWithDetails);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status required' });
      }

      const order = await Order.findByPk(orderId, {
        include: [{ model: Shop, as: 'shop' }]
      });
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions
      if (order.shop.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await order.update({ status }, { transaction });

      // Auto delete files if order is completed
      if (status === 'completed') {
        await this.deleteOrderFiles(orderId, transaction);
      }
      
      await transaction.commit();
      
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      res.json(updatedOrder);
    } catch (error) {
      await transaction.rollback();
      console.error('Update order status error:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  }

  // Delete order files
  static async deleteOrderFiles(orderId, transaction = null) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order || !order.files) return;

      // Delete order files
      const files = order.files;
      for (const file of files) {
        if (file.path) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error(`Failed to delete file: ${file.path}`, error);
          }
        }
      }

      // Delete message files
      const messages = await Message.findAll({
        where: { orderId }
      });

      for (const message of messages) {
        if (message.files) {
          const messageFiles = JSON.parse(message.files);
          for (const file of messageFiles) {
            if (file.filename) {
              try {
                await fs.unlink(path.join('uploads', file.filename));
              } catch (error) {
                console.error(`Failed to delete message file: ${file.filename}`, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Delete order files error:', error);
    }
  }

  // Create anonymous order
  static async createAnonymousOrder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        shopId, customerName, customerPhone, type, 
        title, description, specifications, walkinTime 
      } = req.body;
      
      // Validate required fields
      if (!shopId || !customerName || !customerPhone || !type || !title) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate phone
      if (!/^[6-9][0-9]{9}$/.test(customerPhone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }

      // Find or create customer
      let customer = await User.findOne({ 
        where: { phone: customerPhone } 
      });
      
      if (!customer) {
        customer = await User.create({
          phone: customerPhone,
          name: customerName,
          role: 'customer'
        }, { transaction });
      }
      
      // Handle file uploads
      const files = req.files && Array.isArray(req.files)
        ? req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype
          }))
        : null;
      
      // Get next order number
      const lastOrder = await Order.findOne({
        where: { shopId: parseInt(shopId) },
        order: [['orderNumber', 'DESC']]
      });
      
      const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
      
      const newOrder = await Order.create({
        customerId: customer.id,
        shopId: parseInt(shopId),
        orderNumber,
        type: type,
        title,
        description: description || '',
        status: 'new',
        files: files,
        specifications: specifications || null,
        walkinTime: walkinTime || null,
        isUrgent: false
      }, { transaction });
      
      await transaction.commit();
      
      const orderWithDetails = await Order.findByPk(newOrder.id, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      res.json(orderWithDetails);
    } catch (error) {
      await transaction.rollback();
      console.error('Create anonymous order error:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  // Get single order
  static async getOrder(req, res) {
    try {
      const orderId = parseInt(req.params.id);
      const order = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ message: 'Failed to get order' });
    }
  }
}

export default OrderController;