// PM2 Ecosystem Configuration for PrintEasy QR
// Production deployment with frontend (port 3000) and backend (port 5000)

module.exports = {
  apps: [
    {
      name: 'printeasy-backend',
      script: 'production-start.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Auto-restart configuration
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: './logs/backend.log',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Health monitoring
      health_check_http: {
        path: '/api/health',
        port: 5000,
        interval: 30000,
        timeout: 5000
      }
    },
    {
      name: 'printeasy-frontend',
      script: 'npx',
      args: 'serve -s dist/client -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',  
        PORT: 3000
      },
      
      // Auto-restart configuration
      restart_delay: 2000,
      max_restarts: 5,
      min_uptime: '5s',
      
      // Logging
      log_file: './logs/frontend.log',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      
      // Memory limits
      max_memory_restart: '500M'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo',
      path: '/var/www/printeasy-qr',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};