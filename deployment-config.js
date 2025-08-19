/**
 * DEPLOYMENT CONFIGURATION
 * Uses YOUR PostgreSQL database ONLY
 * NO Drizzle, NO Replit database integrations
 * ONLY Sequelize ORM
 */

// Set YOUR database credentials
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_omd9cTiyv1zH@ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
process.env.PGDATABASE = 'neondb';
process.env.PGHOST = 'ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech';
process.env.PGPORT = '5432';
process.env.PGUSER = 'neondb_owner';
process.env.PGPASSWORD = 'npg_omd9cTiyv1zH';

// Force Sequelize-only mode
process.env.USE_SEQUELIZE_ONLY = 'true';
process.env.DISABLE_DRIZZLE = 'true';
process.env.NO_REPLIT_DATABASE = 'true';

console.log('✅ DEPLOYMENT CONFIGURED:');
console.log('✅ Database: YOUR PostgreSQL on Neon');
console.log('✅ ORM: Sequelize ONLY');
console.log('✅ NO Drizzle ORM');
console.log('✅ NO Replit database integrations');

module.exports = {
  database: {
    url: process.env.DATABASE_URL,
    orm: 'sequelize',
    sync: false,
    logging: false
  },
  production: {
    forceHttps: true,
    trustProxy: true
  }
};