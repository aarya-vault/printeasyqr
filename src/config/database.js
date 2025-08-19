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

// Get database URL directly from environment
let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is not available, construct from individual variables
if (!databaseUrl) {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || 5432;
  const name = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  
  // Validate all required variables are present
  if (!host || !port || !name || !user || !password) {
    const missing = [];
    if (!host) missing.push('host');
    if (!port) missing.push('port');
    if (!name) missing.push('database name');
    if (!user) missing.push('username');
    if (!password) missing.push('password');
    
    throw new Error(`Missing required database configuration: ${missing.join(', ')}`);
  }
  
  databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${name}`;
  console.log('✅ Constructed database URL from configuration');
} else {
  console.log('✅ Using configured DATABASE_URL');
}

// Create Sequelize instance with environment configuration
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
  dialectOptions: {
    ssl: process.env.DATABASE_SSL === 'true' || databaseUrl.includes('neon.tech') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
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
