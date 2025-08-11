// PURE JWT AUTHENTICATION SYSTEM - No sessions, no cookies
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'printeasy-jwt-secret-2025';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '90d' } // Extended to 90 days for maximum session persistence
  );
}

// Generate refresh token for even longer persistence
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      tokenType: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '180d' } // 6 months refresh token
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Pure JWT middleware - no session fallback
export function jwtAuthMiddleware(req, res, next) {
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}