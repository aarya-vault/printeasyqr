import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// CRITICAL: Disable ALL database sync operations
process.env.DISABLE_DB_SYNC = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Skip migrations if explicitly requested
if (process.env.SKIP_MIGRATIONS === 'true') {
  console.log('⏭️  Skipping database migrations - SKIP_MIGRATIONS is set');
}

// Import sync disabler BEFORE creating Sequelize instance
import '../disable-all-sync.js';

// Use Replit's PostgreSQL environment variables
let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is not available, construct from individual variables
if (!databaseUrl) {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const database = process.env.PGDATABASE;
  const username = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  
  // Validate all required environment variables are present
  if (!host || !port || !database || !username || !password) {
    const missing = [];
    if (!host) missing.push('PGHOST');
    if (!port) missing.push('PGPORT');
    if (!database) missing.push('PGDATABASE');
    if (!username) missing.push('PGUSER');
    if (!password) missing.push('PGPASSWORD');
    
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }
  
  databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  console.log('✅ Constructed database URL from individual environment variables');
} else {
  console.log('✅ Using DATABASE_URL environment variable');
}

// Create Sequelize instance with connection string from environment
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false, // Disable all SQL logging to prevent confusion
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' || databaseUrl.includes('neon.tech') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // CRITICAL: Prevent all automatic schema modifications
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  sync: {
    force: false,
    alter: false
  }
});

console.log('🔗 Database connection established via PostgreSQL');
console.log(`📊 Database: ${databaseUrl.includes('neon.tech') ? 'Neon PostgreSQL' : 'Local PostgreSQL'}`);
console.log(`🔒 SSL Mode: ${sequelize.options.dialectOptions?.ssl ? 'Enabled' : 'Disabled'}`);

// Test the connection
const testConnection = async () => {
  // Skip database connection test during build phase
  if (process.env.SKIP_MIGRATIONS === 'true' || process.env.SKIP_DB_CHECK === 'true') {
    console.log('⏭️  Skipping database connection test (build phase)');
    return true;
  }
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('Database URL format:', databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'NOT SET');
    console.error('SSL enabled:', sequelize.options.dialectOptions?.ssl ? 'YES' : 'NO');
    throw error;
  }
};

export { sequelize, testConnection };
