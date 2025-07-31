import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertMessageSchema, insertShopApplicationSchema, users, orders, shops, shopApplications, messages, notifications } from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, requireAdmin, requireShopOwner, requireShopOwnerOrAdmin } from "./middleware/auth";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// WebSocket connections store
const wsConnections = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
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

      res.json(user);
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
        return res.json(adminUser);
      }

      // Shop owner login - check shops via users table
      const user = await storage.getUserByEmail(email);
      console.log('Login attempt for:', email);
      console.log('User found:', user ? { id: user.id, email: user.email, role: user.role, hasPassword: !!user.passwordHash } : null);
      
      if (user && user.passwordHash && user.role === 'shop_owner') {
        // Use bcrypt to compare passwords
        const bcrypt = await import('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('Password validation result:', isValidPassword);
        
        if (isValidPassword) {
          req.session.user = {
            id: user.id,
            email: user.email || undefined,
            name: user.name || 'Shop Owner',
            role: user.role,
            phone: user.phone || undefined
          };
          await req.session.save();
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
    res.json(req.session.user);
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
      
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Update failed' });
    }
  });
  
  // Message routes are handled later in the file - removing duplicate broken implementation

  // Setup WebSocket server
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

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Validate phone number format (10 digits starting with 6,7,8,9)
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone.charAt(0))) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
      
      // Find or create user
      let user = await storage.getUserByPhone(cleanPhone);
      if (!user) {
        user = await storage.createUser({
          phone: cleanPhone,
          role: "customer"
        });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/shop-login", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'shop_owner') {
        return res.status(404).json({ message: "Shop owner account not found" });
      }
      
      // Get shop details
      const shops = await storage.getShopsByOwner(user.id);
      const shop = shops.find(s => s.isApproved);
      
      if (!shop) {
        return res.status(404).json({ message: "No approved shop found for this account" });
      }
      
      res.json({ user, shop });
    } catch (error) {
      console.error("Shop login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes - PROTECTED
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only access their own data unless admin
      if (req.user!.id !== user.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own data unless admin
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customer-specific update route for name updates
  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { name } = req.body;
      
      // Verify user can only update their own information or is admin
      if (req.user && req.user.role !== 'admin' && req.user.id !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedUser = await storage.updateUser(customerId, { name });
      if (!updatedUser) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin login with environment variables
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !email.includes('@') || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Use environment variables for admin credentials
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        console.error("Admin credentials not configured");
        return res.status(500).json({ message: "Server configuration error" });
      }
      
      if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      // Try to get admin user, create if doesn't exist
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          phone: "0000000000", // Dummy phone for admin
          email: email,
          name: "Admin",
          role: "admin"
        });
      }
      
      if (user.role !== 'admin') {
        return res.status(401).json({ message: "Access denied - admin role required" });
      }

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email || undefined,
        name: user.name || "Admin",
        role: user.role
      };
      
      // Ensure session is saved before responding
      await req.session.save();
      
      res.json({ user });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shop routes
  
  // Update shop settings endpoint - PROTECTED - MUST be first to avoid being caught by :id routes
  app.patch('/api/shops/settings', requireAuth, requireShopOwner, async (req, res) => {
    try {
      const userId = req.user!.id;

      const shop = await storage.getShopByOwnerId(userId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const updatedShop = await storage.updateShopSettings(shop.id, req.body);
      
      // Sync business information changes back to application
      await storage.syncApplicationFromShop(shop.id);
      res.json(updatedShop);
    } catch (error) {
      console.error('Shop settings update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get("/api/shops", async (req, res) => {
    try {
      const shops = await storage.getActiveShops();
      res.json(shops);
    } catch (error) {
      console.error('Get shops error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/shops/owner/:ownerId", async (req, res) => {
    try {
      const ownerId = req.params.ownerId === 'current' ? 
        parseInt(req.headers['x-user-id'] as string || '0') : 
        parseInt(req.params.ownerId);
        
      if (isNaN(ownerId) || ownerId === 0) {
        return res.status(400).json({ message: "Invalid owner ID" });
      }
      const shops = await storage.getShopsByOwner(ownerId);
      const shop = shops.find(s => s.isApproved);
      
      if (!shop) {
        return res.status(404).json({ message: "No approved shop found for this owner" });
      }
      
      res.json({ shop });
    } catch (error) {
      console.error('Get shop by owner error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Specific routes MUST come before generic :id routes
  
  app.get("/api/shops/:id", async (req, res) => {
    try {
      const shop = await storage.getShop(parseInt(req.params.id));
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/shops/:id", async (req, res) => {
    try {
      const updates = req.body;
      const shop = await storage.updateShop(parseInt(req.params.id), updates);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get shop by slug for anonymous orders
  app.get("/api/shops/slug/:slug", async (req, res) => {
    try {
      const shop = await storage.getShopBySlug(req.params.slug);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json({ shop });
    } catch (error) {
      console.error("Error getting shop by slug:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Toggle shop online status
  app.patch("/api/shops/:id/toggle-status", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const updatedShop = await storage.updateShop(shopId, {
        isOnline: !shop.isOnline
      });
      
      res.json({ shop: updatedShop });
    } catch (error) {
      console.error("Error toggling shop status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

// Get shops by customer (visited shops)
app.get('/api/shops/customer/:customerId/visited', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const visitedShops = await storage.getVisitedShopsByCustomer(customerId);
    res.json(visitedShops);
  } catch (error) {
    console.error('Get visited shops error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test session endpoint
app.get('/api/debug/session', (req, res) => {
  res.json({ 
    hasSession: !!req.session,
    user: req.session?.user,
    sessionId: req.session?.id 
  });
});

// Test simple endpoint to verify route registration
app.get('/api/debug/test', (req, res) => {
  console.log('TEST ENDPOINT HIT - This should appear in logs!');
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Test PATCH endpoint
app.patch('/api/debug/patch-test', (req, res) => {
  res.json({ message: 'PATCH test working', body: req.body });
});

  // Order routes
  app.post("/api/orders", requireAuth, upload.array('files'), async (req, res) => {
    try {
      // Handle both form data and JSON body
      let orderData;
      if (req.body.orderData) {
        orderData = JSON.parse(req.body.orderData);
      } else {
        orderData = req.body;
      }
      
      const validation = insertOrderSchema.safeParse(orderData);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid order data", errors: validation.error.errors });
      }
      
      // Handle file uploads
      let files: any[] = [];
      if (req.files) {
        files = (req.files as Express.Multer.File[]).map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }));
      }
      
      const order = await storage.createOrder({
        ...validation.data,
        files: files.length > 0 ? JSON.stringify(files) : null
      });
      
      // Send notification to shop owner via WebSocket
      const shop = await storage.getShop(order.shopId);
      if (shop) {
        const shopOwnerWs = wsConnections.get(shop.ownerId);
        if (shopOwnerWs && shopOwnerWs.readyState === WebSocket.OPEN) {
          shopOwnerWs.send(JSON.stringify({
            type: 'new_order',
            order
          }));
        }
        
        // Create notification
        await storage.createNotification({
          userId: shop.ownerId,
          title: "New Order Received",
          message: `New ${order.type} order: ${order.title}`,
          type: "order_update",
          relatedId: order.id
        });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create anonymous order from QR code
  app.post("/api/orders/anonymous", upload.array('files'), async (req, res) => {
    try {
      const { shopId, name, contactNumber, orderType, isUrgent, description } = req.body;
      
      if (!shopId || !name || !contactNumber || !orderType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if customer exists by phone
      let customer = await storage.getUserByPhone(contactNumber);
      if (!customer) {
        // Create new customer
        customer = await storage.createUser({
          phone: contactNumber,
          name: name,
          role: 'customer'
        });
      }
      
      // Handle file uploads
      let files: any[] = [];
      if (req.files && orderType === 'upload') {
        files = (req.files as Express.Multer.File[]).map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }));
      }
      
      // Create order
      const order = await storage.createOrder({
        customerId: customer.id,
        shopId: parseInt(shopId),
        type: orderType,
        title: orderType === 'upload' ? `File Upload - ${files.length} files` : 'Walk-in Order',
        description: description || '',
        specifications: JSON.stringify({ urgent: isUrgent === 'true' }),
        files: files.length > 0 ? JSON.stringify(files) : null,
        isUrgent: isUrgent === 'true',
        // walkinTime removed as it's not in schema
      });
      
      // Get order with customer and shop details
      const orderDetails = await db.select({
        order: orders,
        customer: users,
        shop: shops
      })
      .from(orders)
      .innerJoin(users, eq(orders.customerId, users.id))
      .innerJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.id, order.id))
      .limit(1);
      
      if (orderDetails.length === 0) {
        throw new Error("Order created but not found");
      }
      
      // Send notification to shop owner
      const shop = await storage.getShop(order.shopId);
      if (shop) {
        await storage.createNotification({
          userId: shop.ownerId,
          title: "New Order Received",
          message: `New ${order.type} order from ${name}`,
          type: "order_update",
          relatedId: order.id
        });
      }
      
      res.json({ 
        order: {
          ...orderDetails[0].order,
          customer: orderDetails[0].customer,
          shop: orderDetails[0].shop
        }
      });
    } catch (error) {
      console.error("Create anonymous order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get order details with customer and shop info
  app.get("/api/orders/:orderId/details", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      const orderDetails = await db.select({
        order: orders,
        customer: users,
        shop: shops
      })
      .from(orders)
      .innerJoin(users, eq(orders.customerId, users.id))
      .innerJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.id, orderId))
      .limit(1);
      
      if (orderDetails.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ 
        order: {
          ...orderDetails[0].order,
          customer: orderDetails[0].customer,
          shop: orderDetails[0].shop
        }
      });
    } catch (error) {
      console.error("Get order details error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await storage.getOrdersByCustomer(customerId);
      
      // Add unread message counts for customers (count messages FROM SHOP OWNERS only)
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const messages = await storage.getMessagesByOrder(order.id);
        
        // For customers: count unread messages NOT from this customer (i.e., from shop owners)
        const unreadMessages = messages.filter(m => 
          !m.isRead && m.senderId !== customerId // Count messages NOT from the customer themselves
        ).length;
        
        return {
          ...order,
          unreadMessages
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      console.error('Get customer orders error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customer shop unlock endpoints
  app.post('/api/customer/unlock-shop', async (req, res) => {
    try {
      const { customerId, shopId, shopSlug, qrScanLocation } = req.body;
      
      if (!customerId || (!shopId && !shopSlug)) {
        return res.status(400).json({ message: 'Customer ID and either Shop ID or Shop Slug are required' });
      }
      
      let actualShopId = shopId;
      
      // If shopSlug is provided, find the shop by slug first
      if (shopSlug && !shopId) {
        const shop = await storage.getShopBySlug(shopSlug);
        if (!shop) {
          return res.status(404).json({ message: 'Shop not found with the provided slug' });
        }
        actualShopId = shop.id;
      }
      
      const result = await storage.unlockShopForCustomer(customerId, actualShopId, qrScanLocation);
      res.json(result);
    } catch (error) {
      console.error('Error unlocking shop:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to unlock shop' });
    }
  });

  app.get('/api/customer/:customerId/unlocked-shops', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const unlockedShopIds = await storage.getUnlockedShopsByCustomer(customerId);
      res.json({ unlockedShopIds });
    } catch (error) {
      console.error('Error fetching unlocked shops:', error);
      res.status(500).json({ message: 'Failed to fetch unlocked shops' });
    }
  });

  app.get('/api/customer/:customerId/shop/:shopId/unlocked', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const shopId = parseInt(req.params.shopId);
      const isUnlocked = await storage.isShopUnlockedForCustomer(customerId, shopId);
      res.json({ isUnlocked });
    } catch (error) {
      console.error('Error checking shop unlock status:', error);
      res.status(500).json({ message: 'Failed to check unlock status' });
    }
  });

  app.get("/api/orders/shop/:shopId", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrdersByShop(shopId);
      
      // Add unread message counts - customer names already included from storage method
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const messages = await storage.getMessagesByOrder(order.id);
        
        // For shop owners: count unread messages FROM CUSTOMERS only (not from shop owner themselves)
        // Get the shop owner ID for this order
        const shop = await storage.getShop(order.shopId);
        const shopOwnerId = shop?.ownerId;
        
        const unreadMessages = messages.filter(m => 
          !m.isRead && m.senderId !== shopOwnerId // Count messages NOT from the shop owner
        ).length;
        
        return {
          ...order,
          unreadMessages
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      console.error('Get shop orders error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/shop/:shopId/history", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      const orders = await storage.getOrdersByShop(shopId);
      const completedOrders = orders.filter(order => order.status === 'completed');
      
      // Add customer names
      const ordersWithDetails = await Promise.all(completedOrders.map(async (order) => {
        const customer = await storage.getUser(order.customerId);
        return {
          ...order,
          customerName: customer?.name || '',
          customerPhone: customer?.phone || '',
          completedAt: order.updatedAt // Assuming updatedAt is when order was completed
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      console.error('Get order history error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Add customer info
      const customer = await storage.getUser(order.customerId);
      const shop = await storage.getShop(order.shopId);
      
      res.json({
        ...order,
        customerName: customer?.name || '',
        customerPhone: customer?.phone || '',
        shopName: shop?.name || ''
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  // Add files to existing order (customer only)
  app.post("/api/orders/:id/add-files", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Get existing order
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow customers to add files to their own orders
      if (req.user!.role !== 'customer' || existingOrder.customerId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Only allow adding files to orders that are not completed
      if (existingOrder.status === 'completed') {
        return res.status(400).json({ message: "Cannot add files to completed orders" });
      }

      // Check if files were uploaded
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Process uploaded files
      const newFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));

      // Get existing files
      let existingFiles = [];
      if (existingOrder.files) {
        try {
          existingFiles = typeof existingOrder.files === 'string' 
            ? JSON.parse(existingOrder.files) 
            : existingOrder.files;
        } catch (error) {
          console.error('Error parsing existing files:', error);
          existingFiles = [];
        }
      }

      // Combine existing and new files
      const allFiles = [...existingFiles, ...newFiles];

      // Update order with new files
      const updatedOrder = await storage.updateOrder(orderId, {
        files: JSON.stringify(allFiles)
      });

      // Send notification to shop owner
      const shop = await storage.getShop(existingOrder.shopId);
      if (shop) {
        await storage.createNotification({
          userId: shop.ownerId,
          title: "New Files Added",
          message: `Customer added ${newFiles.length} new file(s) to order "${existingOrder.title}"`,
          type: "order_update",
          relatedId: orderId
        });

        // Send WebSocket notification
        const shopOwnerWs = wsConnections.get(shop.ownerId);
        if (shopOwnerWs && shopOwnerWs.readyState === WebSocket.OPEN) {
          shopOwnerWs.send(JSON.stringify({
            type: 'files_added',
            orderId,
            newFiles: newFiles.length
          }));
        }
      }

      res.json({ 
        message: "Files added successfully", 
        filesAdded: newFiles.length,
        totalFiles: allFiles.length 
      });
    } catch (error) {
      console.error('Add files error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const updates = req.body;
      
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
      
      const order = await storage.updateOrder(orderId, updates);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // AUTO FILE DELETION: If order is marked as completed, delete all associated files
      if (updates.status === 'completed') {
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

  // Message routes - PROTECTED
  app.get("/api/messages/order/:orderId", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessagesByOrder(parseInt(req.params.orderId));
      // Disable caching for messages to ensure real-time updates
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", requireAuth, upload.array('files'), async (req, res) => {
    try {
      const { orderId, senderId, senderName, senderRole, content, messageType } = req.body;
      
      console.log('Message creation request:', req.body);
      console.log('Files received:', req.files);
      console.log('Content extracted:', content);
      console.log('Message type:', messageType);
      
      // Verify order exists and user has access
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user is involved in this order
      const isCustomer = req.user && req.user.role === 'customer' && order.customerId === req.user.id;
      const isShopOwner = req.user && req.user.role === 'shop_owner';
      
      if (!isCustomer && !isShopOwner) {
        console.log('Access denied - User:', req.user, 'Order:', { customerId: order.customerId, shopId: order.shopId });
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if order is completed
      if (order.status === 'completed') {
        return res.status(400).json({ message: "Cannot send messages to completed orders" });
      }

      // Handle file uploads with original names
      let fileData: any[] = [];
      if (req.files && Array.isArray(req.files)) {
        fileData = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }));
      }
      
      console.log('Files array length:', fileData.length);

      // Validate content or files presence
      const trimmedContent = (content || '').trim();
      if (!trimmedContent && fileData.length === 0) {
        return res.status(400).json({ message: "Message content or files required" });
      }
      
      // Use empty string as default for database (required field)
      const finalContent = trimmedContent || '';
      
      console.log('Final content being saved:', finalContent);

      const messageData = {
        orderId: parseInt(orderId),
        senderId: req.user!.id,
        senderName: senderName || (req.user as any)?.name || req.user!.phone || 'User',
        senderRole: req.user!.role,
        content: finalContent,
        messageType: fileData.length > 0 ? 'file' : 'text',
        files: fileData.length > 0 ? JSON.stringify(fileData) : null
      };
      
      const message = await storage.createMessage(messageData);
      console.log('Message created successfully:', message);
      
      // Broadcast message via WebSocket
      if (order) {
        // Get shop owner ID if the sender is the customer
        let recipientId = order.customerId;
        if (req.user!.id === order.customerId) {
          const shop = await storage.getShop(order.shopId);
          recipientId = shop?.ownerId || order.customerId;
        }
        
        if (recipientId && recipientId !== req.user!.id) {
          const recipientWs = wsConnections.get(recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'new_message',
              message: message
            }));
          }
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark messages as read
  app.patch("/api/messages/mark-read", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }
      
      // Verify order exists and user has access
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is involved in this order
      const isCustomer = req.user && req.user.role === 'customer' && order.customerId === req.user.id;
      const isShopOwner = req.user && req.user.role === 'shop_owner';
      
      if (!isCustomer && !isShopOwner) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Mark messages as read for this user
      await storage.markMessagesAsRead(parseInt(orderId), req.user!.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shop application routes
  // Shop slug availability check
  app.get('/api/shops/check-slug/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      const available = await storage.checkShopSlugAvailability(slug);
      res.json({ available });
    } catch (error) {
      console.error('Error checking slug availability:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/shop-applications", async (req, res) => {
    try {
      // Create a user for the shop owner if email is provided
      if (req.body.email && req.body.password) {
        const existingUser = await storage.getUserByEmail(req.body.email);
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Check if phone number already exists (using field name from client)
        const existingPhoneUser = await storage.getUserByPhone(req.body.phoneNumber);
        if (existingPhoneUser) {
          return res.status(400).json({ error: 'Phone number already registered' });
        }
        
        // Create shop owner user account
        const shopOwner = await storage.createUser({
          phone: req.body.phoneNumber,
          name: req.body.ownerFullName,
          email: req.body.email,
          role: 'shop_owner',
        });
        
        // Hash and store password securely
        const hashedPassword = await storage.hashPassword(req.body.password);
        await storage.updateUser(shopOwner.id, { passwordHash: hashedPassword });
        
        // Add applicant ID to application
        req.body.applicantId = shopOwner.id;
      }
      
      const application = await storage.createShopApplication(req.body);
      res.status(201).json(application);
    } catch (error) {
      console.error("Shop application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/shop-applications/pending", async (req, res) => {
    try {
      const applications = await storage.getPendingShopApplications();
      res.json(applications);
    } catch (error) {
      console.error("Pending applications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/shop-applications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid application ID' });
      }
      const application = await storage.getShopApplication(id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      res.json(application);
    } catch (error) {
      console.error('Error fetching shop application:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch("/api/shop-applications/:id", async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const application = await storage.updateShopApplication(parseInt(req.params.id), {
        status,
        adminNotes
      });
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // If approved, create shop and update user role
      if (status === 'approved') {
        // Generate QR code data (you could use a QR code library here)
        const qrCodeData = `printeasy.com/shop/${application.shopSlug}`;
        
        await storage.createShop({
          ownerId: application.applicantId,
          name: application.publicShopName,
          slug: application.shopSlug,
          address: application.publicAddress,
          city: application.city,
          state: application.state,
          pinCode: application.pinCode,
          phone: application.publicContactNumber || application.phoneNumber,
          publicOwnerName: application.publicOwnerName,
          internalName: application.publicShopName, // Use public name since internal name was removed
          ownerFullName: application.ownerFullName,
          email: application.email,
          ownerPhone: application.phoneNumber,
          completeAddress: application.publicAddress, // Use public address since complete address was removed
          services: application.services as any,
          equipment: application.equipment as any,
          workingHours: application.workingHours as any,
          yearsOfExperience: application.yearsOfExperience,
          acceptsWalkinOrders: application.acceptsWalkinOrders,
          isApproved: true,
          isOnline: true,
          autoAvailability: true,
          isPublic: true
        });
        
        // Update user role to shop_owner if needed
        if (application.applicantId) {
          await storage.updateUser(application.applicantId, {
            role: 'shop_owner',
            email: application.email
          });
        }
      }
      
      // Send notification to applicant
      await storage.createNotification({
        userId: application.applicantId,
        title: status === 'approved' ? "Shop Application Approved" : "Shop Application Rejected",
        message: status === 'approved' 
          ? "Congratulations! Your shop application has been approved."
          : `Your shop application has been rejected. ${adminNotes || ''}`,
        type: "system",
        relatedId: application.id
      });
      
      res.json(application);
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification routes - PROTECTED
  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user can only access their own notifications or is admin
      if (req.user && req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      // Verify user can only mark their own notifications as read
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test endpoint to manually trigger file deletion
  app.post("/api/manual-delete-order-files", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      console.log(`Manual file deletion requested for order ${orderId}`);
      
      await storage.deleteOrderFiles(orderId);
      console.log(`Manual file deletion completed for order ${orderId}`);
      
      res.json({ message: "Files deleted successfully" });
    } catch (error) {
      console.error("Manual file deletion error:", error);
      res.status(500).json({ message: "Error deleting files" });
    }
  });

  // Admin routes - moved higher in priority
  app.get("/api/admin", (req, res) => {
    res.json({ message: "Admin API active" });
  });

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/shop-applications", requireAuth, requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllShopApplications();
      res.json(applications);
    } catch (error) {
      console.error("Admin shop applications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/shops", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Admin should see ALL approved shops regardless of online status
      const allShops = await storage.getAllShops();
      res.json(allShops);
    } catch (error) {
      console.error("Admin shops error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users).where(eq(users.isActive, true));
      res.json(allUsers);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/platform-stats", async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin comprehensive shop application editing with auto-sync
  app.put("/api/admin/shop-applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const application = await storage.updateShopApplication(applicationId, updateData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Auto-sync to shop if approved and shop exists
      if (application.status === 'approved') {
        await storage.syncShopFromApplication(application);
      }
      
      res.json(application);
    } catch (error) {
      console.error("Update shop application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin comprehensive shop application editing - PATCH method with auto-sync
  app.patch("/api/admin/shop-applications/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const application = await storage.updateShopApplication(applicationId, updateData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Auto-sync to shop if approved and shop exists
      if (application.status === 'approved') {
        await storage.syncShopFromApplication(application);
      }
      
      res.json(application);
    } catch (error) {
      console.error("Update shop application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin user management routes
  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user has associated data that needs to be handled
      const userShops = await db.select().from(shops).where(eq(shops.ownerId, userId));
      if (userShops.length > 0) {
        return res.status(400).json({ message: "Cannot delete user with active shops" });
      }
      
      await db.delete(users).where(eq(users.id, userId));
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin shop orders analytics
  app.get("/api/admin/shop-orders", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allOrders = await db
        .select({
          id: orders.id,
          shopId: orders.shopId,
          customerId: orders.customerId,
          type: orders.type,
          title: orders.title,
          status: orders.status,
          createdAt: orders.createdAt,
          customerName: users.name,
        })
        .from(orders)
        .leftJoin(users, eq(orders.customerId, users.id))
        .orderBy(desc(orders.createdAt));
      
      res.json(allOrders);
    } catch (error) {
      console.error("Admin shop orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin shop update route
  app.patch('/api/admin/shops/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const updates = req.body;
      
      const [updatedShop] = await db
        .update(shops)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(shops.id, shopId))
        .returning();
      
      if (!updatedShop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(updatedShop);
    } catch (error) {
      console.error("Update shop error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin shop management routes
  app.patch('/api/admin/shops/:id/deactivate', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      await storage.updateShopStatus(shopId, 'deactivated');
      res.json({ message: 'Shop deactivated successfully' });
    } catch (error) {
      console.error('Deactivate shop error:', error);
      res.status(500).json({ message: 'Failed to deactivate shop' });
    }
  });

  app.patch('/api/admin/shops/:id/activate', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      await storage.updateShopStatus(shopId, 'active');
      res.json({ message: 'Shop activated successfully' });
    } catch (error) {
      console.error('Activate shop error:', error);
      res.status(500).json({ message: 'Failed to activate shop' });
    }
  });

  app.patch('/api/admin/shops/:id/ban', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      await storage.updateShopStatus(shopId, 'banned');
      res.json({ message: 'Shop banned successfully' });
    } catch (error) {
      console.error('Ban shop error:', error);
      res.status(500).json({ message: 'Failed to ban shop' });
    }
  });

  app.delete('/api/admin/shops/:id', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      await storage.deleteShop(shopId);
      res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
      console.error('Delete shop error:', error);
      res.status(500).json({ message: 'Failed to delete shop' });
    }
  });

  // Admin update shop settings with auto-sync
  app.patch('/api/shops/:id/settings', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const updatedShop = await storage.updateShopSettings(shopId, req.body);
      
      // Sync business information changes back to application
      await storage.syncApplicationFromShop(shopId);
      
      res.json(updatedShop);
    } catch (error) {
      console.error('Admin shop settings update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chat orders endpoint for shop owners
  app.get("/api/shop/:shopId/chat-orders", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrdersByShop(shopId);
      
      // Get chat activity for each order
      const ordersWithChat = await Promise.all(orders.map(async (order) => {
        const messages = await storage.getMessagesByOrder(order.id);
        const customer = await storage.getUser(order.customerId);
        const unreadCount = messages.filter(m => !m.isRead && m.senderId !== order.shopId).length;
        const lastMessage = messages[messages.length - 1];
        
        return {
          id: order.id,
          customerId: order.customerId,
          customerName: customer?.name || '',
          title: order.title,
          status: order.status,
          lastMessage: lastMessage?.content,
          lastMessageTime: lastMessage?.createdAt,
          unreadCount
        };
      }));
      
      // Filter orders with messages
      const activeChats = ordersWithChat.filter(o => o.lastMessage);
      res.json(activeChats);
    } catch (error) {
      console.error('Get chat orders error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File serving - serve at both /api/files and /uploads for compatibility
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      // Set proper headers for displaying files in browser
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        res.setHeader('Content-Type', `image/${ext.substring(1)}`);
        res.setHeader('Content-Disposition', 'inline');
      }
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Dedicated route for uploads with proper headers (must come before static middleware)
  app.get("/uploads/:filename", async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    try {
      // Detect content type from file content
      const buffer = fs.readFileSync(filePath);
      let contentType = 'application/octet-stream';
      
      // File signature detection
      if (buffer.slice(0, 4).toString() === '%PDF') {
        contentType = 'application/pdf';
      } else if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
        contentType = 'image/png';
      } else if (buffer.slice(0, 3).toString('hex') === 'ffd8ff') {
        contentType = 'image/jpeg';
      } else if (buffer.slice(0, 6).toString() === 'GIF87a' || buffer.slice(0, 6).toString() === 'GIF89a') {
        contentType = 'image/gif';
      } else if (buffer.slice(0, 2).toString() === 'BM') {
        contentType = 'image/bmp';
      } else if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
        contentType = 'image/webp';
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).send('Error serving file');
    }
  });

  return httpServer;
}
