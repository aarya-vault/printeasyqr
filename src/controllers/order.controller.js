import { Order, Shop, User, Message, CustomerShopUnlock, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';
import { sendToUser } from '../utils/websocket.js';

class OrderController {
  // Data transformation helper for consistent API responses
  static transformOrderData(order) {
    if (!order) return null;
    
    const orderData = order.toJSON ? order.toJSON() : order;
    
    return {
      id: orderData.id,
      customerId: orderData.customerId,
      shopId: orderData.shopId,
      orderNumber: orderData.orderNumber,
      type: orderData.type,
      title: orderData.title,
      description: orderData.description,
      specifications: orderData.specifications,
      files: orderData.files,
      walkinTime: orderData.walkinTime,
      status: orderData.status,
      isUrgent: orderData.isUrgent,
      estimatedPages: orderData.estimatedPages,
      estimatedBudget: orderData.estimatedBudget,
      finalAmount: orderData.finalAmount,
      notes: orderData.notes,
      deletedBy: orderData.deletedBy,
      deletedAt: orderData.deletedAt,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      // Include shop data if present
      shop: orderData.shop ? {
        id: orderData.shop.id,
        name: orderData.shop.name,
        phone: orderData.shop.phone,
        city: orderData.shop.city,
        address: orderData.shop.address,
        publicOwnerName: orderData.shop.publicOwnerName
      } : undefined,
      // Include customer data if present
      customer: orderData.customer ? {
        id: orderData.customer.id,
        name: orderData.customer.name,
        phone: orderData.customer.phone
      } : undefined,
      // Frontend compatibility fields
      customerName: orderData.customer?.name,
      shopName: orderData.shop?.name
    };
  }

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
      
      const transformedOrders = (orders || []).map(order => OrderController.transformOrderData(order));
      res.json(transformedOrders);
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
      
      const transformedOrders = (orders || []).map(order => OrderController.transformOrderData(order));
      res.json(transformedOrders);
    } catch (error) {
      console.error('Get customer orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  }

  // Create order
  static async createOrder(req, res) {
    try {
      const { shopId, orderType, instructions } = req.body;
      // Get customer ID from authenticated user (JWT sets req.user)
      const customerId = req.user.id;
      
      // Get next order number for the shop
      const lastOrder = await Order.findOne({
        where: { shopId: parseInt(shopId) },
        order: [['orderNumber', 'DESC']]
      });
      
      const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
      
      // Process file uploads
      const files = req.files && Array.isArray(req.files) 
        ? req.files.map((file) => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }))
        : [];
      
      // Extract additional order details from request body
      const {
        type = 'digital',
        title,
        description,
        specifications,
        estimatedPages,
        isUrgent = false,
        estimatedBudget,
        notes
      } = req.body;

      const newOrder = await Order.create({
        shopId: parseInt(shopId),
        customerId: parseInt(customerId),
        orderNumber,
        type,
        title: title || `Order #${orderNumber}`,
        description: description || instructions || '',
        specifications,
        files,
        status: 'new',
        isUrgent,
        estimatedPages: estimatedPages ? parseInt(estimatedPages) : null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        notes
      });
      
      // Auto-unlock shop for customer when order is placed
      await CustomerShopUnlock.findOrCreate({
        where: {
          customerId: parseInt(customerId),
          shopId: parseInt(shopId)
        },
        defaults: {
          qrScanLocation: 'order_placement'
        }
      });
      
      const orderWithDetails = await Order.findByPk(newOrder.id, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      const transformedOrder = OrderController.transformOrderData(orderWithDetails);
      res.json(transformedOrder);
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
        await OrderController.deleteOrderFiles(orderId, transaction);
      }
      
      await transaction.commit();
      
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      // Send real-time notification to customer
      const transformedOrder = OrderController.transformOrderData(updatedOrder);
      sendToUser(updatedOrder.customerId, {
        type: 'order_update',
        order: transformedOrder,
        message: `Order status updated to ${status}`
      });
      
      res.json(transformedOrder);
    } catch (error) {
      await transaction.rollback();
      console.error('Update order status error:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  }

  // Delete order files from filesystem
  static async deleteOrderFiles(orderId, transaction = null) {
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order || !order.files) {
        return;
      }

      // Delete each file from filesystem
      const filesToDelete = Array.isArray(order.files) ? order.files : [];
      
      for (const file of filesToDelete) {
        try {
          const filePath = path.join(process.cwd(), 'uploads', file.filename || file.path);
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (fileError) {
          console.error(`Failed to delete file ${file.filename || file.path}:`, fileError.message);
          // Continue with other files even if one fails
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
      
      // Validate phone - Allow various phone formats for testing
      if (!/^[6-9][0-9]{9}$/.test(customerPhone) && !/^[0-9]{10}$/.test(customerPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format. Please use 10-digit number starting with 6-9' });
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
            path: file.path,
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
        type: type === 'file_upload' ? 'upload' : type,
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
      
      const transformedOrder = OrderController.transformOrderData(orderWithDetails);
      res.json(transformedOrder);
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
      
      const transformedOrder = OrderController.transformOrderData(order);
      res.json({ order: transformedOrder });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ message: 'Failed to get order' });
    }
  }

  // Delete order (soft delete with role-based permissions)
  static async deleteOrder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const orderId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Get order to check permissions
      const order = await Order.findByPk(orderId, {
        include: [{ model: Shop, as: 'shop' }]
      });
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Permission check based on role
      let canDelete = false;
      if (userRole === 'admin') {
        // Admins can delete any order
        canDelete = true;
      } else if (userRole === 'customer' && order.customerId === userId) {
        // Customers can only delete their own pending orders
        canDelete = order.status === 'new' || order.status === 'pending';
      } else if (userRole === 'shop_owner') {
        // Shop owners can delete processing/ready orders from their shop
        if (order.shop && order.shop.ownerId === userId) {
          canDelete = order.status === 'processing' || order.status === 'ready';
        }
      }
      
      if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete this order' });
      }
      
      // Perform soft delete
      await order.update({
        deletedBy: userId,
        deletedAt: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      console.error('Delete order error:', error);
      res.status(500).json({ message: 'Failed to delete order' });
    }
  }
}

export default OrderController;