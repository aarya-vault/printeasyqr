import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Get database URL with fallback support for Netlify
const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || 
         process.env.NETLIFY_DATABASE_URL ||
         process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
         `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
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
