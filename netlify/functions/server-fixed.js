const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'netlify-production'
  });
});

app.post('/api/generate-qr', (req, res) => {
  const { shopSlug, shopName } = req.body;
  
  if (!shopSlug || !shopName) {
    return res.status(400).json({ 
      error: 'Missing required fields: shopSlug and shopName' 
    });
  }
  
  res.json({
    success: true,
    image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7doxAQAAAMKg9U9tDQ+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeA0cUAAB7BfF6wAAAABJRU5ErkJggg==`
  });
});

app.post('/api/auth/customer/login', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }
  
  res.json({
    success: true,
    token: 'netlify-jwt-customer',
    user: {
      id: 1,
      phone,
      name: 'Customer User',
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
    token: 'netlify-jwt-shop-owner',
    user: {
      id: 2,
      email,
      name: 'Shop Owner',
      role: 'shop_owner'
    }
  });
});

app.get('/api/shops', (req, res) => {
  res.json({
    success: true,
    shops: [
      {
        id: 1,
        name: 'PrintEasy Demo Shop',
        slug: 'demo-shop',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        isOnline: true,
        services: ['Color Printing', 'B&W Printing', 'Scanning'],
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
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export for Netlify
exports.handler = serverless(app);