const serverless = require('serverless-http');
const { createRequire } = require('module');
const path = require('path');

// Load the Express app
const appPath = path.resolve(__dirname, '../../src/app.js');
let app;

try {
  // Try to load the app using CommonJS require
  app = require(appPath).default || require(appPath);
} catch (error) {
  console.error('Failed to load Express app:', error);
  
  // Create a minimal error handler
  const express = require('express');
  app = express();
  app.use('*', (req, res) => {
    res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Unable to load backend application',
      timestamp: new Date().toISOString()
    });
  });
}

// Export serverless handler
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});