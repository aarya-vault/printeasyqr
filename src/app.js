import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { WebSocketServer } from 'ws';
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

// Create Express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET || 'printeasy-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  }
}));

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

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Register API routes
// OLD ROUTES DISABLED - Using new TypeScript routing system
// app.use('/api', authRoutes);
// app.use('/api', userRoutes);
// app.use('/api', shopRoutes);
// app.use('/api', orderRoutes);
// app.use('/api', messageRoutes);
// app.use('/api', shopApplicationRoutes);
// app.use('/api/admin', adminRoutes);

// File download route
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

// REMOVED: This catch-all was blocking new TypeScript routes
// Unmatched API routes are now handled by the new system

// WebSocket setup function
app.setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  const wsConnections = new Map();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth' && data.userId) {
          wsConnections.set(data.userId, ws);
          ws.userId = data.userId;
          ws.send(JSON.stringify({ type: 'auth_success' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        wsConnections.delete(ws.userId);
      }
    });
  });

  // Make wsConnections available to the app
  app.wsConnections = wsConnections;
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;