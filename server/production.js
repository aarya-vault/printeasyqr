import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Node.js compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🚀 PrintEasy - Production Server Starting...');

// Load the Sequelize app
const sequelizeApp = require("../src/app.js").default;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', 'dist', 'public');
  sequelizeApp.use(express.static(staticPath));
  
  // Catch-all handler for SPA routes
  sequelizeApp.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

sequelizeApp.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PrintEasy server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Access: http://localhost:${PORT}`);
});

export default sequelizeApp;