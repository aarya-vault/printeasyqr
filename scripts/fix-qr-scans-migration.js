#!/usr/bin/env node
/**
 * CRITICAL FIX: QR Scans Table Migration
 * Resolves production database conflicts by safely renaming user_id to customer_id
 * Based on development database schema (the correct one)
 */

import { sequelize } from '../src/config/database.js';

async function fixQRScansTable() {
  console.log('🔧 FIXING QR Scans table migration conflicts...');
  
  try {
    // Check current table structure
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'qr_scans' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current qr_scans columns:', columns.map(c => c.column_name));
    
    const hasUserId = columns.some(c => c.column_name === 'user_id');
    const hasCustomerId = columns.some(c => c.column_name === 'customer_id');
    
    if (hasUserId && !hasCustomerId) {
      console.log('🔄 RENAMING user_id to customer_id...');
      
      // Rename the column safely
      await sequelize.query(`
        ALTER TABLE qr_scans 
        RENAME COLUMN user_id TO customer_id;
      `);
      
      console.log('✅ Successfully renamed user_id to customer_id');
      
    } else if (hasCustomerId && !hasUserId) {
      console.log('✅ Table already has customer_id column - no migration needed');
      
    } else if (hasUserId && hasCustomerId) {
      console.log('⚠️ Both user_id and customer_id exist - removing duplicate user_id');
      
      // Drop the old user_id column if both exist
      await sequelize.query(`
        ALTER TABLE qr_scans 
        DROP COLUMN user_id;
      `);
      
      console.log('✅ Removed duplicate user_id column');
      
    } else {
      console.log('❌ Neither user_id nor customer_id found - creating customer_id');
      
      // Add customer_id column if missing
      await sequelize.query(`
        ALTER TABLE qr_scans 
        ADD COLUMN customer_id INTEGER REFERENCES users(id);
      `);
      
      console.log('✅ Added customer_id column');
    }
    
    // Verify final structure matches development
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'qr_scans' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final qr_scans structure:');
    finalColumns.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    console.log('✅ QR Scans table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
fixQRScansTable().catch(console.error);