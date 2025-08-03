import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertMessageSchema, insertShopApplicationSchema, users, orders, shops, shopApplications, messages, notifications, customerShopUnlocks } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, requireAdmin, requireShopOwner, requireShopOwnerOrAdmin } from "./middleware/auth";
import adminRoutes from "./admin-routes";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 100 // Up to 100 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types - no restrictions
    cb(null, true);
  }
});

// WebSocket connections store
const wsConnections = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<void> {
  console.log('🚀 Starting route registration...');

  // Authentication routes
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  console.log('📝 Registering authentication routes...');
  app.post('/api/auth/phone-login', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }

      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        // Create new customer user
        user = await storage.createUser({
          phone,
          role: 'customer'
        });
      }

      // Set session for phone login
      req.session.user = {
        id: user.id,
        phone: user.phone,
        name: user.name || 'Customer',
        role: user.role
      };
      await req.session.save();

      // Add needsNameUpdate flag for customers without names
      const userResponse = {
        ...user,
        needsNameUpdate: user.role === 'customer' && (!user.name || user.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Phone login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/email-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Admin login special case with environment variables
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (email === adminEmail && password === adminPassword) {
        let adminUser = await storage.getUserByEmail(email);
        if (!adminUser) {
          adminUser = await storage.createUser({
            phone: "0000000000",
            email: email,
            name: "Admin",
            role: "admin"
          });
        }
        
        req.session.user = {
          id: adminUser.id,
          email: adminUser.email || undefined,
          name: adminUser.name || 'Admin',
          role: adminUser.role
        };
        await req.session.save();
        return res.json(adminUser);
      }

      // Shop owner login - optimized query
      const user = await storage.getUserByEmail(email);
      
      if (user && user.passwordHash && user.role === 'shop_owner') {
        // Use bcrypt to compare passwords
        const bcrypt = await import('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (isValidPassword) {
          req.session.user = {
            id: user.id,
            email: user.email || undefined,
            name: user.name || 'Shop Owner',
            role: user.role,
            phone: user.phone || undefined
          };
          return res.json(user);
        }
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get current user route
  app.get('/api/auth/me', (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Add needsNameUpdate flag for customers without names
    const userResponse = {
      ...req.session.user,
      needsNameUpdate: req.session.user.role === 'customer' && (!req.session.user.name || req.session.user.name === 'Customer')
    };
    
    res.json(userResponse);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User update route
  app.patch('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update session with new user data
      if (req.session?.user?.id === userId) {
        req.session.user = {
          id: user.id,
          email: user.email || undefined,
          phone: user.phone || undefined,
          name: user.name || 'User',
          role: user.role
        };
      }
      
      // Add needsNameUpdate flag for customers without names
      const userResponse = {
        ...user,
        needsNameUpdate: user.role === 'customer' && (!user.name || user.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Update failed' });
    }
  });
  
  // Register admin routes with authentication middleware
  app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);

  // Shop routes
  app.get('/api/shops/owner/:ownerId', async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      const shop = await storage.getShopByOwnerId(ownerId);
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      res.json({ shop });
    } catch (error) {
      console.error('Get shop error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  });

  // Get shop by slug - CRITICAL MISSING ROUTE
  app.get('/api/shops/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const shop = await storage.getShopBySlug(slug);
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      res.json(shop);
    } catch (error) {
      console.error('Get shop by slug error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  });

  // Get all active shops for customers
  app.get('/api/shops', async (req, res) => {
    try {
      const shops = await storage.getActiveShops();
      res.json(shops || []);
    } catch (error) {
      console.error('Get all shops error:', error);
      res.status(500).json({ message: 'Failed to get shops' });
    }
  });

  // Customer unlocked shops route
  app.get('/api/customer/:customerId/unlocked-shops', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const shops = await storage.getVisitedShopsByCustomer(customerId);
      res.json(shops || []);
    } catch (error) {
      console.error('Get unlocked shops error:', error);
      res.status(500).json({ message: 'Failed to get unlocked shops' });
    }
  });

  // Order routes
  app.get('/api/orders/shop/:shopId', async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrdersByShop(shopId);
      res.json(orders || []);
    } catch (error) {
      console.error('Get shop orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  });

  app.get('/api/orders/customer/:customerId', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await storage.getOrdersByCustomer(customerId);
      res.json(orders || []);
    } catch (error) {
      console.error('Get customer orders error:', error);
      res.status(500).json({ message: 'Failed to get orders' });
    }
  });

  app.post('/api/orders', upload.array('files'), async (req, res) => {
    try {
      const { shopId, customerId, orderType, instructions } = req.body;
      
      const newOrder = await storage.createOrder({
        shopId: parseInt(shopId),
        customerId: parseInt(customerId),
        type: orderType || 'file_upload',
        title: `Order #${Date.now()}`,
        description: instructions || '',
        files: req.files && Array.isArray(req.files) ? req.files.map((file: any) => ({
          name: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        })) : []
      });
      
      res.json(newOrder);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  // Customer shop unlock route
  app.post('/api/unlock-shop/:shopSlug', async (req, res) => {
    try {
      const { shopSlug } = req.params;
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID required' });
      }
      
      const shop = await storage.getShopBySlug(shopSlug);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      await storage.unlockShopForCustomer(parseInt(customerId), shop.id);
      res.json({ success: true, shop });
    } catch (error) {
      console.error('Unlock shop error:', error);
      res.status(500).json({ message: 'Failed to unlock shop' });
    }
  });

  // File download route
  app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Update order status (shop owner only)
  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status required" });
      }

      // Get order to check permissions
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has permission to update this order
      const shop = await storage.getShop(existingOrder.shopId);
      if (!shop || (shop.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const order = await storage.updateOrder(orderId, { status });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // AUTO FILE DELETION: If order is marked as completed, delete all associated files
      if (status === 'completed') {
        try {
          // Always trigger deletion for completed orders - handles both order files and chat message files
          await storage.deleteOrderFiles(orderId);
          console.log(`[AUTO-CLEANUP] Files automatically deleted for completed order ${orderId} - memory space optimized`);
        } catch (error) {
          console.error(`[AUTO-CLEANUP] Error deleting files for order ${orderId}:`, error);
          // Don't fail the order update if file deletion fails
        }
      }
      
      // Send status update notification
      const customerWs = wsConnections.get(order.customerId);
      if (customerWs && customerWs.readyState === WebSocket.OPEN) {
        customerWs.send(JSON.stringify({
          type: 'order_update',
          order
        }));
      }
      
      await storage.createNotification({
        userId: order.customerId,
        title: "Order Status Updated",
        message: `Your order "${order.title}" is now ${order.status}`,
        type: "order_update",
        relatedId: order.id
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Toggle shop online/offline status
  app.patch("/api/shops/:id/toggle-status", requireAuth, async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      
      // Get shop to check ownership
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Check if user owns this shop
      if (shop.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Toggle status
      const updatedShop = await storage.updateShop(shopId, { 
        isOnline: !shop.isOnline 
      });
      
      res.json(updatedShop);
    } catch (error) {
      console.error('Toggle shop status error:', error);
      res.status(500).json({ message: "Failed to update shop status" });
    }
  });

  // Get messages for an order
  app.get("/api/messages/order/:orderId", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const messages = await storage.getMessagesByOrder(orderId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/messages", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const { orderId, senderId, senderName, senderRole, content, messageType = 'text' } = req.body;
      
      if (!orderId || !senderId || !senderName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Handle file uploads
      let fileData = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        fileData = (req.files as Express.Multer.File[]).map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        }));
      }
      
      const message = await storage.createMessage({
        orderId: parseInt(orderId),
        senderId: parseInt(senderId),
        senderName,
        senderRole: senderRole || 'customer',
        content: content || '',
        files: fileData ? JSON.stringify(fileData) : null,
        messageType: fileData ? 'file' : messageType
      });
      
      // Send real-time notification
      const order = await storage.getOrder(parseInt(orderId));
      if (order) {
        const recipientId = parseInt(senderId) === order.customerId ? order.shopId : order.customerId;
        const recipientWs = wsConnections.get(recipientId);
        
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'new_message',
            message
          }));
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.patch("/api/messages/mark-read", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      const userId = req.user!.id;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }
      
      // Mark all messages in the order as read for this user
      await storage.markMessagesAsRead(parseInt(orderId), userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Create anonymous order
  app.post("/api/orders/anonymous", upload.array('files'), async (req, res) => {
    try {
      const { shopId, customerName, customerPhone, type, title, description, specifications, walkinTime } = req.body;
      
      // Validate required fields
      if (!shopId || !customerName || !customerPhone || !type || !title) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate phone number
      if (!/^[6-9][0-9]{9}$/.test(customerPhone)) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      // Check if customer exists, create if not
      let customer = await storage.getUserByPhone(customerPhone);
      if (!customer) {
        customer = await storage.createUser({
          phone: customerPhone,
          name: customerName,
          role: 'customer'
        });
      }
      
      // Handle file uploads
      let fileData = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        fileData = (req.files as Express.Multer.File[]).map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype
        }));
      }
      
      const orderData = {
        customerId: customer.id,
        shopId: parseInt(shopId),
        type: type as 'upload' | 'walkin',
        title,
        description: description || '',
        status: 'new',
        files: fileData ? JSON.stringify(fileData) : null,
        specifications: specifications ? JSON.stringify(specifications) : null,
        walkinTime: walkinTime || null,
        isUrgent: false
      };
      
      const newOrder = await storage.createOrder(orderData);
      
      // Create notification for shop owner
      const shop = await storage.getShop(parseInt(shopId));
      if (shop) {
        await storage.createNotification({
          userId: shop.ownerId,
          title: "New Order Received",
          message: `New ${type} order from ${customerName}`,
          type: "new_order",
          relatedId: newOrder.id
        });
      }
      
      res.json(newOrder);
    } catch (error) {
      console.error('Create anonymous order error:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  // Check if shop slug is available
  app.get('/api/shops/check-slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const shop = await storage.getShopBySlug(slug);
      res.json({ available: !shop });
    } catch (error) {
      res.status(500).json({ message: "Failed to check slug availability" });
    }
  });

  // Create shop application
  app.post("/api/shop-applications", async (req, res) => {
    try {
      const applicationData = insertShopApplicationSchema.parse(req.body);
      
      // Check if email or shop slug already exists
      const existingApp = await db.select().from(shopApplications)
        .where(or(
          eq(shopApplications.email, applicationData.email),
          eq(shopApplications.shopSlug, applicationData.shopSlug)
        ))
        .limit(1);
      
      if (existingApp.length > 0) {
        if (existingApp[0].email === applicationData.email) {
          return res.status(400).json({ message: "An application with this email already exists" });
        }
        if (existingApp[0].shopSlug === applicationData.shopSlug) {
          return res.status(400).json({ message: "This shop URL is already taken. Please choose a different one." });
        }
      }
      
      const application = await storage.createShopApplication(applicationData);
      
      // Create notification for admin
      const adminUser = await storage.getUserByEmail(process.env.ADMIN_EMAIL!);
      if (adminUser) {
        await storage.createNotification({
          userId: adminUser.id,
          title: "New Shop Application",
          message: `New application from ${applicationData.internalShopName}`,
          type: "shop_application",
          relatedId: application.id
        });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Create shop application error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Update shop application (admin only)
  app.patch("/api/shop-applications/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const application = await storage.updateShopApplication(applicationId, { status, adminNotes });
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // If approved, create shop and owner account
      if (status === 'approved') {
        // Create owner user account
        const ownerUser = await storage.createUser({
          email: application.email,
          phone: application.phoneNumber,
          name: application.ownerFullName,
          role: 'shop_owner',
          // Temporary password - will be handled by storage
        });
        
        // Create shop
        const shop = await storage.createShop({
          name: application.internalShopName,
          slug: application.shopSlug,
          ownerId: ownerUser.id,
          ownerFullName: application.ownerFullName,
          publicOwnerName: application.publicOwnerName,
          email: application.email,
          phone: application.publicContactNumber || application.phoneNumber,
          address: application.completeAddress || application.publicAddress,
          city: application.city,
          state: application.state,
          pinCode: application.pinCode,
          workingHours: application.workingHours as any,
          services: application.services as any,
          // servicesOffered: application.customServices, // Property not in schema
          // description: '', // Property not in schema
          isOnline: true,
          isApproved: true,
          // isAvailable24Hours: false // Property not in schema
        });
        
        // Update owner with shop ID - NOT IN USER TABLE
        // Shop owners find their shop via their ownerId in shops table
        
        // Send approval notification
        await storage.createNotification({
          userId: ownerUser.id,
          title: "Application Approved!",
          message: "Your shop application has been approved. You can now start receiving orders.",
          type: "application_status",
          relatedId: application.id
        });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Update shop application error:', error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Get notifications for a user
  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user is accessing their own notifications
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userNotifications = await storage.getNotificationsByUser(userId);
      res.json(userNotifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read for a user
  app.patch("/api/notifications/user/:userId/read-all", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user is marking their own notifications
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Get shop settings
  app.get('/api/shops/settings', requireAuth, requireShopOwner, async (req, res) => {
    try {
      const shopId = req.user!.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "No shop associated with this user" });
      }
      
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(shop);
    } catch (error) {
      console.error('Get shop settings error:', error);
      res.status(500).json({ message: "Failed to fetch shop settings" });
    }
  });

  // Update shop settings
  app.patch('/api/shops/settings', requireAuth, requireShopOwner, async (req, res) => {
    try {
      const shopId = req.user!.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "No shop associated with this user" });
      }
      
      const updatedShop = await storage.updateShop(shopId, req.body);
      if (!updatedShop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(updatedShop);
    } catch (error) {
      console.error('Update shop settings error:', error);
      res.status(500).json({ message: "Failed to update shop settings" });
    }
  });

  // Get admin statistics
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get all shop applications (admin only)
  console.log('🔧 Registering admin routes...');
  app.get("/api/admin/shop-applications", requireAuth, requireAdmin, async (req, res) => {
    console.log("🔍 Admin shop applications route accessed");
    try {
      const applications = await storage.getAllShopApplications();
      console.log("✅ Shop applications fetched:", applications?.length || 0, "results");
      res.json(applications || []);
    } catch (error) {
      console.error('❌ Get shop applications error:', error);
      res.status(500).json({ message: "Failed to fetch applications", error: (error as Error).message });
    }
  });

  // Get all shops (admin only)
  app.get("/api/admin/shops", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allShops = await storage.getAllShops();
      res.json(allShops);
    } catch (error) {
      console.error('Get all shops error:', error);
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { users } = await import('../shared/schema');
      const allUsers = await db.select().from(users).orderBy(users.createdAt);
      res.json(allUsers);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update shop (admin only)
  app.patch('/api/admin/shops/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const updatedShop = await storage.updateShop(shopId, req.body);
      
      if (!updatedShop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(updatedShop);
    } catch (error) {
      console.error('Update shop error:', error);
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, req.body);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Toggle user status (admin only)
  app.patch("/api/admin/users/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const user = await storage.updateUser(userId, { isActive });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Hybrid image generation endpoint - microservice with local fallback
  app.post('/api/generate-image', async (req, res) => {
    const { htmlContent, filename } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ message: 'Missing htmlContent' });
    }

    // Try microservice first if configured
    const microserviceUrl = process.env.QR_MICROSERVICE_URL;
    
    if (microserviceUrl) {
      try {
        console.log('Using QR microservice:', microserviceUrl);
        
        const response = await fetch(microserviceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ htmlContent, filename }),
          signal: AbortSignal.timeout(35000) // 35 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.image) {
            // Convert base64 back to buffer
            const imageBuffer = Buffer.from(data.image, 'base64');
            
            // Set headers for image download
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="${data.filename || 'PrintEasy_QR.png'}"`);
            res.setHeader('Content-Length', imageBuffer.length);
            return res.send(imageBuffer);
          }
        }
        
        console.log('Microservice failed, falling back to local generation');
      } catch (microError) {
        console.log('Microservice error, falling back to local:', microError instanceof Error ? microError.message : 'Unknown error');
      }
    }

    // Fallback to local Puppeteer generation
    let browser = null;
    
    try {
      // Helper function to create full HTML document
      const createFullHtml = (bodyContent: string) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PrintEasy QR Code</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'brand-yellow': '#FFBF00',
                    'rich-black': '#000000'
                  }
                }
              }
            }
          </script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: 400px;
            }
          </style>
        </head>
        <body>${bodyContent}</body>
        </html>
      `;

      const puppeteer = await import('puppeteer');

      // Robust Puppeteer configuration with system Chromium detection
      const { execSync } = await import('child_process');
      
      // Find system Chromium path
      let chromiumPath = null;
      
      try {
        // Method 1: which command
        chromiumPath = execSync('which chromium', { encoding: 'utf8' }).trim();
        console.log('Found Chromium via which:', chromiumPath);
      } catch (e) {
        try {
          // Method 2: find in nix store
          chromiumPath = execSync('find /nix/store -name chromium -type f -executable 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
          console.log('Found Chromium in nix store:', chromiumPath);
        } catch (e2) {
          // Method 3: common paths
          const commonPaths = [
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/opt/google/chrome/chrome'
          ];
          
          for (const path of commonPaths) {
            try {
              execSync(`test -x ${path}`, { encoding: 'utf8' });
              chromiumPath = path;
              console.log('Found Chromium at common path:', chromiumPath);
              break;
            } catch (e3) {
              continue;
            }
          }
        }
      }

      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // CRITICAL: Prevents shared memory usage in containers
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-features=VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-crash-upload',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-font-subpixel-positioning',
          '--disable-lcd-text',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--hide-scrollbars',
          '--mute-audio'
        ],
        defaultViewport: { width: 400, height: 800 },
        timeout: 120000, // 2 minutes browser launch timeout
        // Use system Chromium if found, otherwise let Puppeteer handle it
        ...(chromiumPath && { executablePath: chromiumPath })
      };

      console.log('Launching Puppeteer with configuration:', {
        executablePath: launchOptions.executablePath,
        argsCount: launchOptions.args.length,
        nodeEnv: process.env.NODE_ENV
      });
      
      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 3 });
      
      // Set the full HTML content with increased timeout for robustness
      await page.setContent(createFullHtml(htmlContent), { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000 // Increased to 60 seconds for cold starts
      });

      // Wait for fonts and external resources to load completely
      await page.evaluate(() => {
        return document.fonts.ready;
      });
      
      // Extra safety wait
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get the body element and take screenshot
      const bodyHandle = await page.$('body');
      const screenshot = await bodyHandle!.screenshot({
        type: 'png',
        omitBackground: false,
      });

      await browser.close();
      browser = null;

      // Set headers for image download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'PrintEasy_QR.png'}"`);
      res.setHeader('Content-Length', screenshot.length);
      res.send(screenshot);

    } catch (error) {
      console.error('Image generation error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Log detailed system information for debugging
      console.error('System details:', {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch,
        puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        puppeteerSkipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
      });
      
      // Ensure browser is closed on error
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      res.status(500).json({ 
        message: 'Failed to generate image',
        error: 'Both microservice and local generation failed',
        details: 'Check server logs for detailed error information'
      });
    }
  });

  // Handle unmatched API routes LAST
  console.log('🚫 Adding API 404 handler...');
  app.use('/api/*', (req, res) => {
    console.log('❌ Unmatched API route:', req.originalUrl);
    res.status(404).json({ 
      message: `API endpoint ${req.originalUrl} not found`,
      error: 'Route not found' 
    });
  });

  console.log('✅ Route registration completed successfully!');
}

// Export separate function for WebSocket setup
export function setupWebSocket(httpServer: Server): void {
  console.log('🔗 Setting up WebSocket server...');
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          const userId = message.userId;
          if (userId) {
            wsConnections.set(userId, ws);
            ws.send(JSON.stringify({ type: 'authenticated', userId }));
          }
        }
        
        if (message.type === 'chat_message') {
          const { orderId, senderId, content } = message;
          
          // Save message to database
          const newMessage = await storage.createMessage({
            orderId,
            senderId,
            senderName: 'User',
            senderRole: 'customer',
            content,
            messageType: 'text'
          });
          
          // Get order details to find recipient
          const order = await storage.getOrder(orderId);
          if (order) {
            const recipientId = senderId === order.customerId ? order.shopId : order.customerId;
            const recipientWs = wsConnections.get(recipientId);
            
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'new_message',
                message: newMessage
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from map
      for (const [userId, connection] of Array.from(wsConnections.entries())) {
        if (connection === ws) {
          wsConnections.delete(userId);
          break;
        }
      }
    });
  });

  console.log('✅ WebSocket setup completed successfully!');
}
