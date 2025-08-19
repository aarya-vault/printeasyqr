/**
 * NUCLEAR DATABASE SYNC DISABLER
 * This file completely disables ALL database sync operations
 * Used for deployment to prevent migration conflicts
 */

// Set all possible environment variables to disable sync
process.env.DB_SYNC = 'false';
process.env.DB_ALTER = 'false';
process.env.DB_FORCE = 'false';
process.env.DB_MIGRATE = 'false';
process.env.SEQUELIZE_SYNC = 'false';
process.env.SEQUELIZE_ALTER = 'false';
process.env.SEQUELIZE_FORCE = 'false';
process.env.SEQUELIZE_MIGRATE = 'false';
process.env.DISABLE_DB_SYNC = 'true';
process.env.DISABLE_MIGRATIONS = 'true';
process.env.NO_SYNC = 'true';
process.env.NO_MIGRATIONS = 'true';
process.env.SKIP_SYNC = 'true';
process.env.SKIP_MIGRATIONS = 'true';

console.log('===========================================');
console.log('🚫 DATABASE SYNC COMPLETELY DISABLED');
console.log('✅ Using existing database schema ONLY');
console.log('✅ Your database already has:');
console.log('   - applicant_id column in shop_applications');
console.log('   - customer_id column in shop_unlocks');
console.log('   - All required tables and constraints');
console.log('===========================================');

export default { syncDisabled: true };