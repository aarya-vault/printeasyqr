import express from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
// DISABLED: WebSocket import removed - handled by new system
// import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database sync function
import { syncDatabase } from './models/index.js';

// ES Module compatibility fix for serverless environments
const __filename = import.meta ? fileURLToPath(import.meta.url) : __filename;
const __dirname = import.meta ? dirname(__filename) : __dirname;

// Import logger
import { logger } from './utils/logger.js';

// Initialize database tables (development only)
if (process.env.NODE_ENV === 'development') {
  logger.info('Initializing database tables...');
  syncDatabase(false)
    .then(() => {
      logger.database.sync('All models');
    })
    .catch((error) => {
      logger.database.error('synchronization', error);
    });
}

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import shopOwnerAnalyticsRoutes from './routes/shopOwnerAnalytics.routes.js';
import orderRoutes from './routes/order.routes.js';
import messageRoutes from './routes/message.routes.js';
import shopApplicationRoutes from './routes/shopApplication.routes.js';
import adminRoutes from './routes/admin.routes.js';
import qrRoutes from './routes/qr.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import pincodeRoutes from './routes/pincode.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { setupWebSocket } from './utils/websocket.js';

// Create Express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// FINAL CORS FIX - Ensure credentials work properly
app.use((req, res, next) => {
  // Get origin
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For same-origin requests, allow the request
    const host = req.get('host');
    if (host) {
      res.setHeader('Access-Control-Allow-Origin', `https://${host}`);
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CRITICAL: Trust proxy for Replit environment
app.set('trust proxy', true);

// 🔍 Request Debug Middleware (Pure JWT)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('--- 🔍 JWT Request ---');
    console.log(`➡️  Request Origin: ${req.headers.origin || 'Same-origin'}`);
    console.log(`🔐 ${req.method} ${req.path}`);
    console.log(`🎫 JWT Token: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    console.log('--------------------');
  }
  next();
});


// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV === 'development') {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        if (jsonStr.length <= 80) {
          logLine += ` :: ${jsonStr}`;
        }
      }
      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 🔥 CRITICAL FIX: Ensure API routes are handled before Vite middleware
// This prevents the Vite catch-all from intercepting API requests
app.use('/api*', (req, res, next) => {
  // Mark this as an API request to prevent Vite interference
  req.isApiRequest = true;
  next();
});

// Register API routes - SEQUELIZE SYSTEM ACTIVATED  
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', shopRoutes);
app.use('/api/shop-owner', shopOwnerAnalyticsRoutes);
app.use('/api', orderRoutes);
app.use('/api', messageRoutes);
app.use('/api', shopApplicationRoutes);
app.use('/api', qrRoutes);
app.use('/api', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shop-owner', shopOwnerAnalyticsRoutes);

// File download route - Protected with authentication
app.get('/api/download/:filename', requireAuth, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

// 🔥 CRITICAL FIX: File serving route for viewing files (not downloading)
// This allows frontend to display uploaded files in chat, order details, etc.
// Note: Browser img tags can't send auth headers, so we use a more permissive approach
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  // Basic security check - ensure file exists and path is safe
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  
  if (fs.existsSync(filePath)) {
    // Set appropriate headers for file viewing
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set proper MIME types for common file types
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Security header
    
    console.log(`📁 Serving file: ${filename} (${contentType})`);
    res.sendFile(path.resolve(filePath));
  } else {
    console.log(`❌ File not found: ${filename}`);
    res.status(404).json({ message: 'File not found' });
  }
});

// REMOVED: This catch-all was blocking new TypeScript routes
// Unmatched API routes are now handled by the new system

// DISABLED: WebSocket setup now handled by new TypeScript system
// This was causing WebSocket conflicts and is no longer needed
// WebSocket functionality is now in server/routes.ts

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;