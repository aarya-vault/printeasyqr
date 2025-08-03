const http = require('http');
const app = require('./app');
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models');

// Import seed data
const seedDatabase = require('./seed-data');

// Create HTTP server
const server = http.createServer(app);

// DISABLED: WebSocket setup now handled by new TypeScript system
// app.setupWebSocket(server);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase(false);
    
    // Seed initial data
    await seedDatabase();
    
    // DISABLED: Static file serving now handled by new TypeScript system
    // This was causing conflicts with the new routing system
    // Production serving is now handled in server/index.ts with Vite integration
    console.log('⚠️  Static file serving disabled - handled by new system');
    
    // DISABLED: Server startup now handled by new TypeScript system
    // This was creating multiple server instances and port conflicts
    console.log('⚠️  Server startup disabled - handled by server/index.ts');
    
    // Return for integration purposes but don't start server
    return;

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown function
async function shutdown() {
  console.log('Shutting down gracefully...');
  
  try {
    // Close server
    server.close(() => {
      console.log('HTTP server closed.');
    });
    
    // Close database connection
    await sequelize.close();
    console.log('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the server
startServer();