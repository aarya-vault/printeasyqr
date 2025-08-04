import { User } from '../models/index.js';
import { SessionHelpers } from '../config/session.js';
import { verifyToken } from '../config/auth-fix.js';

const requireAuth = async (req, res, next) => {
  try {
    // Check session authentication first
    let sessionUser = SessionHelpers.getCurrentUser(req);
    
    // If no session, try JWT token
    if (!sessionUser) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (decoded) {
          sessionUser = decoded;
        }
      }
    }
    
    if (!sessionUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify user exists in database
    const currentUser = await User.findByPk(sessionUser.id);
    if (!currentUser) {
      await SessionHelpers.destroyUserSession(req);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user directly from database
    req.user = {
      id: currentUser.id,
      phone: currentUser.phone,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role
    };
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check authentication first - try session then JWT
      let user = SessionHelpers.getCurrentUser(req);
      
      // If no session, try JWT token
      if (!user) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = verifyToken(token);
          if (decoded) {
            user = decoded;
          }
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Verify user exists in database
      const currentUser = await User.findByPk(user.id);
      if (!currentUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!allowedRoles.includes(currentUser.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      req.user = {
        id: currentUser.id,
        phone: currentUser.phone,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      };
      
      next();
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  };
};

const requireCustomer = requireRole('customer');
const requireShopOwner = requireRole('shop_owner');
const requireAdmin = requireRole('admin');
const requireShopOwnerOrAdmin = requireRole(['shop_owner', 'admin']);

export {
  requireAuth,
  requireRole,
  requireCustomer,
  requireShopOwner,
  requireAdmin,
  requireShopOwnerOrAdmin
};