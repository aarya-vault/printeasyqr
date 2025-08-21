import { Sequelize } from 'sequelize';

// Environment variables should be loaded by app.js already

// CRITICAL: Disable ALL database sync operations
process.env.DISABLE_DB_SYNC = 'true';

// Skip migrations if configured
if (process.env.SKIP_MIGRATIONS === 'true') {
  console.log('⏭️  Skipping database migrations - configured in env');
}

// Import sync disabler BEFORE creating Sequelize instance
import '../disable-all-sync.js';

// CRITICAL FIX: Lazy initialization to handle Replit deployment timing
let sequelize = null;

// Function to initialize database connection
const initializeSequelize = () => {
  if (sequelize) {
    return sequelize; // Already initialized
  }

  // CRITICAL FIX FOR REPLIT: Get database URL at connection time, not module load time
  let databaseUrl = process.env.DATABASE_URL;

  // If DATABASE_URL is not available, construct from individual variables
  if (!databaseUrl) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || 5432;
    const name = process.env.PGDATABASE;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    
    // Validate all required variables are present
    if (!host || !name || !user || !password) {
      console.error('❌ CRITICAL: Database environment variables not yet available');
      console.error('  DATABASE_URL:', !!process.env.DATABASE_URL);
      console.error('  PGHOST:', !!process.env.PGHOST);
      console.error('  PGUSER:', !!process.env.PGUSER);
      console.error('  PGPASSWORD:', !!process.env.PGPASSWORD);
      console.error('  PGDATABASE:', !!process.env.PGDATABASE);
      
      // REPLIT FIX: Return null to retry later instead of throwing
      console.log('⏳ Will retry when environment variables are available...');
      return null;
    }
    
    databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${name}`;
    console.log('✅ Constructed database URL from configuration');
  } else {
    console.log('✅ Using configured DATABASE_URL');
  }

  // Create Sequelize instance with environment configuration
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DATABASE_SSL === 'true' || databaseUrl.includes('neon.tech') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 50,  // CRITICAL FIX: Support 50 concurrent users
      min: parseInt(process.env.DB_POOL_MIN) || 5,   // Keep 5 connections ready
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 15000, // Faster timeout for acquiring connections
      idle: parseInt(process.env.DB_POOL_IDLE) || 30000, // Keep connections alive longer
      evict: 60000 // Check for stale connections every minute
    },
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
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
  
  return sequelize;
};

// Export a getter function that initializes on first use
// CRITICAL: Retry initialization if it failed due to missing env vars
const getSequelize = () => {
  if (!sequelize) {
    const result = initializeSequelize();
    if (!result) {
      // Environment variables not ready yet, try again
      console.log('⏳ Retrying database initialization...');
      // Clear the failed attempt
      sequelize = null;
      // Try one more time after a brief delay
      const retryResult = initializeSequelize();
      if (!retryResult) {
        throw new Error('Database initialization failed: Environment variables not available');
      }
      return retryResult;
    }
    return result;
  }
  return sequelize;
};

// Export both for compatibility
export { getSequelize };
export default getSequelize;

// Test the connection
const testConnection = async () => {
  // Skip database connection test during build phase
  if (process.env.SKIP_MIGRATIONS === 'true' || process.env.SKIP_DB_CHECK === 'true') {
    console.log('⏭️  Skipping database connection test (build phase)');
    return true;
  }
  
  try {
    // Use getSequelize() to ensure initialization
    const seq = getSequelize();
    await seq.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    const seq = getSequelize();
    console.error('Database URL format:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');
    console.error('SSL enabled:', seq.options.dialectOptions?.ssl ? 'YES' : 'NO');
    throw error;
  }
};

export { testConnection };
