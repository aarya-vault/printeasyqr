#!/usr/bin/env node

/**
 * Database Setup Script for PrintEasy QR
 * This script ensures database is properly configured for both development and production
 * - Checks database connection
 * - Verifies table structure
 * - Ensures no conflicts
 * - Handles both development and production environments
 */

import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const execAsync = promisify(exec);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseConnection() {
  try {
    await sequelize.authenticate();
    log('✅ Database connection established successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Unable to connect to database: ' + error.message, 'red');
    return false;
  }
}

async function checkTablesExist() {
  try {
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const requiredTables = [
      'users', 'shops', 'orders', 'messages', 
      'notifications', 'shop_applications', 
      'shop_unlocks', 'qr_scans', 'customer_shop_unlocks'
    ];
    
    const existingTables = results.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      log(`✅ All required tables exist (${existingTables.length} tables found)`, 'green');
      return true;
    } else {
      log(`⚠️ Missing tables: ${missingTables.join(', ')}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Error checking tables: ' + error.message, 'red');
    return false;
  }
}

async function getRecordCounts() {
  try {
    const tables = ['users', 'shops', 'orders', 'shop_applications'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = result[0].count;
      } catch (e) {
        counts[table] = 'error';
      }
    }
    
    log('\n📊 Database Record Counts:', 'cyan');
    Object.entries(counts).forEach(([table, count]) => {
      if (count !== 'error') {
        log(`   ${table}: ${count} records`, 'blue');
      }
    });
    
    return counts;
  } catch (error) {
    log('❌ Error getting record counts: ' + error.message, 'red');
    return {};
  }
}

async function checkForConflicts() {
  try {
    // Check for duplicate shop slugs
    const [duplicateSlugs] = await sequelize.query(`
      SELECT slug, COUNT(*) as count 
      FROM shops 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateSlugs.length > 0) {
      log('⚠️ Found duplicate shop slugs:', 'yellow');
      duplicateSlugs.forEach(dup => {
        log(`   ${dup.slug}: ${dup.count} occurrences`, 'yellow');
      });
      return false;
    }
    
    // Check for duplicate emails in shops
    const [duplicateEmails] = await sequelize.query(`
      SELECT email, COUNT(*) as count 
      FROM shops 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateEmails.length > 0) {
      log('⚠️ Found duplicate shop emails:', 'yellow');
      duplicateEmails.forEach(dup => {
        log(`   ${dup.email}: ${dup.count} occurrences`, 'yellow');
      });
      return false;
    }
    
    log('✅ No database conflicts found', 'green');
    return true;
  } catch (error) {
    log('❌ Error checking for conflicts: ' + error.message, 'red');
    return false;
  }
}

async function restoreBackupIfNeeded() {
  try {
    // Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      log('\n🔄 Tables missing, attempting to restore from backup...', 'yellow');
      
      // Look for the most recent backup file
      const backupFile = 'database_backup_20250818_190836.sql';
      const backupPath = path.join(process.cwd(), backupFile);
      
      try {
        await fs.access(backupPath);
        log(`📁 Found backup file: ${backupFile}`, 'cyan');
        
        // Restore the backup
        const databaseUrl = process.env.DATABASE_URL;
        const { stdout, stderr } = await execAsync(`psql ${databaseUrl} < ${backupPath}`);
        
        if (stderr && !stderr.includes('NOTICE')) {
          log(`⚠️ Restore warnings: ${stderr}`, 'yellow');
        }
        
        log('✅ Database restored from backup successfully', 'green');
        return true;
      } catch (fileError) {
        log(`❌ Backup file not found: ${backupFile}`, 'red');
        log('Please ensure the backup file exists in the project root', 'yellow');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log('❌ Error during backup restore: ' + error.message, 'red');
    return false;
  }
}

async function setupDatabase() {
  log('\n🚀 PrintEasy QR Database Setup', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // Step 1: Check connection
  log('\n1️⃣ Checking database connection...', 'blue');
  const connected = await checkDatabaseConnection();
  if (!connected) {
    log('❌ Database setup failed: Cannot connect to database', 'red');
    process.exit(1);
  }
  
  // Step 2: Check and restore tables if needed
  log('\n2️⃣ Checking database tables...', 'blue');
  const restored = await restoreBackupIfNeeded();
  if (!restored) {
    log('❌ Database setup failed: Could not restore tables', 'red');
    process.exit(1);
  }
  
  // Step 3: Verify tables exist
  log('\n3️⃣ Verifying table structure...', 'blue');
  const tablesOk = await checkTablesExist();
  if (!tablesOk) {
    log('❌ Database setup failed: Required tables missing', 'red');
    process.exit(1);
  }
  
  // Step 4: Check for conflicts
  log('\n4️⃣ Checking for data conflicts...', 'blue');
  const noConflicts = await checkForConflicts();
  if (!noConflicts) {
    log('⚠️ Warning: Data conflicts detected but continuing...', 'yellow');
  }
  
  // Step 5: Get record counts
  log('\n5️⃣ Getting database statistics...', 'blue');
  await getRecordCounts();
  
  // Final status
  log('\n' + '=' .repeat(50), 'green');
  log('✅ Database setup completed successfully!', 'green');
  log('=' .repeat(50), 'green');
  
  // Environment-specific message
  const env = process.env.NODE_ENV || 'development';
  log(`\n📌 Environment: ${env}`, 'cyan');
  log(`📌 Database: ${process.env.PGDATABASE || 'PostgreSQL'}`, 'cyan');
  
  if (env === 'production') {
    log('\n🔐 Production mode: Database sync is disabled', 'yellow');
    log('   All schema changes must be done via migrations', 'yellow');
  } else {
    log('\n🔧 Development mode: Database sync is disabled for safety', 'blue');
    log('   Use backup/restore for schema updates', 'blue');
  }
  
  process.exit(0);
}

// Run the setup
setupDatabase().catch(error => {
  log('\n❌ Fatal error during database setup:', 'red');
  log(error.message, 'red');
  process.exit(1);
});