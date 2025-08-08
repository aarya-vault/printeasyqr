import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    token: 'jwt-token-customer',
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
    token: 'jwt-token-shop-owner',
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
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '21:00', closed: false },
          friday: { open: '09:00', close: '21:00', closed: false },
          saturday: { open: '10:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time features
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    ws.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 PrintEasy server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;