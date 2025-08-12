import { createServer } from "http";
import { createRequire } from "module";
import { setupVite } from "./vite.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const require = createRequire(import.meta.url);

console.log('🚀 PrintEasy QR - Vite Development Server');
console.log('✅ Vite + Sequelize integration');

(async () => {
  try {
    // Load the Sequelize app
    const appModule = await import("../src/app.js");
    const sequelizeApp = appModule.default;
    console.log('📦 Sequelize app loaded successfully');

    // Create HTTP server
    const server = createServer(sequelizeApp);
    console.log('🌐 HTTP server created with Sequelize routes');

    // 🚀 CRITICAL FIX: Setup WebSocket server for real-time notifications
    const setupWebSocketModule = await import("../src/utils/websocket.js");
    setupWebSocketModule.setupWebSocket(server);
    console.log('🔌 WebSocket server initialized for real-time chat');

    // Setup Vite development middleware
    await setupVite(sequelizeApp, server);
    console.log('🔧 Vite development server configured');

    const PORT = parseInt(process.env.PORT || '5000', 10);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ PrintEasy QR running on port ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/*`);
      console.log(`🎉 Vite development server started successfully!`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try {
        server.close(() => {
          console.log('HTTP server closed.');
        });
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start Vite development server:', error);
    process.exit(1);
  }
})();