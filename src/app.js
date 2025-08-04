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

// 🔥 FIXED CORS - Domain-based detection for Replit
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get('Host');
  
  // Fixed: Detect Replit by domain instead of env var
  const isReplit = origin?.includes('.replit.dev') || origin?.includes('.replit.co') || 
                   host?.includes('.replit.dev') || host?.includes('.replit.co');
  
  // Get the specific frontend URL
  let allowedOrigin = null;
  
  if (isReplit) {
    // For Replit: Use the exact origin from the request if it's a replit domain
    if (origin && (origin.includes('.replit.dev') || origin.includes('.replit.co'))) {
      allowedOrigin = origin; // Use the exact Replit URL
    }
  } else {
    // For local development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      allowedOrigin = origin;
    }
  }
  
  // Set SPECIFIC origin for credentials support
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

// 🔥 CRITICAL: Enhanced proxy trust for all environments
const isReplit = process.env.REPLIT_DOMAIN !== undefined;
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction || isReplit ? true : 1);

// 🔥 NEW SESSION SYSTEM - Built from scratch
const sessionMiddleware = createSessionMiddleware();
app.use(sessionMiddleware);

// Enhanced session debugging
app.use('/api', (req, res, next) => {
  const hasSessionCookie = req.headers.cookie && req.headers.cookie.includes('printeasy_session');
  console.log(`🔐 ${req.method} ${req.path}`);
  console.log(`📋 Session ID: ${req.sessionID}`);
  console.log(`🍪 Cookie Header: ${hasSessionCookie ? 'Has printeasy_session' : 'NO printeasy_session'}`);
  console.log(`👤 User: ${req.session?.user ? req.session.user.email || req.session.user.phone : 'None'}`);
  if (req.path.includes('/auth/') && req.headers.cookie) {
    console.log(`🍪 Full Cookie: ${req.headers.cookie}`);
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