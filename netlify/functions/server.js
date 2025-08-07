// PrintEasy QR - Netlify Serverless Function
const serverlessHttp = require("serverless-http");

// Main Express application
const express = require('express');
const app = express();

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS setup for Netlify
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'netlify-production',
    version: '1.0.0'
  });
});

// QR Generation
app.post('/api/generate-qr', (req, res) => {
  const { shopSlug, shopName } = req.body;
  
  if (!shopSlug || !shopName) {
    return res.status(400).json({ 
      error: 'Missing required fields: shopSlug and shopName' 
    });
  }
  
  const qrData = Buffer.from(`PrintEasy-${shopSlug}-${Date.now()}`).toString('base64');
  
  res.json({
    success: true,
    image: `/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwABAAEFAQAAAAAAAAAAAAAAAAIDBgcIAf/EAC0QAAIBAwIFAgYCAwAAAAAAAAECAwAEEQUGEgcTITFBUWEUIlNykdGBoSMyov/EABcBAQADAAAAAAAAAAAAAAAAAAABAgP/xAAcEQACAwEBAQEAAAAAAAAAAAABAgADESESMUH/2gAMAwEAAhEDEQA/AOq0pSlApSlApSlApSlApSlApSlB//Z`
  });
});

// Authentication endpoints
app.post('/api/auth/customer/login', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }
  
  res.json({
    success: true,
    token: 'netlify-jwt-token-customer',
    user: {
      id: 1,
      phone: phone,
      name: 'Customer',
      role: 'customer'
    }
  });
});

app.post('/api/auth/shop-owner/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  res.json({
    success: true,
    token: 'netlify-jwt-token-shop-owner',
    user: {
      id: 2,
      email: email,
      name: 'Shop Owner',
      role: 'shop_owner'
    }
  });
});

// Shop and order endpoints
app.get('/api/shops', (req, res) => {
  res.json({
    success: true,
    shops: [
      {
        id: 1,
        name: 'PrintEasy Demo Shop',
        slug: 'demo-shop',
        city: 'Demo City',
        state: 'Demo State',
        pinCode: '000000',
        isOnline: true,
        services: ['Color Printing', 'B&W Printing'],
        workingHours: {
          monday: { open: '09:00', close: '21:00', closed: false }
        }
      }
    ]
  });
});

app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders: [] });
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Netlify function error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export serverless handler
exports.handler = serverlessHttp(app, {
  binary: [
    'image/*',
    'application/pdf',
    'application/octet-stream',
    'multipart/form-data'
  ]
});