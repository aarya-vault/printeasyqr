import type { Express } from "express";
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

      // Admin login special case
      if (email === 'admin@printeasy.com' && password === 'admin123') {
        const adminUser = {
          id: 1,
          email: 'admin@printeasy.com',
          name: 'Admin',
          role: 'admin' as const
        };
        req.session.user = adminUser;
        await req.session.save();
        return res.json(adminUser);
      }

      // Shop owner login - check shop applications table
      const shop = await storage.getShopByEmail(email);
      if (shop && shop.password === password) {
        const shopOwnerUser = {
          id: shop.ownerId,
          email: shop.email,
          name: shop.ownerFullName || 'Shop Owner',
          role: 'shop_owner' as const,
          phone: shop.ownerPhone || '0000000000'
        };
        req.session.user = shopOwnerUser;
        await req.session.save();
        return res.json(shopOwnerUser);
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
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

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin login
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !email.includes('@') || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // For security, check admin credentials first
      if (email !== 'admin@printeasy.com' || password !== 'admin123') {
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
      
      res.json({ user });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Shop routes
  
  // Update shop settings endpoint - MUST be first to avoid being caught by :id routes
  app.patch('/api/shops/settings', async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const shop = await storage.getShopByOwnerId(userId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const updatedShop = await storage.updateShopSettings(shop.id, req.body);
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
  app.post("/api/orders", upload.array('files'), async (req, res) => {
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
        files = (req.files as Express.Multer.File[]).map(file => file.filename);
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
      const orders = await storage.getOrdersByCustomer(parseInt(req.params.customerId));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/shop/:shopId", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      const orders = await storage.getOrdersByShop(shopId);
      
      // Add customer names and unread message counts
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const customer = await storage.getUser(order.customerId);
        const messages = await storage.getMessagesByOrder(order.id);
        const unreadMessages = messages.filter(m => 
          !m.isRead
        ).length;
        
        return {
          ...order,
          customerName: customer?.name || 'Unknown',
          customerPhone: customer?.phone || '',
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
          customerName: customer?.name || 'Unknown',
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
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || '',
        shopName: shop?.name || 'Unknown'
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status required" });
      }
      
      const order = await storage.updateOrder(parseInt(req.params.id), { status });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
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

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const updates = req.body;
      const order = await storage.updateOrder(parseInt(req.params.id), updates);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
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

  // Message routes
  app.get("/api/messages/order/:orderId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByOrder(parseInt(req.params.orderId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      console.log('Message creation request:', req.body);
      
      const validation = insertMessageSchema.safeParse(req.body);
      if (!validation.success) {
        console.error('Message validation failed:', validation.error);
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: validation.error.errors 
        });
      }
      
      const message = await storage.createMessage(validation.data);
      console.log('Message created successfully:', message);
      
      // Broadcast message via WebSocket
      const order = await storage.getOrder(validation.data.orderId);
      if (order) {
        // Get shop owner ID if the sender is the customer
        let recipientId = order.customerId;
        if (validation.data.senderId === order.customerId) {
          const shop = await storage.getShop(order.shopId);
          recipientId = shop?.ownerId || order.customerId;
        }
        
        if (recipientId) {
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
        
        // Store password separately if needed (in real app, hash this)
        await storage.updateUser(shopOwner.id, { password: req.body.password });
        
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

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(parseInt(req.params.userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationAsRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes - moved higher in priority
  app.get("/api/admin", (req, res) => {
    res.json({ message: "Admin API active" });
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/shop-applications", async (req, res) => {
    try {
      const applications = await storage.getAllShopApplications();
      res.json(applications);
    } catch (error) {
      console.error("Admin shop applications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/shops", async (req, res) => {
    try {
      const shops = await storage.getActiveShops();
      res.json(shops);
    } catch (error) {
      console.error("Admin shops error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
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

  // Admin comprehensive shop application editing
  app.put("/api/admin/shop-applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const application = await storage.updateShopApplication(applicationId, updateData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Update shop application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin comprehensive shop application editing - PATCH method
  app.patch("/api/admin/shop-applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const application = await storage.updateShopApplication(applicationId, updateData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Update shop application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin user management routes
  app.put("/api/admin/users/:id", async (req, res) => {
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

  app.patch("/api/admin/users/:id/status", async (req, res) => {
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

  app.delete("/api/admin/users/:id", async (req, res) => {
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
  app.get("/api/admin/shop-orders", async (req, res) => {
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

  // Admin update shop settings
  app.patch('/api/shops/:id/settings', async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      const updatedShop = await storage.updateShopSettings(shopId, req.body);
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
          customerName: customer?.name || 'Unknown',
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

  // File serving
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  return httpServer;
}
