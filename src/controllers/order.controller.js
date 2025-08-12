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

  // Get orders by shop - includes deleted orders for history
  static async getOrdersByShop(req, res) {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await Order.findAll({
        where: { 
          shopId
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

  // Get orders by customer - includes deleted orders for history  
  static async getOrdersByCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await Order.findAll({
        where: { 
          customerId
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
      
      // 🔥 ROLE-BASED ORDER CREATION SAFEGUARD
      if (req.user.role !== 'customer') {
        if (req.user.role === 'shop_owner') {
          // Check if shop owner is trying to order from their own shop
          const ownedShop = await Shop.findOne({
            where: { ownerId: customerId }
          });
          
          if (ownedShop && ownedShop.id === parseInt(shopId)) {
            return res.status(400).json({ 
              message: 'Shop owners cannot place orders on their own shop. Please use the shop dashboard to manage orders.',
              errorCode: 'SELF_ORDER_FORBIDDEN',
              redirectTo: '/shop-dashboard'
            });
          }
          
          // Shop owner trying to order from another shop - allow but with warning
          return res.status(400).json({ 
            message: 'Shop owners should use their phone number to login as a customer for placing orders. Please logout and login with customer phone login.',
            errorCode: 'SHOP_OWNER_ORDER_ATTEMPT',
            redirectTo: '/',
            suggestion: 'Use customer phone login instead'
          });
        }
        
        if (req.user.role === 'admin') {
          return res.status(400).json({ 
            message: 'Admin accounts cannot place orders. Please use a customer account.',
            errorCode: 'ADMIN_ORDER_FORBIDDEN'
          });
        }
        
        return res.status(403).json({ 
          message: 'Only customers can place orders.',
          errorCode: 'INVALID_ROLE_FOR_ORDER'
        });
      }
      
      // Additional validation: Ensure customer account is active
      if (!req.user.isActive) {
        return res.status(403).json({ 
          message: 'Your account has been deactivated. Please contact support.',
          errorCode: 'ACCOUNT_DEACTIVATED'
        });
      }
      
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

      // 🔥 FIX: Update shop's total orders count for real-time sync
      console.log(`🔄 Incrementing totalOrders for shop ID: ${shopId}`);
      try {
        await Shop.increment('totalOrders', {
          where: { id: parseInt(shopId) }
        });
        console.log(`✅ Shop ${shopId} totalOrders incremented successfully`);
      } catch (incrementError) {
        console.error(`❌ Error incrementing totalOrders for shop ${shopId}:`, incrementError);
      }
      
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
        console.log(`🗑️  Order ${orderId} marked as completed, triggering file deletion...`);
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
        console.log(`❌ No files to delete for order ${orderId}`);
        return;
      }

      // Parse files if they're stored as JSON string
      let filesToDelete = [];
      if (typeof order.files === 'string') {
        try {
          filesToDelete = JSON.parse(order.files);
        } catch (parseError) {
          console.error('Failed to parse order files JSON:', parseError);
          return;
        }
      } else if (Array.isArray(order.files)) {
        filesToDelete = order.files;
      }

      console.log(`🗑️  Deleting ${filesToDelete.length} files for completed order ${orderId}`);
      
      for (const file of filesToDelete) {
        try {
          // Try multiple path variations
          let filePath;
          
          if (file.path && file.path.startsWith('uploads/')) {
            // If path already includes 'uploads/', use it directly
            filePath = path.join(process.cwd(), file.path);
          } else if (file.filename) {
            // Use filename with uploads folder
            filePath = path.join(process.cwd(), 'uploads', file.filename);
          } else if (file.path) {
            // Add uploads folder to path
            filePath = path.join(process.cwd(), 'uploads', file.path);
          } else {
            console.error('❌ No valid file path found for file:', file);
            continue;
          }

          console.log(`🗑️  Attempting to delete: ${filePath}`);
          await fs.unlink(filePath);
          console.log(`✅ Successfully deleted file: ${filePath}`);
        } catch (fileError) {
          console.error(`❌ Failed to delete file ${file.filename || file.path}:`, fileError.message);
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

      // 🔥 PREVENT SHOP OWNER PHONE COLLISION IN ANONYMOUS ORDERS
      let customer = await User.findOne({ 
        where: { phone: customerPhone } 
      });
      
      if (customer) {
        // If phone belongs to shop owner or admin, prevent order creation
        if (customer.role === 'shop_owner') {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'This phone number belongs to a shop owner. Shop owners cannot place walk-in orders. Please use the shop dashboard to manage orders.',
            errorCode: 'SHOP_OWNER_PHONE_IN_WALKIN',
            suggestion: 'Use shop dashboard for order management'
          });
        }
        
        if (customer.role === 'admin') {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'This phone number belongs to an admin account. Admins cannot place orders.',
            errorCode: 'ADMIN_PHONE_IN_WALKIN'
          });
        }
        
        // If customer exists, update name if provided
        if (customerName && customer.name !== customerName) {
          await customer.update({ name: customerName }, { transaction });
        }
      } else {
        // Create new customer
        customer = await User.create({
          phone: customerPhone,
          name: customerName,
          role: 'customer',
          isActive: true
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

  // Get single order - allows access for recent orders without auth for confirmation page
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
      
      // Allow access without authentication for recent orders (within 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const isRecentOrder = new Date(order.createdAt) > thirtyMinutesAgo;
      
      // If user is authenticated, allow any order access based on permissions
      if (req.user) {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let hasAccess = false;
        if (userRole === 'admin') {
          hasAccess = true;
        } else if (userRole === 'customer' && order.customerId === userId) {
          hasAccess = true;
        } else if (userRole === 'shop_owner' && order.shop && order.shop.ownerId === userId) {
          hasAccess = true;
        }
        
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (!isRecentOrder) {
        // For unauthenticated users, only allow access to recent orders
        return res.status(401).json({ message: 'Authentication required for older orders' });
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