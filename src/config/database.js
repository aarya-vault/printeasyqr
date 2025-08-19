import { Sequelize } from 'sequelize';
import config from './env.js';

// CRITICAL: Disable ALL database sync operations
process.env.DISABLE_DB_SYNC = 'true';

// Skip migrations if configured
if (config.database.skipMigrations) {
  console.log('⏭️  Skipping database migrations - configured in env');
}

// Import sync disabler BEFORE creating Sequelize instance
import '../disable-all-sync.js';

// Get database URL from centralized config
let databaseUrl = config.database.url;

// If DATABASE_URL is not available, construct from individual variables
if (!databaseUrl) {
  const { host, port, name, user, password } = config.database;
  
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

// Create Sequelize instance with centralized configuration
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: config.database.logging ? console.log : false,
  dialectOptions: {
    ssl: config.database.ssl || databaseUrl.includes('neon.tech') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: config.database.pool,
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
  if (config.database.skipMigrations || config.database.skipDbCheck) {
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
