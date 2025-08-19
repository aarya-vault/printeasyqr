/**
 * FORCE YOUR POSTGRESQL DATABASE - NO MIGRATIONS
 * This file ensures ONLY your PostgreSQL database is used
 * NO Drizzle, NO Replit database tools, NO migrations
 */

// Force YOUR database credentials
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_omd9cTiyv1zH@ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';
process.env.PGDATABASE = 'neondb';
process.env.PGHOST = 'ep-jolly-queen-af03ajf7.c-2.us-west-2.aws.neon.tech';
process.env.PGPORT = '5432';
process.env.PGUSER = 'neondb_owner';
process.env.PGPASSWORD = 'npg_omd9cTiyv1zH';

// Remove ALL Replit database variables
delete process.env.REPLIT_DB_URL;
delete process.env.REPLIT_DATABASE_URL;
delete process.env.REPLIT_KV_URL;

// Force Sequelize-only mode
process.env.USE_SEQUELIZE = 'true';
process.env.NO_MIGRATIONS = 'true';
process.env.NO_SYNC = 'true';

console.log('✅ FORCED: Your PostgreSQL database ONLY');
console.log('✅ ORM: Sequelize ONLY');
console.log('✅ Migrations: DISABLED');
console.log('✅ Sync: DISABLED');

module.exports = true;