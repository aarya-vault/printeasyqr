import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// CRITICAL: Disable ALL database sync operations
process.env.DISABLE_DB_SYNC = 'true';

// Import sync disabler BEFORE creating Sequelize instance
import '../disable-all-sync.js';

// Use Replit's PostgreSQL environment variables
let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is not available, construct from individual variables
if (!databaseUrl) {
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'printeasy';
  const username = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  
  databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  console.log('✅ Constructed database URL from individual environment variables');
} else {
  console.log('✅ Using DATABASE_URL environment variable');
}

console.log('🔗 Database connection established via PostgreSQL');

// Create Sequelize instance with connection string from environment
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false, // Disable all SQL logging to prevent confusion
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
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

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export { sequelize, testConnection };
