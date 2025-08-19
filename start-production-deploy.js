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

console.log('🚀 PrintEasy QR Production Deployment');
console.log('=====================================');
console.log('⏭️  Skipping database migrations (using existing schema)');
console.log('✅ Environment configured for deployment:');
console.log('   SKIP_MIGRATIONS:', process.env.SKIP_MIGRATIONS);
console.log('   DISABLE_DB_SYNC:', process.env.DISABLE_DB_SYNC);
console.log('   NODE_ENV:', process.env.NODE_ENV);

// Import and run the production server
import('./server/production.js').catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});