import rateLimit from 'express-rate-limit';
import { getSequelize } from '../config/database.js';

// CRITICAL: R2 Upload Rate Limiter to prevent API abuse
export const r2UploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 upload requests per windowMs
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Let express-rate-limit handle IP detection automatically
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many upload requests',
      message: 'You have exceeded the upload rate limit. Please wait a few minutes and try again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Multipart upload rate limiter (stricter for large files)
export const multipartUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Only 50 multipart uploads per 15 minutes
  message: 'Too many large file uploads, please try again later'
});

// Database connection limiter
export const dbConnectionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 DB operations per minute per user
  message: 'Too many database requests',
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  }
});

// WebSocket connection limiter
export const wsConnectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 WebSocket connection attempts per 5 minutes
  message: 'Too many WebSocket connection attempts'
});

// System health monitor middleware
export const systemHealthMonitor = async (req, res, next) => {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    // Check if system is under stress
    if (heapUsedMB > 300) {
      // System is under heavy load
      console.error(`⚠️ HIGH MEMORY USAGE: ${heapUsedMB.toFixed(2)}MB`);
      
      // For non-critical endpoints, reject with 503
      if (!req.path.includes('/health') && !req.path.includes('/login')) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'System is under heavy load. Please try again in a moment.',
          retryAfter: 30
        });
      }
    }
    
    // Check database pool health
    const sequelize = getSequelize();
    if (sequelize) {
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        const { size, available, pending } = pool;
        
        // If pool is exhausted, reject new requests
        if (available === 0 && pending > 10) {
          console.error(`⚠️ DATABASE POOL EXHAUSTED: ${pending} pending connections`);
          
          return res.status(503).json({
            error: 'Database overloaded',
            message: 'Too many concurrent requests. Please try again.',
            retryAfter: 5
          });
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't let monitoring errors break the app
    next();
  }
};

// Upload queue manager to prevent concurrent overload
class UploadQueueManager {
  constructor() {
    this.userQueues = new Map();
    this.maxConcurrentPerUser = 3;
    this.globalConcurrent = 0;
    this.maxGlobalConcurrent = 50; // Support 50 concurrent users
  }
  
  canUserUpload(userId) {
    // Check global limit
    if (this.globalConcurrent >= this.maxGlobalConcurrent) {
      return false;
    }
    
    // Check user limit
    const userCount = this.userQueues.get(userId) || 0;
    return userCount < this.maxConcurrentPerUser;
  }
  
  startUpload(userId) {
    const userCount = this.userQueues.get(userId) || 0;
    this.userQueues.set(userId, userCount + 1);
    this.globalConcurrent++;
  }
  
  endUpload(userId) {
    const userCount = this.userQueues.get(userId) || 1;
    if (userCount <= 1) {
      this.userQueues.delete(userId);
    } else {
      this.userQueues.set(userId, userCount - 1);
    }
    this.globalConcurrent = Math.max(0, this.globalConcurrent - 1);
  }
  
  getStats() {
    return {
      globalConcurrent: this.globalConcurrent,
      activeUsers: this.userQueues.size,
      userQueues: Array.from(this.userQueues.entries())
    };
  }
}

export const uploadQueue = new UploadQueueManager();

// Middleware to manage upload queue
export const uploadQueueMiddleware = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  
  if (!uploadQueue.canUserUpload(userId)) {
    return res.status(429).json({
      error: 'Upload queue full',
      message: 'Too many concurrent uploads. Please wait for your previous uploads to complete.',
      queueStats: uploadQueue.getStats()
    });
  }
  
  uploadQueue.startUpload(userId);
  
  // Ensure we clean up on response end
  res.on('finish', () => {
    uploadQueue.endUpload(userId);
  });
  
  // Also clean up on close/error
  res.on('close', () => {
    uploadQueue.endUpload(userId);
  });
  
  next();
};

// Memory cleanup scheduler
setInterval(() => {
  if (global.gc) {
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    global.gc();
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memBefore - memAfter > 50) {
      console.log(`♻️ Garbage collection freed ${(memBefore - memAfter).toFixed(2)}MB`);
    }
  }
}, 60000); // Run every minute

export default {
  r2UploadLimiter,
  multipartUploadLimiter,
  dbConnectionLimiter,
  wsConnectionLimiter,
  systemHealthMonitor,
  uploadQueueMiddleware,
  uploadQueue
};