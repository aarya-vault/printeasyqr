// This file bridges the new Sequelize structure with the existing setup
import app from './app.js';
import { testConnection } from './config/database.js';
import { syncDatabase } from './models/index.js';
import seedDatabase from './seed-data.js';

// Export the main function that will be called from the existing index.ts
export async function startSequelizeServer(expressApp) {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase(false);
    
    // Seed initial data
    await seedDatabase();
    
    // Copy all routes from our Sequelize app to the main app
    expressApp._router.stack = expressApp._router.stack.filter(layer => {
      return !layer.route || !layer.route.path?.startsWith('/api');
    });
    
    // Add all routes from Sequelize app
    expressApp.use(app);
    
    console.log('Sequelize server integrated successfully');
  } catch (error) {
    console.error('Failed to start Sequelize server:', error);
    throw error;
  }
}

export { app };