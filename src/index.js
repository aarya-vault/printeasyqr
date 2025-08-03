const http = require('http');
const app = require('./app');
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models');

// Import seed data
const seedDatabase = require('./seed-data');

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
app.setupWebSocket(server);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase(false);
    
    // Seed initial data
    await seedDatabase();
    
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      const express = require('express');
      const path = require('path');
      app.use(express.static(path.join(__dirname, '..', 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
      });
    }
    
    // Start listening
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: '0.0.0.0',
      reusePort: true,
    }, () => {
      console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });

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