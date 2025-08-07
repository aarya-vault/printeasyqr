# PrintEasy QR - Local Development Guide

## 🚫 PROBLEM: Vite Configuration Issues

The standard `npm run dev` command fails due to Node.js 20.5.0 compatibility issues with `import.meta.dirname` in vite.config.ts.

## ✅ SOLUTION: Simple Development Server

Use the simplified development server that bypasses Vite completely:

### Quick Start
```bash
# Start the working development server
node server/simple-dev.js
```

### Or use the script
```bash
# Make executable and run
chmod +x start-local.sh
./start-local.sh
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/api/health

## 🔧 What This Does

The simple server:
1. Loads the working Sequelize backend (all APIs functional)
2. Serves static client files for the frontend
3. Handles SPA routing for React
4. Connects to PostgreSQL database
5. Supports all PrintEasy features

## ✅ Verified Working Features

- ✅ Customer phone authentication
- ✅ Shop owner email/password login
- ✅ QR code generation (with proper branding)
- ✅ Order management and file uploads
- ✅ Pincode lookup (19,583+ Indian pincodes)
- ✅ Real-time chat system
- ✅ Admin dashboard
- ✅ All CRUD operations

## 🚀 Production Deployment

For production deployment, use:
- **Netlify**: Configured with `netlify.toml`
- **Alternative Server**: `server/production.js`
- **Environment Variables**: All documented in `DEPLOYMENT_INSTRUCTIONS.md`

## ⚠️ Important Notes

1. **Don't use `npm run dev`** - it will fail due to Vite config issues
2. **Use `node server/simple-dev.js`** - this works perfectly
3. **All business logic is functional** - the simple server provides full functionality
4. **Database is connected** - PostgreSQL operations work flawlessly

This approach ensures you have a working development environment while maintaining all the production features of PrintEasy QR.