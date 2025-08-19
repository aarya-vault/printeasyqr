// Production server for deployment
import '../force-database-config.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRITICAL: Force production environment with YOUR PostgreSQL database
process.env.NODE_ENV = 'production';
console.log('🚀 Production mode with custom PostgreSQL database');

// Use YOUR PostgreSQL database credentials
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_omd9cTiyv1zH@ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
process.env.PGDATABASE = 'neondb';
process.env.PGHOST = 'ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech';
process.env.PGPORT = '5432';
process.env.PGUSER = 'neondb_owner';
process.env.PGPASSWORD = 'npg_omd9cTiyv1zH';

console.log('✅ Using YOUR PostgreSQL database - NOT Replit database');
console.log('✅ Sequelize ORM only - NO Drizzle, NO Replit integrations');

// PRODUCTION DATABASE CONFIGURATION
console.log('🔍 Production Database Environment Check:');
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   PORT:', process.env.PORT || 'undefined');
console.log('   PGPASSWORD available:', !!process.env.PGPASSWORD);
console.log('   PGHOST:', process.env.PGHOST || 'undefined');

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL missing in production environment!');
  console.error('   Please configure DATABASE_URL in environment variables');
}

console.log('✅ Using PostgreSQL database from environment variables');

// CRITICAL: Override database configuration for production with enhanced settings
console.log('🔧 Configuring production database connection pool...');
process.env.DB_POOL_MAX = '20';
process.env.DB_POOL_MIN = '5';  
process.env.DB_ACQUIRE_TIMEOUT = '120000';
process.env.DB_IDLE_TIMEOUT = '60000';
process.env.DB_CONNECT_TIMEOUT = '120000';

// Test database connection and verify schema on production startup
console.log('🔍 Testing production database connection and schema...');
import { testConnection } from '../src/config/database.js';
try {
  await testConnection();
  console.log('✅ Production database connection successful');
  
  // Quick schema verification to prevent migration conflicts
  const { sequelize } = await import('../src/config/database.js');
  const [qrScanCheck] = await sequelize.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'qr_scans' AND column_name = 'customer_id'
  `);
  
  if (qrScanCheck.length > 0) {
    console.log('✅ Database schema verified - customer_id column exists');
  } else {
    console.log('⚠️ Schema warning - customer_id column may need migration');
  }
  
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