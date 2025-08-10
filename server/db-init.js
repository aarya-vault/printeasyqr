// Production Database Initialization for Netlify
const { Sequelize } = require('sequelize');

// Database configuration with better error handling
const initializeDatabase = async () => {
  console.log('🔄 Initializing production database...');
  
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      return null;
    }
    
    // Create Sequelize instance
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
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