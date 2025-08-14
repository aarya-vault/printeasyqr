// Production server for deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Force production environment for all imports
process.env.NODE_ENV = 'production';
console.log('🚀 FORCED NODE_ENV to production for QR controller selection');

// PRODUCTION DATABASE CONFIGURATION - FORCE CORRECT CREDENTIALS
console.log('🔍 Production Database Environment Check:');
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   PORT:', process.env.PORT || 'undefined');
console.log('   PGPASSWORD available:', !!process.env.PGPASSWORD);
console.log('   PGHOST:', process.env.PGHOST || 'undefined');

// CRITICAL FIX: Force correct database URL if production has cached old one
const CORRECT_DATABASE_URL = 'postgresql://neondb_owner:npg_Di0XSQx1ONHM@ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL missing in production environment!');
  console.error('   Setting correct DATABASE_URL programmatically...');
  process.env.DATABASE_URL = CORRECT_DATABASE_URL;
  process.env.PGHOST = 'ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech';
  process.env.PGUSER = 'neondb_owner';
  process.env.PGPASSWORD = 'npg_Di0XSQx1ONHM';
  process.env.PGDATABASE = 'neondb';
} else if (process.env.DATABASE_URL.includes('ep-still-sound') || !process.env.DATABASE_URL.includes('npg_Di0XSQx1ONHM')) {
  console.warn('⚠️ WARNING: Production using OLD database credentials!');
  console.log('   Overriding with correct production database...');
  process.env.DATABASE_URL = CORRECT_DATABASE_URL;
  process.env.PGHOST = 'ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech';
  process.env.PGUSER = 'neondb_owner';
  process.env.PGPASSWORD = 'npg_Di0XSQx1ONHM';
  process.env.PGDATABASE = 'neondb';
}

console.log('✅ DATABASE_URL configured with correct production credentials');

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