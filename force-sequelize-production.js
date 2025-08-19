#!/usr/bin/env node
/**
 * FORCE SEQUELIZE PRODUCTION FIX
 * Overrides Replit's database tools to use ONLY Sequelize
 */

// CRITICAL: Override all possible Replit database imports
if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true') {
  console.log('🚨 PRODUCTION MODE: Forcing Sequelize-only database access');
  
  // Block Replit database imports
  const originalRequire = global.require;
  if (originalRequire) {
    global.require = function(id) {
      if (id.includes('@replit/database') || id.includes('replit-db') || id.includes('drizzle')) {
        console.log(`🚫 BLOCKED ${id} - using Sequelize instead`);
        throw new Error(`Replit database tools disabled in production - use Sequelize`);
      }
      return originalRequire.apply(this, arguments);
    };
  }
  
  // Block dynamic imports
  const originalImport = global.import;
  if (originalImport) {
    global.import = function(specifier) {
      if (specifier.includes('@replit/database') || specifier.includes('replit-db') || specifier.includes('drizzle')) {
        console.log(`🚫 BLOCKED import ${specifier} - using Sequelize instead`);
        return Promise.reject(new Error(`Replit database tools disabled in production - use Sequelize`));
      }
      return originalImport.apply(this, arguments);
    };
  }
}

// Force environment variables
process.env.DATABASE_ORM = 'sequelize';
process.env.DISABLE_REPLIT_DATABASE = 'true';
process.env.FORCE_SEQUELIZE_ONLY = 'true';

console.log('✅ Sequelize-only mode enforced for production');