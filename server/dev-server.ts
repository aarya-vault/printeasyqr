import { createServer } from "http";
import { createRequire } from "module";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Node.js compatibility for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🚀 PrintEasy - Development Server (Fixed)');
console.log('✅ Zero Vite config dependencies');
console.log('✅ Pure Sequelize system');

(async () => {
  try {
    // Load the Sequelize app
    const sequelizeApp = require("../src/app.js").default;
    console.log('📦 Sequelize app loaded successfully');

    // Development static serving
    if (process.env.NODE_ENV !== 'production') {
      const clientPath = path.join(__dirname, '..', 'client');
      sequelizeApp.use(express.static(clientPath));
      
      // SPA routing for React - serve index.html for non-API routes
      sequelizeApp.get('*', (req: any, res: any, next: any) => {
        if (req.path.startsWith('/api/')) {
          return next();
        }
        res.sendFile(path.join(clientPath, 'index.html'));
      });
      
      console.log('📁 Static file serving configured for development');
    }

    // Create HTTP server
    const server = createServer(sequelizeApp);
    console.log('🌐 HTTP server created with Sequelize routes');

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ PrintEasy running on port ${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/*`);
      console.log(`📊 System: 100% Sequelize ORM`);
      console.log('🎉 Development server started successfully!');
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
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    async function shutdown() {
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
    }

  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
})();