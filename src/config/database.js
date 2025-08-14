import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// DEVELOPMENT DATABASE ONLY: Production database manually deleted by user
// System now STRICTLY uses development database for ALL environments
const getDatabaseUrl = () => {
  const devDatabaseUrl = process.env.DATABASE_URL;
  
  if (!devDatabaseUrl) {
    throw new Error('CRITICAL: Development DATABASE_URL required - production database manually deleted');
  }
  
  console.log('🔒 STRICT DEVELOPMENT MODE: Production database manually deleted');
  console.log('✅ Using development database for ALL environments');
  
  return devDatabaseUrl;
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
