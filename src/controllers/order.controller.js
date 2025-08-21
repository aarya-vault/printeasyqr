import { Order, Shop, User, Message, CustomerShopUnlock, getSequelize } from '../models/index.js';
import { Op } from 'sequelize';

const sequelize = getSequelize();
import fs from 'fs/promises';
import path from 'path';
import { sendToUser, broadcast } from '../utils/websocket.js';
import { uploadFilesToObjectStorage } from '../utils/objectStorageUpload.js';
import storageManager from '../../server/storage/storageManager.js';
import { generateToken } from '../config/jwt-auth.js';

class OrderController {
  // 🆔 PUBLIC ID GENERATION: Generate short alphanumeric IDs for external display
  static generatePublicId() {
    const prefix = 'ORD';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
  }

  // 🎯 OPTIMIZED QUEUE NUMBERING: Ultra-fast calculation using aggregation
  static async calculateDynamicQueueNumber(shopId) {
    try {
      const sequelize = getSequelize();
      
      // ⚡ PERFORMANCE OPTIMIZATION: Single query with aggregation instead of loading all orders
      const [result] = await sequelize.query(`
        SELECT 
          COUNT(*) as active_count,
          COALESCE(MAX(order_number), 0) as max_number
        FROM orders 
        WHERE shop_id = :shopId 
          AND status IN ('new', 'pending', 'processing', 'ready')
          AND deleted_at IS NULL
      `, {
        replacements: { shopId: parseInt(shopId) },
        type: sequelize.QueryTypes.SELECT
      });

      const activeCount = parseInt(result.active_count);
      const maxNumber = parseInt(result.max_number);


      // If no active orders, reset to #1
      if (activeCount === 0) {
        return 1;
      }

      // Return next number
      const nextNumber = maxNumber + 1;
      
      return nextNumber;
    } catch (error) {
      // Fallback to simple increment
      const lastOrder = await Order.findOne({
        where: { shopId: parseInt(shopId) },
        order: [['orderNumber', 'DESC']]
      });
      return lastOrder ? lastOrder.orderNumber + 1 : 1;
    }
  }

  // Data transformation helper for consistent API responses
  static transformOrderData(order) {
    if (!order) return null;
    
    const orderData = order.toJSON ? order.toJSON() : order;
    
    return {
      id: orderData.id,
      publicId: orderData.publicId,
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
      // Include deleted by user info if available
      deletedBy: orderData.deletedBy,
      deletedByUser: orderData.deletedByUser ? {
        id: orderData.deletedByUser.id,
        name: orderData.deletedByUser.name,
        role: orderData.deletedByUser.role
      } : undefined,
      // Frontend compatibility fields
      customerName: orderData.customer?.name,
      shopName: orderData.shop?.name
    };
  }

