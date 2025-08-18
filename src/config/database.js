import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Production database URL for Neon PostgreSQL
const productionDatabaseUrl = 'postgresql://neondb_owner:npg_aftGW4gE5RZY@ep-holy-feather-ae0ihzx2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// CRITICAL: Use Neon database for deployment (check multiple deployment indicators)
const isDeployment = process.env.NODE_ENV === 'production' || 
                     process.env.REPLIT_DB_URL || 
                     !process.env.DATABASE_URL ||
                     process.env.PGHOST === 'ep-nameless-moon-a5vylf2m.us-east-2.aws.neon.tech';

const databaseUrl = isDeployment ? productionDatabaseUrl : process.env.DATABASE_URL;

console.log(`✅ Using ${isDeployment ? 'Production Neon' : 'Development Replit'} PostgreSQL database`);
console.log('🔗 Database connection configured for deployment');
console.log('🔍 Deployment indicators:', {
  NODE_ENV: process.env.NODE_ENV,
  hasREPLIT_DB_URL: !!process.env.REPLIT_DB_URL,
  hasDATABASE_URL: !!process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST,
  usingNeonDB: isDeployment
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
