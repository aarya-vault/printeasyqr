# PrintEasy QR - Complete Deployment Guide

## Table of Contents
1. [Production Deployment Issues](#production-deployment-issues)
2. [Self-Hosted Server Deployment](#self-hosted-server-deployment)
3. [Database Migration](#database-migration)
4. [Environment Configuration](#environment-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)

## Production Deployment Issues

### QR Generation Fix for Replit Deployment

The QR generation fails in production because Puppeteer requires Chrome to be properly configured. Here's the fix:

1. **Install Chrome in Production Environment**:
```bash
# Add to your deployment script or package.json postinstall
npx puppeteer browsers install chrome
```

2. **Environment Variables for Production**:
```env
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

3. **Updated Puppeteer Configuration** (already implemented):
- Removed `headless: 'new'` (incompatible with older Chrome versions)
- Added production-specific Chrome arguments
- Increased timeout to 90 seconds
- Added fallback Chrome paths

## Self-Hosted Server Deployment

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+ and npm
- PostgreSQL 13+
- Nginx (optional, for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Chrome dependencies for Puppeteer
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install google-chrome-stable -y
```

### 2. Database Setup

```bash
# Create database user and database
sudo -u postgres psql << EOF
CREATE USER printeasy WITH PASSWORD 'your_secure_password';
CREATE DATABASE printeasy_production OWNER printeasy;
GRANT ALL PRIVILEGES ON DATABASE printeasy_production TO printeasy;
ALTER USER printeasy CREATEDB;
\q
EOF
```

### 3. Application Deployment

```bash
# Clone your repository
git clone https://github.com/yourusername/printeasy-qr.git
cd printeasy-qr

# Install dependencies
npm install

# Install Puppeteer Chrome
npx puppeteer browsers install chrome

# Build the application
npm run build

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://printeasy:your_secure_password@localhost:5432/printeasy_production

# Admin credentials
ADMIN_EMAIL=its.harshthakar@gmail.com
ADMIN_PASSWORD=2004@Harsh

# Session configuration
SESSION_SECRET=your_very_long_random_session_secret_here

# Puppeteer configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Optional: Custom domain
CUSTOM_DOMAIN=yourdomain.com
EOF

# Run database migrations
npm run db:push

# Seed initial data (optional)
npm run seed
```

### 4. Process Management with PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'printeasy-qr',
    script: 'server/index.ts',
    interpreter: './node_modules/.bin/tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Nginx Configuration (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/printeasy-qr << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (add your certificates)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload limit
    client_max_body_size 500M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/printeasy-qr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
sudo crontab -l | grep -q certbot || echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Database Migration

### From Replit to Your Server

1. **Export data from Replit**:
```bash
# Connect to Replit database
pg_dump $DATABASE_URL > printeasy_backup.sql
```

2. **Import to your server**:
```bash
# On your server
psql -U printeasy -d printeasy_production < printeasy_backup.sql
```

### Alternative: Using Drizzle Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Environment Configuration

### Complete .env Example

```env
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://printeasy:your_secure_password@localhost:5432/printeasy_production

# Admin Credentials
ADMIN_EMAIL=its.harshthakar@gmail.com
ADMIN_PASSWORD=2004@Harsh

# Session
SESSION_SECRET=your_very_long_random_session_secret_minimum_32_characters

# Puppeteer
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Optional: Custom Domain
CUSTOM_DOMAIN=yourdomain.com
REPLIT_DOMAINS=yourdomain.com

# File Upload Limits
MAX_FILE_SIZE=524288000  # 500MB in bytes
MAX_FILES_PER_ORDER=100

# Security
BCRYPT_ROUNDS=12
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_orders_shop_id ON orders(shop_id);
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone);
CREATE INDEX CONCURRENTLY idx_shops_owner_id ON shops(owner_id);
CREATE INDEX CONCURRENTLY idx_shops_slug ON shops(slug);
```

### 2. Application Performance

```javascript
// Add to your production configuration
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    cluster.fork();
  });
} else {
  // Your app code here
}
```

### 3. Monitoring Setup

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:max_size 100M
```

## Troubleshooting

### Common Issues and Solutions

1. **QR Generation Fails**:
```bash
# Check Chrome installation
google-chrome --version
# Reinstall if needed
sudo apt install --reinstall google-chrome-stable
```

2. **Database Connection Issues**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Check connection
psql -U printeasy -d printeasy_production -c "SELECT 1"
```

3. **File Upload Issues**:
```bash
# Check disk space
df -h
# Check permissions
ls -la uploads/
sudo chown -R $USER:$USER uploads/
```

4. **Memory Issues**:
```javascript
// Add to your application
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### Log Monitoring

```bash
# View application logs
pm2 logs printeasy-qr

# View system logs
sudo journalctl -u nginx -f
tail -f /var/log/postgresql/postgresql-*.log
```

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall configured (UFW recommended)
- [ ] Database access restricted to localhost
- [ ] Strong passwords for all accounts
- [ ] Regular security updates applied
- [ ] File upload directory secured
- [ ] Session secrets are random and secure
- [ ] Admin credentials changed from defaults
- [ ] Backup strategy implemented

## Backup Strategy

```bash
# Daily database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U printeasy printeasy_production > /backups/printeasy_$DATE.sql
# Keep only last 30 days
find /backups -name "printeasy_*.sql" -mtime +30 -delete

# Add to crontab
echo "0 2 * * * /path/to/backup_script.sh" | crontab -
```

This guide provides everything you need to deploy PrintEasy QR on your own server while maintaining all data and functionality. The QR generation issue has been fixed with proper Puppeteer configuration for production environments.