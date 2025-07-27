// Authentication middleware for better security and organization
import { Request, Response, NextFunction } from 'express';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        phone?: string;
        email?: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  req.user = req.session.user;
  next();
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export const requireCustomer = requireRole('customer');
export const requireShopOwner = requireRole('shop_owner');
export const requireAdmin = requireRole('admin');
export const requireShopOwnerOrAdmin = requireRole(['shop_owner', 'admin']);