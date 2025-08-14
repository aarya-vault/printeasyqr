// Production server for deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PRODUCTION DATABASE CONFIGURATION
console.log('🔍 Production Database Environment Check:');
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   PORT:', process.env.PORT || 'undefined');
console.log('   PGPASSWORD available:', !!process.env.PGPASSWORD);
console.log('   PGHOST:', process.env.PGHOST || 'undefined');

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL missing in production environment!');
  console.error('   Please configure DATABASE_URL in deployment settings');
  process.exit(1);
}

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
app.listen(PORT, () => {
  console.log(`🚀 PrintEasy QR production server running on port ${PORT}`);
});