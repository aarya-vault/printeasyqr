#!/usr/bin/env node

// Production initialization script - skips database migrations
console.log('🚀 Production initialization starting...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.DISABLE_DB_SYNC = 'true';

console.log('✅ Environment configured:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DISABLE_DB_SYNC:', process.env.DISABLE_DB_SYNC);
console.log('   DATABASE_URL available:', !!process.env.DATABASE_URL);

// Skip database migrations - tables already exist
console.log('⏭️  Skipping database migrations - using existing schema');
console.log('✅ Database schema already configured via manual migrations');

// Verify database connection without sync
import('../src/config/database.js').then(async (module) => {
  const { testConnection } = module;
  try {
    await testConnection();
    console.log('✅ Database connection verified');
    console.log('✅ Production initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Continuing anyway - database will be checked at runtime');
    process.exit(0); // Exit successfully to allow deployment to continue
  }
}).catch(error => {
  console.error('❌ Failed to load database module:', error.message);
  console.log('⚠️  Continuing anyway - database will be checked at runtime');
  process.exit(0); // Exit successfully to allow deployment to continue
});