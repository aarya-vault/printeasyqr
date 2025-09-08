import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { downloadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Print Host Route - Serve dedicated print-host.html via API route to avoid Vite
router.get('/print-host', downloadLimiter, (req, res) => {
  try {
    const printHostPath = path.join(__dirname, '..', '..', 'public', 'print-host.html');
    console.log('📄 Serving print-host.html from:', printHostPath);
    
    const htmlContent = fs.readFileSync(printHostPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(htmlContent);
  } catch (error) {
    console.error('❌ Error serving print-host.html:', error);
    res.status(404).send('Print host page not found');
  }
});

export default router;