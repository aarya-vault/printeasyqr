import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createServer } from "http";
import { registerRoutes, setupWebSocket } from "./routes";
import seedDatabase from "./seed-data";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./error-handler";
import { createRequire } from "module";

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email?: string;
      phone?: string;
      name: string;
      role: string;
      shopId?: number;
    };
  }
}

const app = express();

// Add CORS headers for session management
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).json({ status: 'ok' });
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure PostgreSQL session store for persistence across server restarts
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session', // Will be created automatically
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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

console.log('🚀 Server startup beginning...');

(async () => {
  console.log('🔄 Async function started...');
  // Use createRequire for Sequelize server to avoid TypeScript module resolution issues
  const require = createRequire(import.meta.url);
  console.log('📁 createRequire completed...');
  const serverModule = require("../src/server.js");
  console.log('📦 Server module loaded...');
  const { startSequelizeServer, app: sequelizeApp } = serverModule;
  console.log('📝 Destructured server components...');
  
  // Create HTTP server
  console.log('🌐 Creating HTTP server...');
  const server = createServer(app);
  
  // Setup new TypeScript routes FIRST to avoid conflicts
  console.log('🔧 About to call registerRoutes...');
  try {
    await registerRoutes(app);
    console.log('✅ registerRoutes completed successfully');
  } catch (error) {
    console.error('❌ registerRoutes failed:', error);
    throw error;
  }
  
  // Setup WebSocket server
  console.log('🔧 Setting up WebSocket...');
  try {
    setupWebSocket(server);
    console.log('✅ WebSocket setup completed successfully');
  } catch (error) {
    console.error('❌ WebSocket setup failed:', error);
    throw error;
  }
  
  // Start Sequelize server AFTER new routes are registered
  console.log('🔧 About to start Sequelize server...');
  await startSequelizeServer(app);
  console.log('✅ Sequelize server started');
  
  // Note: WebSocket is now handled by registerRoutes
  // sequelizeApp.setupWebSocket(server); // Disabled to avoid conflicts

  // Old seed database is handled by Sequelize now
  // await seedDatabase();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 404 handler for non-API routes (after Vite setup)
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // Health check endpoint is now handled in registerRoutes

  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Enhanced server startup with error handling
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Handle server startup errors
  server.on('error', (error: any) => {
    console.error('Server startup error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Deployment may need port configuration.`);
    }
    process.exit(1);
  });

  // Graceful shutdown handling for deployment
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
})();
