// PrintEasy - Netlify Serverless Function (CommonJS)
const path = require("path");
const fs = require("fs");

console.log('🚀 PrintEasy - Netlify Serverless Function');

try {
  // Load Sequelize app directly without ES module issues
  const sequelizeApp = require("../../src/app.js");
  const serverlessHttp = require("serverless-http");
  
  // Create serverless handler
  const handler = serverlessHttp(sequelizeApp, {
    binary: [
      'image/*',
      'application/pdf', 
      'application/octet-stream',
      'multipart/form-data'
    ],
    request(request, event, context) {
      // Add Netlify context to request
      request.netlifyEvent = event;
      request.netlifyContext = context;
    }
  });
  
  exports.handler = handler;
  console.log('✅ Netlify serverless handler configured');
  
} catch (error) {
  console.error('❌ Serverless function error:', error.message);
  
  // Basic fallback handler
  exports.handler = async (event, context) => {
    console.log('⚠️ Using fallback handler');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        status: 'PrintEasy API - Fallback Mode',
        timestamp: new Date().toISOString(),
        error: error.message
      })
    };
  };
}