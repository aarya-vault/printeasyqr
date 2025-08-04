import session from 'express-session';
import MemoryStore from 'memorystore';

// 🔥 FINAL SESSION FIX - Working configuration for Replit
export function createSessionMiddleware() {
  console.log('🔧 Final session configuration...');
  
  // Create MemoryStore instance
  const memoryStore = MemoryStore(session);
  
  const sessionConfig = {
    // MemoryStore configuration
    store: new memoryStore({
      checkPeriod: 86400000, // 24 hours
      ttl: 86400000, // 24 hours
      stale: false
    }),
    
    // Core session settings
    name: 'printeasy_session',
    secret: process.env.SESSION_SECRET || 'printeasy-secure-2025',
    resave: false,
    saveUninitialized: false,
    
    // Cookie configuration - CRITICAL SETTINGS
    cookie: {
      httpOnly: true,
      maxAge: 86400000, // 24 hours
      path: '/',
      // CRITICAL: Must use 'none' for cross-origin in HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'none',
      // CRITICAL: Must be true for sameSite=none
      secure: true
    },
    
    // Enable proxy trust for Replit
    proxy: true,
    
    // Disable rolling
    rolling: false
  };
  
  return session(sessionConfig);
}

// 🔥 BULLETPROOF SESSION HELPERS - Rebuilt for 100% reliability
export const SessionHelpers = {
  // Create user session with enhanced error handling and persistence
  createUserSession: async (req, userData) => {
    try {
      // Create session data with all required fields
      req.session.user = {
        id: userData.id,
        email: userData.email || null,
        phone: userData.phone || null,
        name: userData.name || null,
        role: userData.role
      };
      
      // Add session metadata for debugging
      req.session.createdAt = new Date().toISOString();
      req.session.lastAccess = new Date().toISOString();
      
      // Force session save with retry mechanism
      return new Promise((resolve, reject) => {
        const attemptSave = (attempt = 1) => {
          req.session.save((err) => {
            if (err) {
              console.error(`❌ Session save error (attempt ${attempt}):`, err);
              if (attempt < 3) {
                console.log(`🔄 Retrying session save (attempt ${attempt + 1})...`);
                setTimeout(() => attemptSave(attempt + 1), 100);
              } else {
                reject(err);
              }
            } else {
              console.log(`✅ Session created successfully for user ${userData.id} (${userData.role})`);
              console.log(`📋 Session ID: ${req.sessionID}`);
              resolve();
            }
          });
        };
        attemptSave();
      });
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  },
  
  // Destroy user session with cleanup
  destroyUserSession: async (req) => {
    try {
      const userId = req.session?.user?.id;
      return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            console.error('❌ Session destroy error:', err);
            reject(err);
          } else {
            console.log(`✅ Session destroyed for user ${userId || 'unknown'}`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('❌ Session destruction failed:', error);
      throw error;
    }
  },
  
  // Get current user from session with validation
  getCurrentUser: (req) => {
    try {
      const user = req.session?.user;
      if (user) {
        // Update last access time
        req.session.lastAccess = new Date().toISOString();
      }
      return user || null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  },
  
  // Check if user is authenticated with session validation
  isAuthenticated: (req) => {
    try {
      return !!(req.session?.user?.id && req.session?.user?.role);
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  },
  
  // Check user role with validation
  hasRole: (req, role) => {
    try {
      return req.session?.user?.role === role;
    } catch (error) {
      console.error('❌ Error checking user role:', error);
      return false;
    }
  },
  
  // New: Refresh session to prevent timeout
  refreshSession: (req) => {
    try {
      if (req.session?.user) {
        req.session.lastAccess = new Date().toISOString();
        req.session.save((err) => {
          if (err) {
            console.error('❌ Session refresh error:', err);
          }
        });
      }
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
    }
  }
};