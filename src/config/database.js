import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// UNIFIED DATABASE: Use only Replit's managed DATABASE_URL 
// Single database for all environments - no development/production split
const getDatabaseUrl = () => {
  // Use Replit's managed DATABASE_URL (whether it's Neon, PostgreSQL, or other provider)
  if (process.env.DATABASE_URL) {
    console.log('✅ Using unified Replit managed database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'database');
    return process.env.DATABASE_URL;
  }
  
  // Fallback only for testing environments
  if (process.env.NETLIFY_DATABASE_URL) {
    console.log('⚠️ Using Netlify testing database');
    return process.env.NETLIFY_DATABASE_URL;
  }
  
  throw new Error('No DATABASE_URL found - Replit database configuration required');
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
