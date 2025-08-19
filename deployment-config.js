/**
 * DEPLOYMENT CONFIGURATION FOR REPLIT
 * This file MUST be loaded FIRST to prevent ALL database migrations
 */

// Override all environment variables that trigger migrations
process.env.DB_SYNC = 'false';
process.env.DB_ALTER = 'false';
process.env.DB_FORCE = 'false';
process.env.DB_MIGRATE = 'false';
process.env.SEQUELIZE_SYNC = 'false';
process.env.SEQUELIZE_ALTER = 'false';
process.env.SEQUELIZE_FORCE = 'false';
process.env.SEQUELIZE_MIGRATE = 'false';
process.env.RUN_MIGRATIONS = 'false';
process.env.AUTO_MIGRATE = 'false';
process.env.DATABASE_SYNC = 'false';
process.env.DATABASE_ALTER = 'false';
process.env.DATABASE_FORCE = 'false';
process.env.DATABASE_MIGRATE = 'false';

// Force production mode
process.env.NODE_ENV = 'production';

// Disable Replit database tools
delete process.env.REPLIT_DB_URL;
delete process.env.REPLIT_DATABASE_URL;

console.log('🚫 DEPLOYMENT CONFIG: ALL MIGRATIONS DISABLED');
console.log('✅ DEPLOYMENT CONFIG: USING EXISTING DATABASE SCHEMA');

module.exports = {
  database: {
    sync: false,
    alter: false,
    force: false,
    migrate: false,
    migrations: false,
    logging: false
  }
};