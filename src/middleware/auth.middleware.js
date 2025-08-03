const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  req.user = req.session.user;
  next();
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