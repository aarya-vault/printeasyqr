#!/usr/bin/env node
/**
 * DISABLE REPLIT KV DATABASE COMPLETELY
 * This script ensures ONLY PostgreSQL/Sequelize is used
 * Prevents migration conflicts with Replit's database system
 */

// Block ALL Replit database modules
const replitDbModules = [
  '@replit/database',
  'replit-database', 
  '@replit/db',
  'replit-db',
  '@replit/object-storage'
];

// Override require for CommonJS
const originalRequire = require;
require = function(id) {
  if (replitDbModules.some(mod => id.includes(mod))) {
    console.log(`🚫 BLOCKED Replit module: ${id}`);
    throw new Error(`Replit database modules disabled - use PostgreSQL/Sequelize only`);
  }
  return originalRequire.apply(this, arguments);
};

// Override import for ES modules
const originalResolve = require.resolve;
require.resolve = function(id) {
  if (replitDbModules.some(mod => id.includes(mod))) {
    console.log(`🚫 BLOCKED Replit module resolve: ${id}`);
    throw new Error(`Replit database modules disabled - use PostgreSQL/Sequelize only`);
  }
  return originalResolve.apply(this, arguments);
};

// Remove environment variables that trigger Replit database detection
delete process.env.REPLIT_DB_URL;
delete process.env.REPLIT_DATABASE_URL;
delete process.env.REPLIT_KV_URL;

// Set explicit flags
process.env.DISABLE_REPLIT_DATABASE = 'true';
process.env.FORCE_SEQUELIZE_ONLY = 'true';
process.env.DATABASE_TYPE = 'postgresql';
process.env.ORM = 'sequelize';

console.log('💥 Replit KV database completely disabled');
console.log('✅ Only PostgreSQL/Sequelize allowed');

export default true;