import { createRequire } from 'module';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Node.js compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🚀 PrintEasy - Simple Development Server');

// Load the working Sequelize app
const sequelizeApp = require("../src/app.js").default;

// Serve client files statically for development
const clientPath = path.join(__dirname, '..', 'client');
sequelizeApp.use(express.static(clientPath));

// Handle SPA routing - serve index.html for non-API routes
sequelizeApp.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

sequelizeApp.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PrintEasy running on http://localhost:${PORT}`);
  console.log(`📍 API endpoints: http://localhost:${PORT}/api/`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📋 Database: Connected via Sequelize`);
});