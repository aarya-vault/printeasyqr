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
    
    // DISABLED: Don't remove new TypeScript API routes - they should take precedence
    // The new TypeScript routing system handles API routes now
    // expressApp._router.stack = expressApp._router.stack.filter(layer => {
    //   return !layer.route || !layer.route.path?.startsWith('/api');
    // });
    
    // DISABLED: Don't add old Sequelize app routes - causes conflicts with new system
    // expressApp.use(app);
    
    console.log('Sequelize server integrated successfully');
  } catch (error) {
    console.error('Failed to start Sequelize server:', error);
    throw error;
  }
}

export { app };