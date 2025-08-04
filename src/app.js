import express from 'express';
import { createSessionMiddleware } from './config/session.js';
// DISABLED: WebSocket import removed - handled by new system
// import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import orderRoutes from './routes/order.routes.js';
import messageRoutes from './routes/message.routes.js';
import shopApplicationRoutes from './routes/shopApplication.routes.js';
import adminRoutes from './routes/admin.routes.js';
import qrRoutes from './routes/qr.routes.js';
import { setupWebSocket } from './utils/websocket.js';

// Create Express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🔥 FINAL CORS FIX - Explicit allowlist for Replit domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Simplified: Allow any .replit.dev/.replit.co origin + localhost
  let allowedOrigin = null;
  
  if (origin) {
    if (origin.includes('.replit.dev') || origin.includes('.replit.co')) {
      allowedOrigin = origin; // Any Replit domain
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      allowedOrigin = origin; // Local development
    }
  }
  
  // ALWAYS set CORS headers for credentials
  if (allowedOrigin) {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Essential headers for session support
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Set-Cookie, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 🔥 CRITICAL: Trust proxy for secure cookies on Replit
app.set('trust proxy', 1);

// 🔥 NEW SESSION SYSTEM - Built from scratch
const sessionMiddleware = createSessionMiddleware();
app.use(sessionMiddleware);

// 🔍 CORS and Session Debug Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log('--- 🔍 New Request ---');
    console.log(`➡️  Request Origin: ${req.headers.origin || 'Same-origin'}`);
    console.log(`⬅️  Access-Control-Allow-Origin: ${res.getHeader('Access-Control-Allow-Origin') || 'Not set'}`);
    console.log(`🔑 Access-Control-Allow-Credentials: ${res.getHeader('Access-Control-Allow-Credentials') || 'Not set'}`);
    console.log(`🍪 Cookie Header Received: ${req.headers.cookie ? 'Yes, cookie present' : 'No cookie received'}`);
    console.log(`🔐 ${req.method} ${req.path}`);
    console.log(`📋 Session ID: ${req.sessionID}`);
    console.log(`👤 User: ${req.session?.user ? req.session.user.email || req.session.user.phone : 'None'}`);
    console.log('--------------------');
  }
  
  // Capture Set-Cookie header in response
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'set-cookie' && req.path.startsWith('/api/')) {
      console.log(`🍪 SET-COOKIE HEADER BEING SENT: ${value}`);
    }
    return originalSetHeader.call(this, name, value);
  };
  
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
app.use('/api', orderRoutes);
app.use('/api', messageRoutes);
app.use('/api', shopApplicationRoutes);
app.use('/api', qrRoutes);
app.use('/api/admin', adminRoutes);

// File download route
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  } else {
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