# PrintEasy QR - Nginx Deployment Guide

## Overview
This guide helps you deploy PrintEasy QR with Nginx as reverse proxy:
- **Frontend**: React app running on port 3000
- **Backend**: Node.js API server running on port 5000
- **Nginx**: Routes traffic and provides caching, security, compression

## Prerequisites
- Ubuntu/Debian server with root access
- Node.js and npm installed
- Your PrintEasy QR project deployed

## Step 1: Install Nginx

```bash
# Update system packages
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx
```

## Step 2: Configure Nginx

```bash
# Backup default config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new config for PrintEasy QR
sudo nano /etc/nginx/sites-available/printeasy-qr
```

Copy the contents of `nginx.conf` to this file, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/printeasy-qr /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx if test passes
sudo systemctl reload nginx
```

## Step 3: Update Domain Configuration

Edit your nginx config file:

```bash
sudo nano /etc/nginx/sites-available/printeasy-qr
```

Replace `your-domain.com` with your actual domain name.

## Step 4: Start Your Applications

**Terminal 1 - Backend (Port 5000):**
```bash
cd /path/to/your/printeasy-qr
node production-start.js
# Should show: Server running on port 5000
```

**Terminal 2 - Frontend (Port 3000):**
```bash
cd /path/to/your/printeasy-qr
npm run build  # Build React app
npx serve -s dist/client -p 3000
# Or use your preferred static file server
```

## Step 5: Test Configuration

```bash
# Test API endpoint
curl http://your-domain.com/api/health

# Test frontend
curl http://your-domain.com/

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 6: Process Management (PM2 Recommended)

Install PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'printeasy-backend',
      script: 'production-start.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'printeasy-frontend',
      script: 'npx',
      args: 'serve -s dist/client -p 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 7: SSL Certificate (Optional but Recommended)

### Using Let's Encrypt (Free):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### After SSL Setup:
Uncomment the SSL server blocks in your nginx config and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: Monitoring and Maintenance

```bash
# Monitor PM2 processes
pm2 status
pm2 logs

# Monitor Nginx
sudo systemctl status nginx

# Check disk space
df -h

# Check memory usage
free -m

# Restart services if needed
pm2 restart all
sudo systemctl restart nginx
```

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway**
   ```bash
   # Check if backend is running
   curl http://127.0.0.1:5000/api/health
   
   # Check PM2 status
   pm2 status
   
   # Check Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Static Files Not Loading**
   ```bash
   # Verify frontend is running
   curl http://127.0.0.1:3000
   
   # Check build directory
   ls -la dist/client/
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Test WebSocket endpoint
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://your-domain.com/ws
   ```

4. **File Upload Issues**
   ```bash
   # Check client_max_body_size in nginx config
   sudo nginx -t
   
   # Test with small file first
   curl -X POST -F "file=@small-test-file.txt" http://your-domain.com/api/upload
   ```

## Performance Optimization

```bash
# Check Nginx worker processes
grep worker_processes /etc/nginx/nginx.conf

# Monitor server resources
htop
iostat 1

# Optimize PM2 clustering
pm2 start production-start.js -i max  # Use all CPU cores
```

## Security Checklist

- [ ] Firewall configured (UFW recommended)
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups scheduled
- [ ] Server updates automated

## Final URLs

After setup, your application will be accessible at:
- **Production Site**: http://your-domain.com (or https://)
- **API Health Check**: http://your-domain.com/api/health
- **Admin Dashboard**: http://your-domain.com/admin
- **Shop Login**: http://your-domain.com/shop-login

Your PrintEasy QR application is now production-ready with Nginx!