import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./error-handler";
import { createRequire } from "module";

// PRODUCTION SEQUELIZE SYSTEM - All TypeScript/Drizzle dependencies removed

console.log('🚀 PrintEasy Server - SEQUELIZE PRODUCTION SYSTEM Starting...');

(async () => {
  console.log('🔄 Initializing Sequelize-based server...');
  
  // Load Sequelize app using CommonJS require
  const require = createRequire(import.meta.url);
  const sequelizeApp = require("../src/app.js").default;
  
  console.log('📦 Sequelize app loaded successfully');
  
  // Create HTTP server with Sequelize app
  const server = createServer(sequelizeApp);
  console.log('🌐 HTTP server created with Sequelize routes');
  
  // WebSocket setup temporarily disabled to resolve Vite HMR conflicts
  // TODO: Implement WebSocket on a separate port if needed
  console.log('🔌 WebSocket server setup skipped (avoiding Vite HMR conflicts)');
  
  // Setup Vite for development or static serving for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(sequelizeApp, server);
    console.log('🔧 Vite development server configured');
  } else {
    serveStatic(sequelizeApp);
    console.log('📁 Static file serving configured');
  }

  // Add 404 handler for non-API routes
  sequelizeApp.use(notFoundHandler);
  
  // Add global error handler
  sequelizeApp.use(errorHandler);

  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start server
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🎉 PrintEasy SEQUELIZE server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    log('✅ Migration to Sequelize ORM completed successfully!');
  });

  // Error handling
  server.on('error', (error: any) => {
    console.error('❌ Server startup error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();