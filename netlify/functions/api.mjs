import serverless from 'serverless-http';
import path from 'path';
import { initializeDatabase } from '../../server/db-init.js';

let app;

async function createApp() {
  try {
    console.log('🔄 Starting Netlify function initialization...');
    
    // Initialize database first
    const db = await initializeDatabase();
    if (!db) {
      throw new Error('Database initialization failed');
    }
    console.log('✅ Database initialized successfully for Netlify');
    
    // Load the Express app with detailed logging
    console.log('🔄 Loading Express app from src/app.js...');
    const appModule = await import('../../src/app.js');
    console.log('✅ App module imported, checking exports...');
    
    app = appModule.default || appModule;
    
    if (!app || typeof app !== 'function') {
      console.error('❌ Invalid app export:', typeof app, Object.keys(appModule));
      throw new Error(`Failed to load Express app - got ${typeof app} instead of function`);
    }
    
    console.log('✅ Express app loaded successfully');
    
    // Add database instance to app
    app.locals.db = db;
    
    // Test that basic routes are available
    console.log('✅ App configuration complete - routes should be available');
    
    return app;
    
  } catch (error) {
    console.error('❌ Failed to create app:', error);
    console.error('❌ Error details:', error.stack);
    
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
        stack: error.stack,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
          NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? 'SET' : 'NOT_SET',
          NETLIFY_DATABASE_URL_UNPOOLED: process.env.NETLIFY_DATABASE_URL_UNPOOLED ? 'SET' : 'NOT_SET',
          JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
        },
        timestamp: new Date().toISOString() 
      });
    });
    
    // All other routes - return detailed error
    app.use('*', (req, res) => {
      console.error('API Request to failed backend:', req.method, req.url);
      res.status(500).json({ 
        error: 'Backend application failed to load',
        message: 'The main Express application could not be initialized',
        originalError: error.message,
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  return app;
}

// Initialize app with better error handling
let appPromise;

// Export serverless handler with async support
export const handler = async (event, context) => {
  try {
    // Initialize app on first request if not already done
    if (!appPromise) {
      appPromise = createApp();
    }
    
    // Ensure app is initialized
    const app = await appPromise;
    
    if (!app) {
      throw new Error('App initialization returned null');
    }
    
    console.log(`🚀 Netlify function handling: ${event.httpMethod} ${event.path}`);
    
    // Create serverless handler
    const serverlessHandler = serverless(app, {
      binary: ['image/*', 'application/pdf', 'application/octet-stream']
    });
    
    return serverlessHandler(event, context);
    
  } catch (error) {
    console.error('❌ Netlify function handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Function initialization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};