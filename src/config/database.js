import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// UNIFIED DATABASE: Both development and production use same database
const getDatabaseUrl = () => {
  // CRITICAL FIX: Force correct database URL to override cached credentials
  const CORRECT_DATABASE_URL = 'postgresql://neondb_owner:npg_Di0XSQx1ONHM@ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
  
  let databaseUrl = process.env.DATABASE_URL;
  
  // Override if using old database or missing
  if (!databaseUrl || databaseUrl.includes('ep-still-sound') || !databaseUrl.includes('npg_Di0XSQx1ONHM')) {
    console.log('⚠️ Overriding cached/old database credentials...');
    process.env.DATABASE_URL = CORRECT_DATABASE_URL;
    process.env.PGHOST = 'ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech';
    process.env.PGUSER = 'neondb_owner';
    process.env.PGPASSWORD = 'npg_Di0XSQx1ONHM';
    process.env.PGDATABASE = 'neondb';
    databaseUrl = CORRECT_DATABASE_URL;
  }
  
  console.log('✅ Using unified database with 131 authentic shops');
  
  return databaseUrl;
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
