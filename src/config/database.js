import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// 🔧 PRODUCTION FIX - Using working development database with fallback
let databaseUrl = process.env.DATABASE_URL;

// Fallback: Construct DATABASE_URL from individual components if not available
if (!databaseUrl && process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
  databaseUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`;
  console.log('🔧 Constructed DATABASE_URL from individual components');
}

const isDeployment = true; // Always enable SSL for Neon database

console.log('✅ Using Development Database for Production');
console.log('🔗 Database Connection String:', databaseUrl ? 'Available' : 'MISSING');
console.log('🔍 Database Environment:', {
  DATABASE_URL: !!databaseUrl ? 'Available' : 'MISSING',
  SSL_Required: isDeployment,
  Host: process.env.PGHOST || 'MISSING',
  PGUSER: process.env.PGUSER || 'MISSING',
  PGPASSWORD: !!process.env.PGPASSWORD ? 'Available' : 'MISSING'
});

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found and cannot be constructed from environment variables');
  console.error('Required: DATABASE_URL or (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)');
  throw new Error('Database connection configuration is missing');
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
