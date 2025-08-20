#!/usr/bin/env node

/**
 * CRITICAL: Find why Replit deployment fails on first query
 * The connection succeeds but fails when actually querying
 */

console.log('🔴 FINDING THE REAL REPLIT ISSUE');
console.log('='.repeat(50));

// Simulate Replit environment EXACTLY
process.env.NODE_ENV = 'production';
process.env.REPLIT_DEPLOYMENT = 'true';

// This is the EXACT DATABASE_URL from Replit secrets
const REPLIT_DATABASE_URL = 'postgresql://neondb_owner:npg_omd9cTiyv1zH@ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';

console.log('Testing with Replit DATABASE_URL...');
console.log('URL:', REPLIT_DATABASE_URL.substring(0, 50) + '...');

import { Sequelize } from 'sequelize';

// Test 1: Basic connection
const testBasicConnection = async () => {
  console.log('\n📊 Test 1: Basic authenticate()...');
  
  const seq = new Sequelize(REPLIT_DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await seq.authenticate();
    console.log('✅ authenticate() works');
    return seq;
  } catch (err) {
    console.log('❌ authenticate() failed:', err.message);
    return null;
  }
};

// Test 2: Actual query (like /api/shops does)
const testActualQuery = async (seq) => {
  console.log('\n📊 Test 2: Actual query (simulating /api/shops)...');
  
  try {
    // This is what happens in shop.controller.js
    const [results] = await seq.query('SELECT COUNT(*) FROM "Shops"');
    console.log('✅ Query succeeded:', results);
  } catch (err) {
    console.log('❌ Query failed:', err.message);
    console.log('Error code:', err.original?.code);
    
    // Check if it's a connection pool issue
    if (err.message.includes('password authentication failed')) {
      console.log('\n🔴 CRITICAL: Connection pool is creating NEW connections with wrong credentials!');
      console.log('This happens when Sequelize creates additional connections for queries.');
    }
  }
};

// Test 3: Check environment variable timing
const testEnvironmentTiming = async () => {
  console.log('\n📊 Test 3: Environment variable timing...');
  
  // Clear environment
  delete process.env.DATABASE_URL;
  delete process.env.PGPASSWORD;
  
  console.log('Environment cleared');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  // Now set it (simulating Replit setting it late)
  setTimeout(() => {
    console.log('Setting DATABASE_URL after 100ms...');
    process.env.DATABASE_URL = REPLIT_DATABASE_URL;
    process.env.PGPASSWORD = 'npg_omd9cTiyv1zH';
  }, 100);
  
  // Try to use database immediately (before env is set)
  try {
    const { getSequelize } = await import('./src/config/database.js');
    const seq = getSequelize();
    console.log('Sequelize instance created');
    
    // Wait for env to be set
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Now try to query
    await seq.authenticate();
    console.log('✅ Late environment variable works');
  } catch (err) {
    console.log('❌ Late environment variable failed:', err.message);
  }
};

// Run tests
(async () => {
  const seq = await testBasicConnection();
  if (seq) {
    await testActualQuery(seq);
  }
  
  await testEnvironmentTiming();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔍 CONCLUSION:');
  console.log('The issue is likely that Replit sets environment variables');
  console.log('AFTER the Node.js process starts, causing Sequelize to');
  console.log('initialize with undefined credentials.');
  console.log('='.repeat(50));
})();