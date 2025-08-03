import { User } from '../models/index.js';

const requireAuth = async (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // Fetch current user from database to ensure role is up-to-date
    const currentUser = await User.findByPk(req.session.user.id);
    
    if (!currentUser) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Update session if role changed (handles customer → shop_owner transition)
    if (currentUser.role !== req.session.user.role) {
      console.log(`🔄 Auth middleware: User ${currentUser.id} role changed: ${req.session.user.role} → ${currentUser.role}`);
      req.session.user = {
        id: currentUser.id,
        phone: currentUser.phone || undefined,
        email: currentUser.email || undefined,
        name: currentUser.name || (currentUser.role === 'customer' ? 'Customer' : 'Shop Owner'),
        role: currentUser.role
      };
      await req.session.save();
    }
    
    req.user = req.session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

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