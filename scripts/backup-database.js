#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates timestamped backups for production and development
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const backupFile = `database_backup_${timestamp}_${time}.sql`;
  
  console.log('\n📦 Creating database backup...');
  console.log('=' .repeat(50));
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Create backup
    console.log(`📁 Backup file: ${backupFile}`);
    const { stdout, stderr } = await execAsync(
      `pg_dump ${databaseUrl} > ${backupFile}`
    );
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.log(`⚠️ Warnings: ${stderr}`);
    }
    
    // Verify backup file
    const stats = await fs.stat(backupFile);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Backup created successfully (${sizeInMB} MB)`);
    console.log(`📍 Location: ${path.resolve(backupFile)}`);
    
    // List recent backups
    const files = await fs.readdir('.');
    const backups = files.filter(f => f.startsWith('database_backup_'));
    
    console.log(`\n📚 Available backups: ${backups.length}`);
    backups.slice(-5).forEach(b => console.log(`   • ${b}`));
    
    console.log('\n✅ Backup completed successfully!');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backupDatabase();