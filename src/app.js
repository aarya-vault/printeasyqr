import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
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

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }
  next();
});

// Body parsing middleware - MUST BE BEFORE SESSION
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for proper cookie handling - CRITICAL for Replit
app.set('trust proxy', 1); // Trust first proxy to get correct protocol from X-Forwarded-Proto

// Session configuration
const PgSession = connectPgSimple(session);

// 🔥 CRITICAL SESSION FIX - With debugging
const sessionMiddleware = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session',
    errorLog: console.error.bind(console)
  }),
  secret: process.env.SESSION_SECRET || 'printeasy-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true, // Changed to true to ensure session is created
  name: 'connect.sid',
  cookie: {
    secure: 'auto', // 'auto' sets Secure flag if connection is HTTPS (via proxy)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax', // 'lax' works for same-origin requests
    path: '/', // Ensure cookie is available on all paths
  },
  rolling: true, // Reset expiry on activity
  proxy: true // Changed to true for Replit environment
});

app.use(sessionMiddleware);

// Add response interceptor to log cookies
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    const originalJson = res.json;
    res.json = function(data) {
      console.log('🍪 Auth Response:');
      console.log('  - Path:', req.path);
      console.log('  - Session ID:', req.sessionID);
      console.log('  - Session:', req.session);
      console.log('  - Set-Cookie headers:', res.getHeaders()['set-cookie']);
      return originalJson.call(this, data);
    };
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