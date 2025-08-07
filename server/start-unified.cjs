#!/usr/bin/env node

// PrintEasy QR - Unified Startup Script  
// Renamed to .cjs to force CommonJS in ES module project
const app = require('./app-unified.cjs');
const { createServer } = require('http');

console.log('🚀 PrintEasy QR - Starting Unified Server');

// Environment setup
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔧 Node.js: ${process.version}`);
console.log(`📦 Architecture: Pure CommonJS`);

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 PrintEasy QR Server Running Successfully!');
  console.log('========================================');
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('🎯 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/generate-qr');
  console.log('   POST /api/auth/customer/login');
  console.log('   POST /api/auth/shop-owner/login');
  console.log('   GET  /api/shops');
  console.log('   GET  /api/orders');
  console.log('   POST /api/orders');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PrintEasy server...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;