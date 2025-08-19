// Production server for deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Force production environment and disable database sync
process.env.NODE_ENV = 'production';
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_MIGRATIONS = 'true';
console.log('🚀 FORCED NODE_ENV to production');
console.log('⏭️  Database migrations DISABLED - using existing schema');

// PRODUCTION DATABASE CONFIGURATION
console.log('🔍 Production Database Environment Check:');
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT || 5000);
console.log('   Database Host:', process.env.PGHOST);

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL missing in production environment!');
  console.error('   Please configure DATABASE_URL in environment variables');
}

console.log('✅ Using PostgreSQL database from .env configuration');

// Test database connection on production startup
console.log('🔍 Testing production database connection...');
import { testConnection } from '../src/config/database.js';
try {
  await testConnection();
  console.log('✅ Production database connection successful');
} catch (error) {
  console.error('❌ CRITICAL: Production database connection failed:', error.message);
  console.error('   Verify DATABASE_URL credentials in deployment settings');
  // Don't exit, let the enhanced error logging in controllers handle it
}

// Import the Sequelize app
const sequelizeApp = await import('../src/app.js');
const app = sequelizeApp.default;

// Serve static files from dist/client
const clientPath = path.join(__dirname, '..', 'dist', 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket support
import { createServer } from 'http';
const server = createServer(app);

// Setup WebSocket for production
try {
  const { setupWebSocket } = await import('../src/utils/websocket.js');
  setupWebSocket(server);
  console.log('✅ WebSocket server configured for production');
} catch (error) {
  console.warn('⚠️ WebSocket setup failed:', error.message);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PrintEasy QR production server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket available at ws://0.0.0.0:${PORT}/ws`);
});