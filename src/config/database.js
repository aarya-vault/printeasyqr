import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Production database URL for Neon PostgreSQL
const productionDatabaseUrl = 'postgresql://neondb_owner:npg_aftGW4gE5RZY@ep-holy-feather-ae0ihzx2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Use production database URL for deployment, fallback to development DATABASE_URL
const databaseUrl = process.env.NODE_ENV === 'production' 
  ? productionDatabaseUrl 
  : process.env.DATABASE_URL;

console.log(`✅ Using ${process.env.NODE_ENV === 'production' ? 'Production Neon' : 'Development Replit'} PostgreSQL database`);
console.log('🔗 Database connection configured for deployment');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  throw new Error('DATABASE_URL environment variable is required');
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
