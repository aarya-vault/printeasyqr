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
    // Production database URL for Neon PostgreSQL
    const productionDatabaseUrl = 'postgresql://neondb_owner:npg_aftGW4gE5RZY@ep-holy-feather-ae0ihzx2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
    
    // CRITICAL: Use Neon database for deployment (detect Replit deployment environment)
    const isDeployment = process.env.NODE_ENV === 'production' || 
                         process.env.REPLIT_DB_URL || 
                         process.env.PGHOST === 'ep-nameless-moon-a5vylf2m.us-east-2.aws.neon.tech';
    
    const databaseUrl = isDeployment ? productionDatabaseUrl : process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      logger.error('❌ CRITICAL: Custom DATABASE_URL missing in environment variables');
      logger.error('   This deployment requires DATABASE_URL to be set in Replit Secrets');
      logger.error('   The system is configured to bypass Replit database integration');
      throw new Error('Custom DATABASE_URL environment variable is required for deployment');
    }
    
    logger.info(`🔒 Using ${isDeployment ? 'Production Neon' : 'Development Replit'} PostgreSQL database`);
    logger.info('✅ Database configured with deployment detection');
    logger.info('🔍 Deployment detected:', isDeployment);
    logger.info('📊 Target: 138 shop owners and 128 shops');
    
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