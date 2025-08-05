import { User } from '../models/index.js';
import { verifyToken } from '../config/jwt-auth.js';

const requireAuth = async (req, res, next) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No JWT token found in Authorization header');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ Invalid or expired JWT token');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    console.log('🔐 JWT Authentication successful:', decoded.id, decoded.role);
    
    // Verify user exists in database
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      console.log('❌ User not found or inactive:', decoded.id);
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Set user data from database
    req.user = {
      id: currentUser.id,
      phone: currentUser.phone,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      isActive: currentUser.isActive
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
      
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Verify user exists in database
      const currentUser = await User.findByPk(decoded.id);
      if (!currentUser || !currentUser.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }
      
      if (!allowedRoles.includes(currentUser.role)) {
        console.log(`❌ Access denied: ${currentUser.role} not in ${allowedRoles}`);
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      req.user = {
        id: currentUser.id,
        phone: currentUser.phone,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        isActive: currentUser.isActive
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