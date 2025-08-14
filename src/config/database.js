import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// DEVELOPMENT DATABASE ONLY: Use ONLY Replit's development DATABASE_URL
// Production database deleted - single development database for all environments
const getDatabaseUrl = () => {
  // ONLY use Replit's development DATABASE_URL - no external production databases
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DEVELOPMENT database only:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'database');
    console.log('🚫 Production database DELETED - development database serves all environments');
    return process.env.DATABASE_URL;
  }
  
  throw new Error('Development DATABASE_URL required - production database has been deleted');
};

const databaseUrl = getDatabaseUrl();
if (!databaseUrl || databaseUrl.includes('undefined')) {
  throw new Error('Database URL not found in environment variables');
}

// Create Sequelize instance with connection string from environment
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
