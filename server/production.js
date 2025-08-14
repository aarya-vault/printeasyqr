// Production server for deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the Sequelize app
const sequelizeApp = await import('../src/app.js');
const app = sequelizeApp.default;

// Serve static files from dist/client
const clientPath = path.join(__dirname, '..', 'dist', 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PrintEasy QR production server running on port ${PORT}`);
});