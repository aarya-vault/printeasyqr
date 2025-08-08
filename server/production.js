import { createServer } from "http";
import { createRequire } from "module";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
// Node.js compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
console.log('🚀 PrintEasy QR - Production Server');
// Load the Sequelize app
const sequelizeApp = require("../src/app.js").default;
// Production static serving
const distPath = path.join(__dirname, '..', 'dist', 'client');
sequelizeApp.use(express.static(distPath));
// SPA routing for React
sequelizeApp.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});
// Create HTTP server
const server = createServer(sequelizeApp);
const PORT = parseInt(process.env.PORT || '5000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PrintEasy QR running on port ${PORT}`);
  console.log(`🌐 Production: http://localhost:${PORT}`);
});