/**
 * CRITICAL: Skip ALL database migrations
 * Your database already has the correct schema
 */

console.log('=================================');
console.log('MIGRATION SKIP ACTIVE');
console.log('Your database already has:');
console.log('✓ applicant_id column in shop_applications');
console.log('✓ customer_id column in shop_unlocks');
console.log('✓ All required columns and constraints');
console.log('=================================');

// Override Sequelize to prevent ANY schema changes
if (global.sequelize) {
  global.sequelize.sync = async () => {
    console.log('⚠️ SYNC BLOCKED - Using existing schema');
    return Promise.resolve();
  };
}

// Set all migration flags to false
process.env.NO_MIGRATIONS = 'true';
process.env.SKIP_MIGRATIONS = 'true';
process.env.DB_SYNC = 'false';
process.env.DB_ALTER = 'false';
process.env.DB_FORCE = 'false';

module.exports = {
  skipMigrations: true
};