import { createServer } from "http";
import { createRequire } from "module";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Node.js compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🚀 PrintEasy - CLEAN DEVELOPMENT SERVER');
console.log('✅ Zero Drizzle dependencies');
console.log('✅ Pure Sequelize system');

// Load the Sequelize app
const sequelizeApp = require("../src/app.js").default;

// Development static serving (bypasses problematic Vite setup)
if (process.env.NODE_ENV === 'development') {
  const clientPath = path.join(__dirname, '..', 'client');
  sequelizeApp.use(express.static(clientPath));
  
  // SPA routing for React
  sequelizeApp.get('*', (req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Create HTTP server
const server = createServer(sequelizeApp);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PrintEasy running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/*`);
  console.log(`📊 System: 100% Sequelize ORM`);
});

export default server;