# PrintEasy QR - Netlify Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying PrintEasy QR to Netlify with full production configuration.

## Pre-deployment Requirements

### 1. Environment Setup
Ensure all required environment variables are configured:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
SESSION_SECRET=your-secure-session-secret-minimum-32-chars
JWT_SECRET=your-jwt-secret-minimum-32-chars

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# Environment
NODE_ENV=production
PORT=5000
```

### 2. Database Preparation
- Ensure PostgreSQL database is accessible from Netlify
- Run any pending migrations
- Verify admin user can be created

## Netlify Configuration

### 1. Create netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "npm run dev"
  port = 5000
```

### 2. Create Netlify Functions

Create `netlify/functions/api.js`:
```javascript
import express from 'express';
import serverless from 'serverless-http';
import app from '../../src/app.js';

const handler = serverless(app);

export { handler };
```

### 3. Update package.json
Add build scripts for Netlify:
```json
{
  "scripts": {
    "build": "vite build && npm run build:functions",
    "build:functions": "esbuild netlify/functions/*.js --bundle --platform=node --outdir=.netlify/functions",
    "dev": "npm run dev:server",
    "dev:server": "tsx server/index.ts"
  }
}
```

## Database Configuration for Production

### 1. Connection Pool Settings
Update database configuration for serverless:
```javascript
// src/config/database.js
const config = {
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### 2. Serverless Database Connection
Handle connection pooling for serverless environment:
```javascript
// src/config/serverless-db.js
let connection = null;

export const getConnection = async () => {
  if (connection) {
    return connection;
  }
  
  connection = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
  return connection;
};
```

## File Upload Configuration

### 1. Serverless File Handling
For production, consider using external file storage:

```javascript
// src/config/file-storage.js
const storage = process.env.NODE_ENV === 'production'
  ? multer.memoryStorage() // Use memory storage for serverless
  : multer.diskStorage({
      destination: 'uploads/',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    });
```

### 2. Alternative: Use Netlify Blob Storage
```javascript
import { getStore } from '@netlify/blobs';

const store = getStore('uploads');

export const uploadFile = async (file) => {
  const key = `${Date.now()}-${file.originalname}`;
  await store.set(key, file.buffer);
  return key;
};

export const downloadFile = async (key) => {
  return await store.get(key);
};
```

## Environment Variables Setup

### 1. Netlify Dashboard
1. Go to Site Settings > Environment Variables
2. Add all required variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`

### 2. Security Considerations
- Use strong, unique secrets for production
- Ensure database URL includes SSL settings
- Verify admin credentials are secure

## Build Optimization

### 1. Vite Configuration
Update `vite.config.ts` for production:
```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5000
  }
});
```

### 2. Bundle Size Optimization
- Enable tree shaking
- Use dynamic imports for large components
- Optimize images and assets

## CORS Configuration

Update CORS settings for production domain:
```javascript
// src/app.js
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://your-netlify-domain.netlify.app',
    'https://your-custom-domain.com'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  next();
});
```

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all dependencies are installed
npm install

# Run build locally to test
npm run build

# Commit all changes
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Connect to Netlify
1. Go to Netlify Dashboard
2. Click "New site from Git"
3. Connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. Configure Environment Variables
1. Go to Site Settings > Environment Variables
2. Add all required variables
3. Save configuration

### 4. Deploy
1. Trigger initial deployment
2. Monitor build logs for errors
3. Test all functionality after deployment

## Post-Deployment Verification

### 1. Health Check
Test the health endpoint:
```bash
curl https://your-site.netlify.app/api/health
```

### 2. Authentication Test
1. Try logging in as admin
2. Test customer phone login
3. Verify JWT tokens work correctly

### 3. API Endpoints Test
- Test order creation
- Test file uploads
- Test chat functionality
- Test shop management

### 4. Database Connection
- Verify database connectivity
- Test CRUD operations
- Check data persistence

## Monitoring and Debugging

### 1. Netlify Function Logs
Monitor function execution:
1. Go to Functions tab in Netlify dashboard
2. View logs for API function
3. Monitor error rates and performance

### 2. Error Tracking
Add error tracking for production:
```javascript
// src/middleware/error-tracking.js
export const errorTracker = (err, req, res, next) => {
  console.error('Production Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Send to external error tracking service if needed
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
};
```

## Performance Optimization

### 1. Database Optimization
- Use connection pooling
- Implement query optimization
- Add database indexing

### 2. Function Optimization
- Minimize cold start times
- Use efficient algorithms
- Cache frequently accessed data

### 3. Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading

## Troubleshooting Common Issues

### 1. Function Timeout
If functions timeout, optimize database queries and reduce processing time.

### 2. Memory Limits
Netlify functions have memory limits. Optimize memory usage in file processing.

### 3. Cold Starts
Minimize function size and dependencies to reduce cold start times.

### 4. Database Connection Issues
Ensure connection pool settings are appropriate for serverless environment.

## Security Checklist

- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] JWT secrets are strong and unique
- [ ] Admin credentials are secure
- [ ] CORS properly configured
- [ ] File upload limits enforced
- [ ] Authentication middleware applied to all protected routes

## Maintenance

### 1. Regular Updates
- Update dependencies regularly
- Monitor security advisories
- Keep database drivers updated

### 2. Backup Strategy
- Regular database backups
- Environment variable backup
- Code repository backup

### 3. Monitoring
- Set up uptime monitoring
- Monitor error rates
- Track performance metrics

This guide provides comprehensive instructions for deploying PrintEasy QR to Netlify with production-ready configuration.