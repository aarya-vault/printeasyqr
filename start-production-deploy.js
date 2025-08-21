#!/usr/bin/env node

/**
 * Production Deployment Wrapper
 * This script ensures database migrations are skipped during Replit deployment
 * Prevents getting stuck at "Generating database migrations..."
 */

// Force skip all database operations during deployment
process.env.SKIP_MIGRATIONS = 'true';
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_DB_CHECK = 'true';
process.env.NODE_ENV = 'production';

// Mark as Replit deployment to avoid .env loading conflicts
process.env.REPLIT_DEPLOYMENT = 'true';

console.log('🚀 PrintEasy QR Production Deployment');
console.log('=====================================');
console.log('⏭️  Skipping database migrations (using existing schema)');
console.log('🔧 Replit deployment mode enabled');
console.log('✅ Environment configured for deployment:');
console.log('   REPLIT_DEPLOYMENT:', process.env.REPLIT_DEPLOYMENT);
console.log('   SKIP_MIGRATIONS:', process.env.SKIP_MIGRATIONS);
console.log('   DISABLE_DB_SYNC:', process.env.DISABLE_DB_SYNC);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);

// Import and run the production server with proper async handling
async function startProductionServer() {
  try {
    console.log('🔄 Importing production server module...');
    await import('./server/production.js');
    console.log('✅ Production server module loaded successfully');
  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the server
startProductionServer();