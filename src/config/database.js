import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// 🔄 PRODUCTION DATA DELETED - Using Replit's Native PostgreSQL Only
// All external database connections removed - fresh start with Replit's built-in database
const databaseUrl = process.env.DATABASE_URL;
const isDeployment = false; // Always use Replit's native database

console.log('✅ Using Replit Native PostgreSQL Database');
console.log('🔗 Fresh start - all external data connections removed');
console.log('🔍 Database Environment:', {
  DATABASE_URL: !!process.env.DATABASE_URL ? 'Connected to Replit PostgreSQL' : 'Not configured',
  freshStart: true
});

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Sequelize instance with connection string from environment
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: isDeployment ? {
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
