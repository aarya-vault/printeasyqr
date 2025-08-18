import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// CRITICAL: Disable ALL database sync operations
process.env.DISABLE_DB_SYNC = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

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
    } : false,
    // CRITICAL: Increase timeouts for Replit environment
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 120000,    // 2 minutes
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 120000,    // 2 minutes
    timeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 120000            // 2 minutes
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,           // INCREASE from 5 for production load
    min: parseInt(process.env.DB_POOL_MIN) || 5,            // INCREASE from 0 - maintain persistent connections
    acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 120000,   // INCREASE from 30000 - 2 minutes
    idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000        // INCREASE from 10000 - 1 minute
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
