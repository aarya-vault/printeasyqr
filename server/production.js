import { createServer } from "http";
import { createRequire } from "module";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Node.js compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ES modules only - no CommonJS require needed

console.log('🚀 PrintEasy QR - Production Server');

// Load the Sequelize app
const sequelizeApp = require("../src/app.js").default || require("../src/app.js");

// Production static serving
const distPath = path.join(__dirname, '..', 'dist', 'client');
sequelizeApp.use(express.static(distPath));

// SEO Routes - Add before SPA routing
sequelizeApp.get('/sitemap.xml', (req, res) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://printeasyqr.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://printeasyqr.com/browse-shops</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://printeasyqr.com/shop-login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://printeasyqr.com/admin-login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
  
  res.set('Content-Type', 'text/xml');
  res.send(sitemap);
});

sequelizeApp.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Allow: /browse-shops
Disallow: /admin*
Disallow: /api*

Sitemap: https://printeasyqr.com/sitemap.xml`;
  
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

// SPA routing for React
sequelizeApp.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// For serverless/netlify functions - export the app
export default sequelizeApp;

// For standalone server (development/docker)
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
  const server = createServer(sequelizeApp);
        const PORT = parseInt(process.env.PORT || '3001', 10);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ PrintEasy QR running on port ${PORT}`);
    console.log(`🌐 Production: http://localhost:${PORT}`);
  });
}