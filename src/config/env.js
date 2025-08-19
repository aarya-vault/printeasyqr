/**
 * Centralized Environment Configuration
 * Single source of truth for all environment variables
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Helper function to get boolean environment variables
const getBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value === 'true' || value === '1';
};

// Helper function to get number environment variables
const getNumber = (value, defaultValue) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

// Helper function to get array from comma-separated string
const getArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * Environment Configuration Object
 * All configuration should be accessed through this object
 */
const config = {
  // ==========================================
  // DATABASE CONFIGURATION
  // ==========================================
  database: {
    // Primary database URL from environment
    url: process.env.DATABASE_URL,
    
    // Individual PostgreSQL credentials (used if URL not available)
    host: process.env.PGHOST,
    port: getNumber(process.env.PGPORT, 5432),
    name: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    
    // Connection options
    ssl: getBoolean(process.env.DATABASE_SSL, true),
    logging: getBoolean(process.env.SEQUELIZE_LOGGING, false),
    
    // Pool configuration
    pool: {
      max: getNumber(process.env.DB_POOL_MAX, 5),
      min: getNumber(process.env.DB_POOL_MIN, 0),
      acquire: getNumber(process.env.DB_POOL_ACQUIRE, 30000),
      idle: getNumber(process.env.DB_POOL_IDLE, 10000)
    },
    
    // Migration settings
    skipMigrations: getBoolean(process.env.SKIP_MIGRATIONS, false),
    skipDbCheck: getBoolean(process.env.SKIP_DB_CHECK, false),
    disableSync: getBoolean(process.env.DISABLE_DB_SYNC, true)
  },
  
  // ==========================================
  // APPLICATION CONFIGURATION
  // ==========================================
  app: {
    env: process.env.NODE_ENV || 'development',
    port: getNumber(process.env.PORT, 5000),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
  },
  
  // ==========================================
  // AUTHENTICATION & SECURITY
  // ==========================================
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    
    // JWT token expiry
    tokenExpiry: process.env.JWT_EXPIRY || '7d',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
    
    // Password requirements
    minPasswordLength: getNumber(process.env.MIN_PASSWORD_LENGTH, 8),
    requireUppercase: getBoolean(process.env.REQUIRE_UPPERCASE, true),
    requireNumbers: getBoolean(process.env.REQUIRE_NUMBERS, true),
    requireSpecialChars: getBoolean(process.env.REQUIRE_SPECIAL_CHARS, true)
  },
  
  // ==========================================
  // CORS & COOKIES
  // ==========================================
  cors: {
    origins: getArray(process.env.CORS_ORIGINS, ['http://localhost:5000', 'http://localhost:3000']),
    credentials: true
  },
  
  cookies: {
    secure: getBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: getNumber(process.env.COOKIE_MAX_AGE, 86400000), // 24 hours
    httpOnly: true
  },
  
  // ==========================================
  // CLOUD STORAGE CONFIGURATION
  // ==========================================
  storage: {
    // R2/S3 Configuration
    r2: {
      enabled: getBoolean(process.env.ENABLE_R2_STORAGE, false),
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || '',
      endpoint: process.env.R2_ENDPOINT || '',
      publicUrl: process.env.R2_PUBLIC_URL || ''
    },
    
    // Replit Object Storage
    objectStorage: {
      bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '',
      bucketName: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_NAME || '',
      publicPaths: process.env.PUBLIC_OBJECT_SEARCH_PATHS || '',
      privateDir: process.env.PRIVATE_OBJECT_DIR || ''
    },
    
    // Local storage settings
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads',
      maxFileSize: getNumber(process.env.MAX_FILE_SIZE, 52428800), // 50MB
      maxFilesPerUpload: getNumber(process.env.MAX_FILES_PER_UPLOAD, 20)
    }
  },
  
  // ==========================================
  // EXTERNAL SERVICES
  // ==========================================
  services: {
    // WhatsApp OTP (Gupshup)
    whatsapp: {
      enabled: getBoolean(process.env.ENABLE_WHATSAPP_OTP, false),
      apiKey: process.env.GUPSHUP_API_KEY || '',
      appName: process.env.GUPSHUP_APP_NAME || '',
      sourcePhone: process.env.GUPSHUP_SOURCE_PHONE || ''
    },
    
    // Google Maps
    googleMaps: {
      enabled: getBoolean(process.env.ENABLE_GOOGLE_MAPS, false),
      apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
    }
  },
  
  // ==========================================
  // RATE LIMITING
  // ==========================================
  rateLimit: {
    max: getNumber(process.env.RATE_LIMIT_MAX, 100),
    windowMs: getNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000) // 1 minute
  },
  
  // ==========================================
  // LOGGING
  // ==========================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    sqlQueries: getBoolean(process.env.SEQUELIZE_LOGGING, false)
  },
  
  // ==========================================
  // FEATURE FLAGS
  // ==========================================
  features: {
    whatsappOtp: getBoolean(process.env.ENABLE_WHATSAPP_OTP, false),
    r2Storage: getBoolean(process.env.ENABLE_R2_STORAGE, false),
    googleMaps: getBoolean(process.env.ENABLE_GOOGLE_MAPS, false)
  }
};

// Validate critical configuration
const validateConfig = () => {
  const errors = [];
  
  // Check database configuration
  if (!config.database.url && (!config.database.host || !config.database.user)) {
    errors.push('Database configuration missing: Set DATABASE_URL or individual PG variables');
  }
  
  // Check JWT secret in production
  if (config.app.isProduction && !config.auth.jwtSecret) {
    errors.push('JWT_SECRET must be set in production');
  }
  
  // Check session secret in production
  if (config.app.isProduction && !config.auth.sessionSecret) {
    errors.push('SESSION_SECRET must be set in production');
  }
  
  // Log warnings for optional services
  if (config.features.whatsappOtp && !config.services.whatsapp.apiKey) {
    console.warn('⚠️  WhatsApp OTP enabled but GUPSHUP_API_KEY not set');
  }
  
  if (config.features.r2Storage && !config.storage.r2.accessKeyId) {
    console.warn('⚠️  R2 Storage enabled but R2_ACCESS_KEY_ID not set');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    if (config.app.isProduction) {
      throw new Error('Configuration validation failed');
    }
  }
  
  console.log('✅ Configuration loaded successfully');
  console.log(`📊 Environment: ${config.app.env}`);
  console.log(`🔗 Database: ${config.database.url ? 'Connected via URL' : 'Connected via credentials'}`);
};

// Run validation
validateConfig();

// Export the configuration object
export default config;

// Also export individual sections for convenience
export const { database, app, auth, cors, cookies, storage, services, rateLimit, logging, features } = config;