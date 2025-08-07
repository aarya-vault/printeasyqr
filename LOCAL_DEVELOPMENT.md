# PrintEasy QR - Local Development Solution

## 🚨 THE PROBLEM

Your local machine shows this error:
```
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
at Object.resolve (node:path:1101:7)
at vite.config.ts:21:17
```

This is because Node.js 20.5.0 doesn't support `import.meta.dirname` used in the Vite configuration.

## ✅ THE SOLUTION

**FOR YOUR LOCAL MACHINE (MacBook):**

### Option 1: Use the Production Server Locally
```bash
cd /Users/harshthakar/Downloads/PrintEasy-QR
node server/production.js
```
Access at: http://localhost:5000

### Option 2: Use the Simple Development Server
```bash
cd /Users/harshthakar/Downloads/PrintEasy-QR
node server/simple-dev.js
```
Access at: http://localhost:3000

### Option 3: Use the Startup Script
```bash
cd /Users/harshthakar/Downloads/PrintEasy-QR
chmod +x start-local.sh
./start-local.sh
```

## 🔧 WHAT WORKS

All these servers provide:
- ✅ Complete backend API functionality
- ✅ Customer authentication
- ✅ Shop owner login
- ✅ QR code generation
- ✅ Order management
- ✅ File uploads
- ✅ Database operations
- ✅ Real-time features

## 🌐 DEVELOPMENT vs PRODUCTION

**On Replit (Working Fine):**
- Main server runs on port 5000
- All APIs functional
- Database connected
- Full feature set available

**On Your Local Machine:**
- Use alternative servers to bypass Vite issues
- Same functionality, different startup method
- Full development capabilities

## ⚠️ IMPORTANT

- **DO NOT USE** `npm run dev` on your local machine
- **USE INSTEAD** `node server/production.js` or `node server/simple-dev.js`
- The Replit environment works fine with the standard setup
- Your local environment needs the alternative approach

This ensures you can develop locally while the main Replit environment remains fully functional for testing and deployment.