import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Use database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;
console.log('✅ Using PostgreSQL database from environment');
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