  // Get orders by shop - excludes soft-deleted orders for active view
  static async getOrdersByShop(req, res) {
    try {
      const shopId = parseInt(req.params.shopId);
      const includeDeleted = req.path.includes('/history'); // Check if this is a history request
      
      const whereCondition = { shopId };
      if (!includeDeleted) {
        whereCondition.deletedAt = { [Op.is]: null }; // Exclude soft-deleted orders for active view
      }
      
      const orders = await Order.findAll({
        where: whereCondition,
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' },
          // Include user who deleted the order if it's deleted
          { 
            model: User, 
            as: 'deletedByUser',
            attributes: ['id', 'name', 'role'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']] // Show newest first for better UX
      });
      
      const transformedOrders = (orders || []).map(order => OrderController.transformOrderData(order));
      res.json(transformedOrders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get orders' });
    }
  }

  // Get orders by customer - includes deleted orders for history  
  static async getOrdersByCustomer(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      const includeDeleted = req.query.includeDeleted === 'true' || req.path.includes('/history');
      
      const whereCondition = { customerId };
      if (!includeDeleted) {
        whereCondition.deletedAt = { [Op.is]: null }; // Exclude soft-deleted orders for active view
      }
      
      const orders = await Order.findAll({
        where: whereCondition,
        include: [
          { model: Shop, as: 'shop' },
          { model: User, as: 'customer' },
          // Include user who deleted the order if it's deleted
          { 
            model: User, 
            as: 'deletedByUser',
            attributes: ['id', 'name', 'role'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      const transformedOrders = (orders || []).map(order => OrderController.transformOrderData(order));
      res.json(transformedOrders);
    } catch (error) {
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
      
      // 🎯 DYNAMIC QUEUE NUMBERING: Get next queue number with reset logic
      const orderNumber = await OrderController.calculateDynamicQueueNumber(shopId);
      const publicId = OrderController.generatePublicId();
      
      // 📁 R2/LOCAL HYBRID STORAGE: Save order files to R2 or fallback to local
      let files = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        
        // Create a temporary order ID for R2 storage (will be updated after order creation)
        const tempOrderId = `temp-${Date.now()}`;
        
        // ULTRA FAST: Process files using parallel batch processing
        const filesForUpload = req.files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }));
        
        // Use the new parallel batch processing for massive speed
        files = await storageManager.saveMultipleFiles(
          filesForUpload,
          'ORDER',
          { orderId: tempOrderId }
        );
        
        // Filter out any failed uploads (saveMultipleFiles already handles errors)
        files = files.filter(file => file !== null);
      }
      
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
        publicId,
        type,
        title: title || `Queue #${orderNumber}`,
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
      try {
        await Shop.increment('totalOrders', {
          where: { id: parseInt(shopId) }
        });
      } catch (incrementError) {
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
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  // General order update (handles all order fields)
  static async updateOrder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const orderId = parseInt(req.params.id);
      const updateData = req.body;
      
      const order = await Order.findByPk(orderId, {
        include: [{ model: Shop, as: 'shop' }]
      });
      
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions
      if (order.shop.ownerId !== req.user.id && req.user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Update order with provided data
      await order.update(updateData, { transaction });
      
      // 🔧 FIX: Remove duplicate completion logic - handled in updateOrderStatus only
      // Auto delete files if order is completed - DISABLED to prevent double execution
      if (updateData.status === 'completed') {
        // Completion logic moved to updateOrderStatus to prevent duplication
      }
      
      await transaction.commit();
      
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      // Broadcast order update to all connected users for real-time sync
      const transformedOrder = OrderController.transformOrderData(updatedOrder);
      
      broadcast({
        type: 'order_update',  // ✅ FIXED: Match frontend event name
        orderId: orderId,
        shopId: order.shopId,
        customerId: order.customerId,
        order: transformedOrder,
        timestamp: new Date().toISOString()
      });
      
      
      res.json(transformedOrder);
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Failed to update order' });
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

      // Schedule file deletion for completed orders (non-blocking)
      let shouldDeleteFiles = false;
      if (status === 'completed') {
        shouldDeleteFiles = true;
        
        // 🎯 DYNAMIC ORDER NUMBERING: Check if this completion causes a reset
        const remainingActiveOrders = await Order.count({
          where: {
            shopId: order.shopId,
            status: {
              [Op.in]: ['new', 'pending', 'processing', 'ready']
            },
            deletedAt: { [Op.is]: null },
            id: { [Op.ne]: orderId }  // Exclude current order
          }
        });
        
        if (remainingActiveOrders === 0) {
        } else {
        }
      }
      
      await transaction.commit();
      
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      // 🚀 CRITICAL FIX: Broadcast order status update to all connected users for real-time sync
      const transformedOrder = OrderController.transformOrderData(updatedOrder);
      
      broadcast({
        type: 'order_update',  // ✅ FIXED: Match frontend event name for status updates
        orderId: orderId,
        shopId: order.shopId,
        customerId: order.customerId,
        newStatus: status,
        order: transformedOrder,
        timestamp: new Date().toISOString()
      });
      
      
      res.json(transformedOrder);
      
      // 🗑️ ASYNC FILE CLEANUP: Delete files in background if order was completed
      if (shouldDeleteFiles) {
        setImmediate(async () => {
          try {
            await OrderController.deleteOrderFiles(orderId);
          } catch (error) {
            // Don't throw - cleanup failure shouldn't affect the user
          }
        });
      }
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Failed to update order status' });
    }
  }

  // Add files to existing order
  static async addFilesToOrder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await Order.findByPk(orderId, {
        include: [{ model: Shop, as: 'shop' }]
      });
      
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check permissions - allow anonymous users to add files to recently created orders
      if (req.user && req.user.id) {
        // For authenticated users, check if they own the order
        if (order.customerId !== req.user.id && req.user.role !== 'admin') {
          await transaction.rollback();
          return res.status(403).json({ message: 'Access denied. Only the order customer can add files.' });
        }
      } else {
        // For anonymous users, allow adding files to orders created in last 30 minutes
        const orderAge = Date.now() - new Date(order.createdAt).getTime();
        const thirtyMinutes = 30 * 60 * 1000;
        if (orderAge > thirtyMinutes) {
          await transaction.rollback();
          return res.status(403).json({ message: 'Session expired. Anonymous users can only add files within 30 minutes of order creation.' });
        }
      }

      // Prevent adding files to completed orders
      if (order.status === 'completed') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Cannot add files to completed orders' });
      }

      if (!req.files || req.files.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'No files provided' });
      }

      
      // Get existing files
      let existingFiles = [];
      if (order.files) {
        existingFiles = Array.isArray(order.files) ? order.files : JSON.parse(order.files);
      }

      // ULTRA FAST: Process new files using parallel batch processing
      const filesForUpload = req.files.map(file => ({
        buffer: file.buffer,
        originalname: file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
      
      // Use the new parallel batch processing for massive speed
      const newFiles = await storageManager.saveMultipleFiles(
        filesForUpload,
        'ORDER',
        { orderId: orderId }
      );
      
      // Filter out failed uploads (saveMultipleFiles already handles errors)
      const validNewFiles = newFiles.filter(file => file !== null);

      // Combine existing and new files
      const allFiles = [...existingFiles, ...validNewFiles];
      
      // Update order with new files
      await order.update({ files: allFiles }, { transaction });
      await transaction.commit();
      
      
      // Return updated order
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      const transformedOrder = OrderController.transformOrderData(updatedOrder);
      
      // Broadcast update to shop owner
      broadcast({
        type: 'order_update',  // ✅ FIXED: Match frontend event name for file additions
        orderId: orderId,
        shopId: order.shopId,
        customerId: order.customerId,
        newFilesCount: validNewFiles.length,
        order: transformedOrder,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        message: `Successfully added ${newFiles.length} files to order`,
        order: transformedOrder,
        newFiles: newFiles
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Failed to add files to order' });
    }
  }

  // Delete order files from filesystem
  static async deleteOrderFiles(orderId, transaction = null) {
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order || !order.files) {
        return;
      }

      // Parse files if they're stored as JSON string
      let filesToDelete = [];
      if (typeof order.files === 'string') {
        try {
          filesToDelete = JSON.parse(order.files);
        } catch (parseError) {
          return;
        }
      } else if (Array.isArray(order.files)) {
        filesToDelete = order.files;
      }

      
      // Use storage manager to delete files (handles both R2 and local)
      for (const file of filesToDelete) {
        try {
          const deleted = await storageManager.deleteFile(file);
          if (deleted) {
          } else {
          }
        } catch (fileError) {
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
              }
            }
          }
        }
      }
    } catch (error) {
    }
  }

