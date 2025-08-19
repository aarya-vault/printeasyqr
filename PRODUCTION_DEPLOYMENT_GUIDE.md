# 🚀 PrintEasy QR Production Deployment Guide

**Universal deployment solution that works on ANY platform:**
- ✅ Replit
- ✅ Windows Server/IIS
- ✅ Linux Servers
- ✅ Docker Containers
- ✅ Cloud Platforms (Vercel, Netlify, Heroku)

## 🎯 QUICK START (Any Platform)

### 1. Setup Environment
```bash
# Copy environment template
cp .env.template .env

# Edit .env with your database credentials
# Minimum required:
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secure-secret-here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Application
```bash
npm run build
```

### 4. Start Production Server
```bash
# Use the universal production starter
node production-start.js

# OR use npm command
npm run production
```

## 🔧 Environment Configuration

### Database Configuration (Choose ONE)

**Option A: Full URL (Recommended)**
```env
DATABASE_URL=postgresql://username:password@host:5432/database
```

**Option B: Individual Variables**
```env
PGHOST=your-database-host
PGPORT=5432
PGDATABASE=your-database-name
PGUSER=your-username
PGPASSWORD=your-password
```

### Required Application Settings
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secure-jwt-secret-here
SESSION_SECRET=your-secure-session-secret-here
```

## 🌐 Platform-Specific Instructions

### Windows Server / IIS

1. **Install Node.js 20+**
2. **Create .env file in project root:**
   ```env
   DATABASE_URL=postgresql://user:pass@yourhost:5432/printeasyqr
   JWT_SECRET=your-secure-secret
   PORT=5000
   NODE_ENV=production
   ```
3. **Run commands:**
   ```cmd
   npm install
   npm run build
   node production-start.js
   ```

### Replit Deployment

1. **Click "Deploy" button in Replit**
2. **Environment variables auto-configured**
3. **No additional setup needed**

### Linux Server (Ubuntu/CentOS)

1. **Install Node.js and PostgreSQL:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql
   ```

2. **Setup database:**
   ```bash
   sudo -u postgres createdb printeasyqr
   sudo -u postgres createuser printeasyqr_user
   sudo -u postgres psql -c "ALTER USER printeasyqr_user PASSWORD 'your_password';"
   ```

3. **Configure and start:**
   ```bash
   cp .env.template .env
   # Edit .env with your settings
   npm install
   npm run build
   node production-start.js
   ```

### Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 5000
   CMD ["node", "production-start.js"]
   ```

2. **Build and run:**
   ```bash
   docker build -t printeasyqr .
   docker run -p 5000:5000 --env-file .env printeasyqr
   ```

## 🔍 Troubleshooting

### Common Issues & Solutions

**❌ "Missing required database configuration"**
```bash
# Solution: Create .env file with database credentials
cp .env.template .env
# Edit .env with your database URL
```

**❌ "Database connection failed"**
```bash
# Check if database server is running
# Verify credentials in .env file
# Test connection manually
```

**❌ "Frontend build not found"**
```bash
# Run build command
npm run build
```

**❌ "Port already in use"**
```bash
# Change port in .env file
PORT=3000
```

### Diagnostic Commands

**Check environment:**
```bash
node -e "console.log(process.env.DATABASE_URL ? 'DB URL found' : 'DB URL missing')"
```

**Test database connection:**
```bash
node -e "import('./src/config/database.js').then(db => db.testConnection())"
```

**Verify build:**
```bash
ls -la dist/client/index.html
```

## ⚡ Performance & Security

### Production Optimizations

**Enable in .env:**
```env
# Security
COOKIE_SECURE=true
CORS_ORIGINS=https://yourdomain.com

# Performance
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=52428800

# Disable development features
SEQUELIZE_LOGGING=false
LOG_LEVEL=warn
```

### Monitoring

**Health Check Endpoint:**
```
GET /api/health
```

**Server Logs:**
```bash
# View logs in real-time
tail -f production.log

# Check startup logs
node production-start.js 2>&1 | tee startup.log
```

## 🆘 Emergency Recovery

If production server fails to start:

1. **Check environment variables:**
   ```bash
   node -p "Object.keys(process.env).filter(k => k.includes('PG') || k.includes('DATABASE'))"
   ```

2. **Verify database connectivity:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Reset to working state:**
   ```bash
   git checkout main
   npm install
   npm run build
   node production-start.js
   ```

4. **Last resort - use development mode:**
   ```bash
   npm run dev
   ```

## 📞 Support

**Production server running successfully when you see:**
```
🎉 SERVER STARTED SUCCESSFULLY!

🌐 URL: http://0.0.0.0:5000
🔌 WebSocket: ws://0.0.0.0:5000/ws
📊 Database: Connected

✅ PrintEasy QR is ready for production traffic!
```

**For issues:** Check this guide first, then create issue with startup logs.