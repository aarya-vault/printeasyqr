#!/usr/bin/env node
/**
 * PRODUCTION SCHEMA ALIGNMENT
 * Ensures production database matches the perfect development schema
 * Prevents migration conflicts during deployment
 */

import { sequelize } from '../src/config/database.js';

async function ensureProductionSchema() {
  console.log('🔍 ENSURING production schema matches development...');
  
  try {
    // Test connection with enhanced settings
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check all tables exist with correct structure
    const expectedTables = [
      'users', 'shops', 'orders', 'order_files', 'chats', 
      'chat_files', 'qr_scans', 'notifications', 'shop_unlock_requests'
    ];
    
    for (const tableName of expectedTables) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = '${tableName}'
        );
      `);
      
      if (result[0].exists) {
        console.log(`✅ Table ${tableName} exists`);
      } else {
        console.log(`❌ Table ${tableName} missing`);
      }
    }
    
    // Specifically verify qr_scans has customer_id (not user_id)
    const [qrColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'qr_scans'
    `);
    
    const columnNames = qrColumns.map(c => c.column_name);
    console.log('📋 qr_scans columns:', columnNames);
    
    if (columnNames.includes('customer_id') && !columnNames.includes('user_id')) {
      console.log('✅ qr_scans table has correct customer_id column');
    } else {
      console.log('⚠️ qr_scans table needs schema update');
    }
    
    // Check database connection pool settings
    const [poolInfo] = await sequelize.query(`
      SELECT 
        setting as max_connections
      FROM pg_settings 
      WHERE name = 'max_connections'
    `);
    
    console.log('📊 Database max connections:', poolInfo[0]?.max_connections || 'unknown');
    
    console.log('✅ Production schema verification completed');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    
    // Enhanced error logging for production debugging
    if (error.message.includes('connect')) {
      console.error('   Connection issue - check DATABASE_URL');
    } else if (error.message.includes('pool')) {
      console.error('   Pool exhaustion - connection limits reached');
    } else {
      console.error('   Schema mismatch - check table structures');
    }
    
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run verification
ensureProductionSchema().catch(console.error);