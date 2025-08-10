import { createServer } from "http";
import { setupVite } from "./vite.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 PrintEasy QR - Vite Development Server');
console.log('✅ Vite + Sequelize integration');

(async () => {
  try {
    // Load the Sequelize app
    const { default: sequelizeApp } = await import("../src/app.js");
    console.log('📦 Sequelize app loaded successfully');

    // Create HTTP server
    const server = createServer(sequelizeApp);
    console.log('🌐 HTTP server created with Sequelize routes');

    // Setup Vite development middleware
    await setupVite(sequelizeApp, server);
    console.log('🔧 Vite development server configured');

    const PORT = parseInt(process.env.PORT || '3001', 10);

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