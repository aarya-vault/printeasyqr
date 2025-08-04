import session from 'express-session';
import MemoryStore from 'memorystore';

// 🔥 BULLETPROOF SESSION CONFIGURATION - Rebuilt with MemoryStore to eliminate TimeoutOverflowWarning
export function createSessionMiddleware() {
  console.log('🔧 Initializing bulletproof session configuration...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPLIT_DOMAIN !== undefined;
  
  // Create MemoryStore instance with proper configuration
  const memoryStore = MemoryStore(session);
  
  return session({
    // MemoryStore - eliminates TimeoutOverflowWarning and provides reliable sessions
    store: new memoryStore({
      checkPeriod: 3600000, // 1 hour cleanup (direct value)
      ttl: 86400000, // 24 hours TTL (direct value)
      dispose: (key, sess) => {
        console.log('🗑️ Session disposed:', key);
      },
      stale: false // Don't return stale sessions
    }),
    
    // Session configuration - bulletproof settings
    name: 'printeasy_session',
    secret: process.env.SESSION_SECRET || 'printeasy-ultra-secure-key-2025-rebuilt',
    
    // Force session persistence - critical for dashboard access
    resave: true, // Changed to true to force session save
    saveUninitialized: false,
    
    // Cookie configuration - fixed for same-origin on Replit
    cookie: {
      secure: false, // No secure needed for same-origin requests
      httpOnly: true, // Prevent XSS attacks
      maxAge: 86400000, // 24 hours (direct value)
      sameSite: 'lax', // 'lax' for same-origin requests
      path: '/', // Available on all paths
      domain: undefined // Let browser determine
    },
    
    // Enable session rolling for better UX
    rolling: true,
    
    // Trust proxy for Replit and production
    proxy: isProduction || isReplit
  });
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