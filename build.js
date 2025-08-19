#!/usr/bin/env node

/**
 * Production Build Script for Replit Deployment
 * This script handles the build process while skipping database migrations
 * which can cause deployment to get stuck at "Generating database migrations..."
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('🚀 Starting production build for Replit deployment...');
console.log('⚠️  IMPORTANT: Database migrations are intentionally skipped');
console.log('📝 Database schema must be created manually in production');

// Set environment variables to skip database operations
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_MIGRATIONS = 'true';
process.env.SKIP_DB_CHECK = 'true';
process.env.NODE_ENV = 'production';

console.log('\n✅ Environment configured:');
console.log('   DISABLE_DB_SYNC:', process.env.DISABLE_DB_SYNC);
console.log('   SKIP_MIGRATIONS:', process.env.SKIP_MIGRATIONS);
console.log('   SKIP_DB_CHECK:', process.env.SKIP_DB_CHECK);
console.log('   NODE_ENV:', process.env.NODE_ENV);

try {
  // Check if vite.config.ts exists
  if (!fs.existsSync('vite.config.ts')) {
    throw new Error('vite.config.ts not found. Please ensure you are in the project root.');
  }

  console.log('\n📦 Building frontend assets with Vite...');
  
  // Run Vite build with environment variables
  execSync('npx vite build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DISABLE_DB_SYNC: 'true',
      SKIP_MIGRATIONS: 'true',
      SKIP_DB_CHECK: 'true',
      NODE_ENV: 'production'
    }
  });

  // Verify build output
  const distPath = path.join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log('\n✅ Build completed successfully!');
    console.log(`📁 Created ${files.length} files in dist/client`);
    
    // Check for index.html
    if (files.includes('index.html')) {
      console.log('✅ index.html found - build verified');
    } else {
      console.warn('⚠️  Warning: index.html not found in build output');
    }
  } else {
    throw new Error('Build output directory dist/client not found');
  }

  console.log('\n🎉 Production build completed successfully!');
  console.log('📝 Next steps for deployment:');
  console.log('   1. Ensure DATABASE_URL is set in production environment');
  console.log('   2. Database schema will use existing tables (no migrations)');
  console.log('   3. Run "npm start" to start the production server');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}