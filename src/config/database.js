import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// FORCE: Use only DATABASE_URL environment variable, ignore Replit database integration
const databaseUrl = process.env.DATABASE_URL;
console.log('🔒 BYPASSING Replit database integration - using custom DATABASE_URL');
console.log('✅ Using PostgreSQL database from environment variables');

// Explicitly ignore any Replit database URLs to prevent conflicts
if (!databaseUrl || databaseUrl.includes('undefined')) {
  console.error('❌ CRITICAL: Custom DATABASE_URL not found in environment variables');
  console.error('   Deployment requires DATABASE_URL to be set in Replit Secrets');
  throw new Error('Custom DATABASE_URL environment variable is required for deployment');
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
