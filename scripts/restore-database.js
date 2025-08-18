#!/usr/bin/env node

/**
 * Database Restore Script
 * Safely restores database from backup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function restoreDatabase() {
  console.log('\n🔄 Database Restore Utility');
  console.log('=' .repeat(50));
  
  try {
    // List available backups
    const files = await fs.readdir('.');
    const backups = files.filter(f => f.startsWith('database_backup_') && f.endsWith('.sql'));
    
    if (backups.length === 0) {
      console.log('❌ No backup files found');
      process.exit(1);
    }
    
    console.log('\n📚 Available backups:');
    backups.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
    
    // Get user choice
    const choice = await question('\nSelect backup number (or filename): ');
    
    let backupFile;
    if (isNaN(choice)) {
      backupFile = choice;
    } else {
      backupFile = backups[parseInt(choice) - 1];
    }
    
    if (!backupFile || !backups.includes(backupFile)) {
      console.log('❌ Invalid selection');
      rl.close();
      process.exit(1);
    }
    
    // Confirmation
    const confirm = await question(`\n⚠️ This will REPLACE all current data. Continue? (yes/no): `);
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      rl.close();
      process.exit(0);
    }
    
    // Perform restore
    console.log(`\n🔄 Restoring from: ${backupFile}`);
    
    const databaseUrl = process.env.DATABASE_URL;
    const { stdout, stderr } = await execAsync(
      `psql ${databaseUrl} < ${backupFile}`
    );
    
    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('already exists')) {
      console.log(`⚠️ Warnings: ${stderr}`);
    }
    
    console.log('✅ Database restored successfully!');
    
    // Run conflict check
    console.log('\n🔍 Running conflict check...');
    await execAsync('node scripts/ensure-no-conflicts.js');
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

restoreDatabase();