// PrintEasy QR - Unified Production Server
// Pure CommonJS - No Module Conflicts
const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🚀 PrintEasy - UNIFIED PRODUCTION SERVER');
console.log('✅ Pure CommonJS architecture');
console.log('✅ Zero module conflicts');

// Create Express app
const app = express();

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS setup
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.host;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    architecture: 'unified-commonjs'
  });
});

// QR Generation endpoint
app.post('/api/generate-qr', (req, res) => {
  const { shopSlug, shopName } = req.body;
  
  if (!shopSlug || !shopName) {
    return res.status(400).json({ 
      error: 'Missing required fields: shopSlug and shopName' 
    });
  }
  
  // Simulate QR generation (replace with actual QR library if needed)
  const qrData = Buffer.from(`PrintEasy-${shopSlug}-${Date.now()}`).toString('base64');
  
  res.json({
    success: true,
    image: `/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwABAAEFAQAAAAAAAAAAAAAAAAIDBgcIAf/EAC0QAAIBAwIFAgYCAwAAAAAAAAECAwAEEQUGEgcTITFBUWEUIlJykdGBoSMyov/EABcBAQADAAAAAAAAAAAAAAAAAAABAgP/xAAcEQACAwEBAQEAAAAAAAAAAAABAgADESESMUH/2gAMAwEAAhEDEQA/AOq0pSlApSlApSlApSlApSlApSlB//Z`
  });
});

// Authentication endpoints
app.post('/api/auth/customer/login', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }
  
  // Simulate successful login
  res.json({
    success: true,
    token: 'mock-jwt-token-customer',
    user: {
      id: 1,
      phone: phone,
      name: 'Test Customer',
      role: 'customer'
    }
  });
});

app.post('/api/auth/shop-owner/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Simulate successful login
  res.json({
    success: true,
    token: 'mock-jwt-token-shop-owner',
    user: {
      id: 2,
      email: email,
      name: 'Test Shop Owner',
      role: 'shop_owner'
    }
  });
});

// Shop management endpoints
app.get('/api/shops', (req, res) => {
  res.json({
    success: true,
    shops: [
      {
        id: 1,
        name: 'Gujarat Xerox & Stationery',
        slug: 'gujarat-xerox',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380001',
        isOnline: true,
        services: ['Color Printing', 'B&W Printing', 'Photocopying'],
        workingHours: {
          monday: { open: '09:00', close: '21:00', closed: false }
        }
      }
    ]
  });
});

// Order management endpoints  
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: []
  });
});

app.post('/api/orders', (req, res) => {
  const { shopId, type, title, description } = req.body;
  
  res.json({
    success: true,
    order: {
      id: Date.now(),
      shopId,
      type,
      title,
      description,
      status: 'new',
      createdAt: new Date().toISOString()
    }
  });
});

// Static file serving for production
const clientPath = path.join(__dirname, '..', 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
  
  // SPA routing fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('PrintEasy QR - Client not found');
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

module.exports = app;