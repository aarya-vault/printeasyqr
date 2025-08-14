// Production Database Initialization for Netlify
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Database configuration with better error handling
const initializeDatabase = async () => {
  logger.info('🔄 Initializing production database...');
  
  try {
    // Check for DATABASE_URL in multiple ways for Netlify compatibility
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.NETLIFY_DATABASE_URL ||
                       process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
                       process.env.NEON_DATABASE_URL ||
                       `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;
    
    logger.debug('Environment check', {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? 'SET' : 'NOT_SET',
      NETLIFY_DATABASE_URL_UNPOOLED: process.env.NETLIFY_DATABASE_URL_UNPOOLED ? 'SET' : 'NOT_SET',
      PGUSER: process.env.PGUSER ? 'SET' : 'NOT_SET',
      PGHOST: process.env.PGHOST ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!databaseUrl || databaseUrl.includes('undefined')) {
      logger.error('❌ DATABASE_URL environment variable is not set', null, {
        availableEnvVars: Object.keys(process.env).filter(key => 
          key.includes('PG') || 
          key.includes('DATABASE') || 
          key.includes('NETLIFY_DATABASE')
        )
      });
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
    logger.info('✅ Database connection established successfully');
    
    // IMPORTANT: Never use alter:true - it creates duplicate constraints
    // Only sync database if explicitly forced (for initial setup only)
    if (process.env.FORCE_DB_SYNC === 'true') {
      await sequelize.sync({ force: true }); // Use force instead of alter
      logger.info('✅ Database tables force synchronized (initial setup)');
    } else {
      // Just test connection, never alter schema automatically
      await sequelize.authenticate();
      logger.info('✅ Database connection verified (no schema changes)');
    }
    
    return sequelize;
    
  } catch (error) {
    logger.error('❌ Database initialization failed', error);
    return null;
  }
};

export { initializeDatabase };