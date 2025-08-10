import serverless from 'serverless-http';
import path from 'path';
import { initializeDatabase } from '../../server/db-init.js';

let app;

async function createApp() {
  try {
    // Initialize database first
    const db = await initializeDatabase();
    if (!db) {
      throw new Error('Database initialization failed');
    }
    
    // Load the Express app
    const appModule = await import('../../src/app.js');
    app = appModule.default || appModule;
    console.log('✅ Express app loaded successfully');
    
    // Add database instance to app
    app.locals.db = db;
    
  } catch (error) {
    console.error('❌ Failed to create app:', error);
    
    // Create fallback Express app
    const express = (await import('express')).default;
    const cors = (await import('cors')).default;
    
    app = express();
    app.use(cors({
      origin: true,
      credentials: true
    }));
    app.use(express.json());
    
    // Environment info endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'error', 
        message: 'Backend application failed to load',
        error: error.message,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
          JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
        },
        timestamp: new Date().toISOString() 
      });
    });
    
    // All other API requests
    app.use('/api/*', (req, res) => {
      console.error('API Request to failed endpoint:', req.method, req.url);
      res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Unable to load backend application - check environment variables',
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  return app;
}

// Initialize app
let appPromise = createApp();

// Export serverless handler with async support
export const handler = async (event, context) => {
  // Ensure app is initialized
  const app = await appPromise;
  
  // Create serverless handler
  const serverlessHandler = serverless(app, {
    binary: ['image/*', 'application/pdf', 'application/octet-stream']
  });
  
  return serverlessHandler(event, context);
};