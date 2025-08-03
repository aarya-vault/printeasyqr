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
  
  // Register admin routes
  app.use('/api/admin', adminRoutes);

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

  return httpServer;
}
