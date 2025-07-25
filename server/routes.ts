import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertMessageSchema, insertShopApplicationSchema, users } from "@shared/schema";
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

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password from database (stored in password field)
      if (!user.password || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json(user);
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
      const ownerId = parseInt(req.params.ownerId);
      if (isNaN(ownerId)) {
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
          relatedId: order.id,
          isRead: false
        });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Internal server error" });
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
      const orders = await storage.getOrdersByShop(parseInt(req.params.shopId));
      res.json(orders);
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
        relatedId: order.id,
        isRead: false
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
      const validation = insertMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid message data" });
      }
      
      const message = await storage.createMessage(validation.data);
      res.json(message);
    } catch (error) {
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
        
        // Check if phone number already exists
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
          isPublic: true,

          totalOrders: 0
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
        relatedId: application.id,
        isRead: false
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
