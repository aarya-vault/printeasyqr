import { User } from '../models/index.js';
import { SessionHelpers } from '../config/session.js';

const requireAuth = async (req, res, next) => {
  try {
    // Check session authentication
    if (!SessionHelpers.isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const sessionUser = SessionHelpers.getCurrentUser(req);
    
    // Verify user exists in database
    const currentUser = await User.findByPk(sessionUser.id);
    if (!currentUser) {
      await SessionHelpers.destroyUserSession(req);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Update session if role changed
    if (currentUser.role !== sessionUser.role) {
      console.log(`🔄 Auth middleware: Role changed ${sessionUser.role} → ${currentUser.role}`);
      await SessionHelpers.createUserSession(req, {
        id: currentUser.id,
        phone: currentUser.phone,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      });
    }
    
    // Set user on request object
    req.user = SessionHelpers.getCurrentUser(req);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check authentication first
    if (!SessionHelpers.isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check role
    const user = SessionHelpers.getCurrentUser(req);
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    req.user = user;
    next();
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