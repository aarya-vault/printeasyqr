// PURE JWT AUTHENTICATION SYSTEM - No sessions, no cookies
import jwt from 'jsonwebtoken';

// Environment variables should be loaded by app.js already
const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('❌ CRITICAL: JWT_SECRET not found when generating token');
    console.error('Available JWT env vars:', Object.keys(process.env).filter(k => k.includes('JWT')));
    throw new Error('JWT_SECRET must be set in .env file');
  }
  return JWT_SECRET;
};

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role
    },
    getJWTSecret(),
    { expiresIn: process.env.JWT_EXPIRY || '90d' } // Use env expiry or default to 90 days
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
    getJWTSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '180d' } // Use env expiry or default to 6 months
  );
}

export function verifyToken(token) {
  try {
    console.log(`🔐 [JWT VERIFY] Verifying token with length ${token.length}`);
    console.log(`🔑 [JWT VERIFY] Using JWT_SECRET: ${process.env.JWT_SECRET?.substring(0, 10)}...`);
    const decoded = jwt.verify(token, getJWTSecret());
    console.log(`✅ [JWT VERIFY SUCCESS] Decoded:`, { id: decoded.id, role: decoded.role, exp: new Date(decoded.exp * 1000) });
    return decoded;
  } catch (error) {
    console.log(`❌ [JWT VERIFY ERROR] ${error.name}: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      console.log(`🕰️ [JWT EXPIRED] Token expired at: ${new Date(error.expiredAt)}`);
    }
    if (error.name === 'JsonWebTokenError') {
      console.log(`❌ [JWT MALFORMED] Invalid token format or signature`);
    }
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