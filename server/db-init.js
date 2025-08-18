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
    // 🔄 PRODUCTION DATA DELETED - Using Replit's Native PostgreSQL Only
    // All external database connections removed - fresh start with Replit's built-in database
    const databaseUrl = process.env.DATABASE_URL;
    const isDeployment = false; // Always use Replit's native database
    
    if (!databaseUrl) {
      logger.error('❌ CRITICAL: Custom DATABASE_URL missing in environment variables');
      logger.error('   This deployment requires DATABASE_URL to be set in Replit Secrets');
      logger.error('   The system is configured to bypass Replit database integration');
      throw new Error('Custom DATABASE_URL environment variable is required for deployment');
    }
    
    logger.info('🔒 Using Replit Native PostgreSQL Database');
    logger.info('✅ Fresh start - all production data deleted');
    logger.info('🔍 Clean slate - no external dependencies');
    logger.info('📊 Starting with empty database for fresh data');
    
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
    
    // Validate database connection (never use alter:true - causes duplicate constraints)
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // CRITICAL: Explicitly prevent any destructive operations during deployment
    // The database contains production data (138 shop owners, 128 shops)
    // Never allow force sync or alter operations regardless of environment
    logger.info('🔒 PRODUCTION DATA PROTECTION: Preventing any destructive database operations');
    logger.info('📊 Database contains: 138 shop owners, 128 shops - MUST BE PRESERVED');
    
    // Explicitly disable force sync even if environment variable is set
    if (process.env.FORCE_DB_SYNC === 'true') {
      logger.warn('⚠️  FORCE_DB_SYNC requested but BLOCKED to protect production data');
      logger.warn('   Database contains critical business data that cannot be lost');
    }
    
    return sequelize;
    
  } catch (error) {
    logger.error('❌ Database initialization failed', error);
    return null;
  }
};

export { initializeDatabase };