  // Create authenticated order (replaces anonymous order)
  static async createAuthenticatedOrder(req, res) {
    try {
      const { 
        shopId, type, title, description, specifications, walkinTime 
      } = req.body;
      
      // User comes from JWT authentication
      const customerId = req.user.id;
      
      // Validate required fields early
      if (!shopId || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // ⚡ PARALLEL OPERATIONS: Execute all lookups and calculations simultaneously
      const startTime = Date.now();
      const [customer, shop, orderNumber] = await Promise.all([
        User.findByPk(customerId),
        Shop.findByPk(parseInt(shopId)),
        OrderController.calculateDynamicQueueNumber(shopId)
      ]);
      
      
      if (!customer) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // Generate public ID (instant operation)
      const publicId = OrderController.generatePublicId();
      
      // 🚀 OPTIMIZED TRANSACTION: Only wrap the INSERT operation
      const transaction = await sequelize.transaction();
      
      try {
        // Create order WITH minimal transaction scope
        const order = await Order.create({
          customerId,
          shopId: parseInt(shopId),
          orderNumber,
          publicId,
          type,
          title: title || `Queue #${orderNumber}`,
          description,
          specifications,
          files: [], // Files added separately via R2 direct upload + confirmation
          status: 'pending',
          isUrgent: specifications === 'URGENT ORDER',
          walkinTime: walkinTime || null
        }, { transaction });
        
        await transaction.commit();
        
        
        // ⚡ IMMEDIATE RESPONSE: Return order details immediately
        res.status(201).json({
          id: order.id,
          publicId: order.publicId,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          shopId: order.shopId,
          status: order.status,
          files: [],
          message: 'Order created successfully - ready for file uploads'
        });
        
        // 🚀 BACKGROUND PROCESSING: WebSocket notifications happen after response
        setImmediate(() => {
          // Send WebSocket notification in background
          broadcast('order:created', {
            orderId: order.id,
            shopId: order.shopId,
            customerName: customer.name
          });
        });
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      
    } catch (error) {
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  // Legacy anonymous order (kept for backward compatibility)
  static async createAnonymousOrder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        shopId, customerName, customerPhone, type, 
        title, description, specifications, walkinTime 
      } = req.body;
      
      // Validate required fields
      if (!shopId || !customerName || !customerPhone || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate phone - Allow various phone formats for testing
      if (!/^[6-9][0-9]{9}$/.test(customerPhone) && !/^[0-9]{10}$/.test(customerPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format. Please use 10-digit number starting with 6-9' });
      }

      // Check if shop exists
      const shop = await Shop.findByPk(parseInt(shopId));
      if (!shop) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // Allow orders even when shop is closed - shop owner can handle them when they open
      // This ensures customers can place orders for later processing

      // 🔥 PREVENT SHOP OWNER PHONE COLLISION IN ANONYMOUS ORDERS
      let customer = await User.findOne({ 
        where: { phone: customerPhone } 
      });
      
      if (customer) {
        // If phone belongs to shop owner or admin, prevent order creation
        if (customer.role === 'shop_owner') {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'This phone number belongs to a shop owner. Shop owners cannot place walk-in orders. Please use the shop dashboard to manage orders. Try using a different customer phone number for testing.',
            errorCode: 'SHOP_OWNER_PHONE_IN_WALKIN',
            suggestion: 'Use a different phone number (e.g. 9876543210) for testing walk-in orders'
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
      
      // 📁 R2/LOCAL HYBRID STORAGE: Save order files to R2 or fallback to local
      let files = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        
        // Create a temporary order ID for R2 storage
        const tempOrderId = `anon-${Date.now()}`;
        
        // ULTRA FAST: Process files using parallel batch processing for anonymous orders
        const filesForUpload = req.files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }));
        
        // Use the new parallel batch processing for massive speed
        files = await storageManager.saveMultipleFiles(
          filesForUpload,
          'ORDER',
          { orderId: tempOrderId }
        );
        
        // Filter out any failed uploads (saveMultipleFiles already handles errors)
        files = files.filter(file => file !== null);
      }
      
      // 🎯 DYNAMIC QUEUE NUMBERING: Use dynamic numbering for anonymous orders too
      const orderNumber = await OrderController.calculateDynamicQueueNumber(shopId);
      const publicId = OrderController.generatePublicId();
      
      const newOrder = await Order.create({
        customerId: customer.id,
        shopId: parseInt(shopId),
        orderNumber,
        publicId,
        type: type === 'file_upload' ? 'upload' : type,
        title: title || `Queue #${orderNumber}`,
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
      
      // 🔐 JWT GENERATION: Generate JWT token for anonymous-to-authenticated user
      const token = generateToken(customer.toJSON());
      
      res.json({
        ...transformedOrder,
        token,
        userId: customer.id
      });
    } catch (error) {
      await transaction.rollback();
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
      
      // 🚀 ORDER CONFIRMATION FIX: Return order in expected format for confirmation page
      res.json({ order: transformedOrder });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get order' });
    }
  }

  // Delete order (soft delete with role-based permissions + R2 file cleanup)
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
        // Shop owners can delete any order except 'new' from their shop
        if (order.shop && order.shop.ownerId === userId) {
          canDelete = order.status !== 'new'; // Shop owners cannot delete 'new' orders - customers must cancel them
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
      
      // 🚀 CRITICAL FIX: Broadcast order deletion to all connected users for real-time sync
      broadcast({
        type: 'order_deleted',  // ✅ FIXED: Use lowercase underscore for consistency
        orderId: orderId,
        shopId: order.shopId,
        customerId: order.customerId,
        timestamp: new Date().toISOString()
      });
      
      
      // Send response immediately for instant UI feedback
      res.json({ success: true, message: 'Order deleted successfully', orderId: orderId });
      
      // 🗑️ ASYNC FILE CLEANUP: Delete files in background AFTER sending response
      // This prevents UI blocking while R2 deletion happens
      setImmediate(async () => {
        try {
          await OrderController.deleteOrderFiles(orderId);
        } catch (error) {
          // Don't throw - cleanup failure shouldn't affect the user
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Failed to delete order' });
    }
  }
  
  // 🚀 NEW: R2 Direct Upload File Confirmation
  static async confirmFilesUpload(req, res) {
    const startTime = Date.now(); // Track processing time
    const transaction = await sequelize.transaction();
    
    try {
      const orderId = parseInt(req.params.orderId);
      const { files } = req.body;
      
      if (!files || !Array.isArray(files)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Files array required' });
      }
      
      // Verify order exists and user has access
      const order = await Order.findOne({
        where: { 
          id: orderId,
          customerId: req.user.id
        },
        transaction
      });
      
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Order not found or access denied' });
      }
      
      // Get existing files from the order
      let existingFiles = [];
      if (order.files) {
        try {
          existingFiles = Array.isArray(order.files) ? order.files : JSON.parse(order.files);
        } catch (e) {
          existingFiles = [];
        }
      }
      
      // Format NEW files with unified metadata structure
      const formattedNewFiles = files.map((file, index) => ({
        id: `${orderId}-${existingFiles.length + index}-${Date.now()}`,
        filename: file.filename || file.originalName,
        originalName: file.originalName,
        r2Key: file.r2Key,
        bucket: file.bucket || process.env.R2_BUCKET_NAME,
        size: file.size,
        mimetype: file.mimetype,
        path: file.r2Key, // For compatibility
        storageType: 'r2',
        uploadedAt: new Date().toISOString(),
        status: 'completed'
      }));
      
      // CRITICAL FIX: Combine existing files with new files instead of replacing
      const allFiles = [...existingFiles, ...formattedNewFiles];
      
      // Update order with COMBINED files (existing + new)
      await order.update({ files: allFiles }, { transaction });
      
      await transaction.commit();
      
      // Return updated order
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });
      
      // Broadcast file confirmation
      const transformedOrder = OrderController.transformOrderData(updatedOrder);
      
      // CRITICAL FIX: Immediate broadcast with priority for shop owner
      // This fixes the 12-second delay issue
      const broadcastFileReady = async () => {
        try {
          // Priority 1: Direct notification to shop owner
          if (order.shopId) {
            const shop = await Shop.findByPk(order.shopId);
            if (shop && shop.ownerId) {
              sendToUser(shop.ownerId, {
                type: 'order:files_ready',
                orderId: orderId,
                shopId: order.shopId,
                files: allFiles,
                order: transformedOrder,
                timestamp: new Date().toISOString(),
                priority: 'urgent' // Mark as urgent for immediate UI update
              });
            }
          }
          
          // Priority 2: Notify customer
          if (order.customerId) {
            sendToUser(order.customerId, {
              type: 'order:files_confirmed',
              orderId: orderId,
              order: transformedOrder,
              timestamp: new Date().toISOString()
            });
          }
          
          // Priority 3: General broadcast
          await broadcastOrderUpdate({
            id: orderId,
            shopId: order.shopId,
            customerId: order.customerId,
            ...transformedOrder
          }, 'file_upload');
        } catch (broadcastError) {
          // Don't let broadcast errors affect the response
        }
      };
      
      // Execute broadcast immediately but don't wait
      setImmediate(() => broadcastFileReady());
      
      res.json({ 
        success: true, 
        order: transformedOrder,
        filesConfirmed: files.length,
        filesReady: true, // Signal frontend that files are ready
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }
      res.status(500).json({ 
        message: 'Failed to confirm file uploads',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // 🚀 NEW: R2 Direct Upload for Add More Files
  static async addFilesToOrderR2(req, res) {
    // This is a placeholder - files are uploaded directly to R2 first,
    // then this endpoint is called to confirm the uploads
    res.status(501).json({ 
      message: 'Use /confirm-files endpoint after uploading files directly to R2' 
    });
  }
}

export default OrderController;