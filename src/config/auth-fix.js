// COMPLETE AUTH REBUILD - Working solution for Replit environment
import session from 'express-session';
import MemoryStore from 'memorystore';

export function createWorkingSessionMiddleware() {
  console.log('🔧 Creating WORKING session configuration...');
  
  const memoryStore = MemoryStore(session);
  
  return session({
    store: new memoryStore({
      checkPeriod: 86400000,
      ttl: 86400000,
      stale: false
    }),
    
    name: 'printeasy_session',
    secret: process.env.SESSION_SECRET || 'printeasy-2025',
    resave: false,
    saveUninitialized: true, // CRITICAL: Must be true for initial cookie setting
    
    cookie: {
      httpOnly: true,
      maxAge: 86400000,
      path: '/',
      // CRITICAL: For cross-origin requests with credentials
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'none',
      secure: process.env.NODE_ENV === 'production' ? true : true
    },
    
    // CRITICAL: Must trust proxy
    proxy: true
  });
}

// Custom middleware to ensure cookies are sent
export function ensureCookiesMiddleware() {
  return (req, res, next) => {
    // Override cookie settings for each request if needed
    if (req.session && req.session.cookie) {
      // Force cookie to be sent
      req.session.touch();
    }
    
    // Ensure CORS headers are always set
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    next();
  };
}

// JWT-based authentication as fallback
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'printeasy-jwt-secret-2025';

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      phone: user.phone,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Hybrid auth middleware - tries session first, then JWT
export function hybridAuthMiddleware(req, res, next) {
  // Try session first
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  
  // Try JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }
  
  // No auth found
  res.status(401).json({ message: 'Authentication required' });
}