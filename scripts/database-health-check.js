#!/usr/bin/env node

/**
 * Database Health Check Script
 * Monitors database health and prevents conflicts
 */

import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function healthCheck() {
  console.log('\n🏥 Database Health Check\n' + '='.repeat(40));
  
  try {
    // 1. Connection test
    await sequelize.authenticate();
    console.log('✅ Database connection: OK');
    
    // 2. Check table counts
    const [tables] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`✅ Tables found: ${tables[0].count}`);
    
    // 3. Check for locks
    const [locks] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM pg_locks 
      WHERE granted = false
    `);
    console.log(`✅ Waiting locks: ${locks[0].count}`);
    
    // 4. Check active connections
    const [connections] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    console.log(`✅ Active connections: ${connections[0].count}`);
    
    // 5. Database size
    const [size] = await sequelize.query(`
      SELECT pg_database_size(current_database()) as size
    `);
    const sizeInMB = (parseInt(size[0].size) / 1024 / 1024).toFixed(2);
    console.log(`✅ Database size: ${sizeInMB} MB`);
    
    console.log('\n✅ Database health check passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();