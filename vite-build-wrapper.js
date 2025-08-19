#!/usr/bin/env node

// Wrapper script for Vite build to handle database migration issues
console.log('🚀 Starting Vite build wrapper...');

// Set environment variables to skip database operations during build
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_MIGRATIONS = 'true';
process.env.NODE_ENV = 'production';

console.log('✅ Environment configured for build:');
console.log('   DISABLE_DB_SYNC:', process.env.DISABLE_DB_SYNC);
console.log('   SKIP_MIGRATIONS:', process.env.SKIP_MIGRATIONS);
console.log('   NODE_ENV:', process.env.NODE_ENV);

// Import and run Vite build
import { build } from 'vite';

console.log('📦 Building frontend assets...');

build().then(() => {
  console.log('✅ Frontend build completed successfully!');
  console.log('⚠️  Note: Database schema must be manually created in production');
  process.exit(0);
}).catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});