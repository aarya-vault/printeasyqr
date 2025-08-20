#!/usr/bin/env node

/**
 * CRITICAL DEBUG: Find the EXACT point of failure in Replit deployment
 */

console.log('🔴 REPLIT DEPLOYMENT CRITICAL DEBUG');
console.log('='.repeat(50));

// Simulate EXACT Replit deployment
process.env.SKIP_MIGRATIONS = 'true';
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_DB_CHECK = 'true';
process.env.NODE_ENV = 'production';
process.env.REPLIT_DEPLOYMENT = 'true';

// Remove any existing DATABASE_URL first
delete process.env.DATABASE_URL;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGUSER;
delete process.env.PGDATABASE;

console.log('Step 1: Environment BEFORE setting credentials');
console.log('  DATABASE_URL:', process.env.DATABASE_URL);
console.log('');

// Now set them like Replit does
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_omd9cTiyv1zH@ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
process.env.PGPASSWORD = 'npg_omd9cTiyv1zH';
process.env.PGHOST = 'ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech';
process.env.PGUSER = 'neondb_owner';
process.env.PGDATABASE = 'neondb';

console.log('Step 2: Environment AFTER setting credentials');
console.log('  DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('');

console.log('Step 3: Testing raw Sequelize connection...');
import { Sequelize } from 'sequelize';

// Test with EXACT same configuration as production
const testDirectConnection = async () => {
  const dbUrl = process.env.DATABASE_URL;
  
  console.log('Creating Sequelize instance with:');
  console.log('  URL:', dbUrl.substring(0, 50) + '...');
  
  const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: (msg) => console.log('  SQL:', msg),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    console.log('Attempting authentication...');
    await sequelize.authenticate();
    console.log('✅ DIRECT CONNECTION WORKS!');
    return true;
  } catch (error) {
    console.log('❌ DIRECT CONNECTION FAILED!');
    console.log('Error:', error.message);
    console.log('Error code:', error.original?.code);
    console.log('Error detail:', error.original?.detail);
    return false;
  }
};

// Test the production startup flow
const testProductionStartup = async () => {
  console.log('\nStep 4: Testing production startup flow...');
  
  try {
    // This is EXACTLY what happens in start-production-deploy.js
    console.log('Loading production server...');
    const module = await import('./server/production.js');
    console.log('✅ Production server loaded');
  } catch (error) {
    console.log('❌ Production server failed to load');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }
};

// Run tests
testDirectConnection().then(async (success) => {
  if (success) {
    await testProductionStartup();
  }
  process.exit(success ? 0 : 1);
});