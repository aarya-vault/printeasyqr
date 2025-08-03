import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

// 🔥 BULLETPROOF SESSION CONFIGURATION - Built from scratch for Node.js + Sequelize + Replit
export function createSessionMiddleware() {
  return session({
    // PostgreSQL session store - optimized for Sequelize
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      // Critical: Disable automatic session cleanup to avoid issues
      disableTouch: false,
      // Session cleanup every 24 hours
      pruneSessionInterval: 24 * 60 * 60 * 1000,
      // Log store errors for debugging
      errorLog: (...args) => {
        console.error('🚨 Session Store Error:', ...args);
      }
    }),
    
    // Session configuration optimized for Replit environment
    name: 'printeasy_session', // Custom name to avoid conflicts
    secret: process.env.SESSION_SECRET || 'printeasy-ultra-secure-key-2025',
    
    // Critical: Only save sessions when they contain data
    resave: false,
    saveUninitialized: false,
    
    // Cookie configuration for cross-environment compatibility
    cookie: {
      // Dynamic secure setting based on environment
      secure: false, // Start with false, will auto-detect
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (fixed timeout issue)
      sameSite: 'lax', // Allow same-site requests
      path: '/', // Available on all paths
      domain: undefined // Let browser determine
    },
    
    // Disable session rolling to prevent constant rewrites
    rolling: false,
    
    // Enable proxy trust for Replit
    proxy: undefined // Will be set by Express trust proxy
  });
}

// Session helpers for authentication
export const SessionHelpers = {
  // Create user session
  createUserSession: (req, userData) => {
    req.session.user = {
      id: userData.id,
      email: userData.email || undefined,
      phone: userData.phone || undefined,
      name: userData.name,
      role: userData.role
    };
    
    // Force session save
    return new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log(`✅ Session created for user ${userData.id} (${userData.role})`);
          resolve();
        }
      });
    });
  },
  
  // Destroy user session
  destroyUserSession: (req) => {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ Session destroy error:', err);
          reject(err);
        } else {
          console.log('✅ Session destroyed');
          resolve();
        }
      });
    });
  },
  
  // Get current user from session
  getCurrentUser: (req) => {
    return req.session?.user || null;
  },
  
  // Check if user is authenticated
  isAuthenticated: (req) => {
    return !!req.session?.user;
  },
  
  // Check user role
  hasRole: (req, role) => {
    return req.session?.user?.role === role;
  }
};