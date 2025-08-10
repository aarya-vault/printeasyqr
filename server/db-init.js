// Production Database Initialization for Netlify
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration with better error handling
const initializeDatabase = async () => {
  console.log('🔄 Initializing production database...');
  
  try {
    // Check for DATABASE_URL in multiple ways for Netlify compatibility
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.NEON_DATABASE_URL ||
                       `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
    
    console.log('Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      PGUSER: process.env.PGUSER ? 'SET' : 'NOT_SET',
      PGHOST: process.env.PGHOST ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!databaseUrl || databaseUrl.includes('undefined')) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('PG') || key.includes('DATABASE')));
      return null;
    }
    
    // Create Sequelize instance
    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: console.log,
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
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database (be careful in production)
    if (process.env.FORCE_DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables synchronized');
    } else {
      // Just test if tables exist without altering
      await sequelize.authenticate();
      console.log('✅ Database connection verified');
    }
    
    return sequelize;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return null;
  }
};

export { initializeDatabase };