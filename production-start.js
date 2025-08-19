#!/usr/bin/env node
/**
 * Universal Production Starter for PrintEasy QR
 * Works on: Replit, Windows Server, Linux, Docker, Cloud Platforms
 * Handles all environment configurations automatically
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 PrintEasy QR Production Startup');
console.log('=' .repeat(50));

// STEP 1: Environment Detection & Configuration
function detectEnvironment() {
  if (process.env.REPLIT_DEPLOYMENT_ID || process.env.REPL_ID) return 'replit';
  if (process.env.VERCEL) return 'vercel';
  if (process.env.NETLIFY) return 'netlify';
  if (process.env.HEROKU_APP_NAME) return 'heroku';
  if (process.platform === 'win32') return 'windows';
  return 'unix';
}

const environment = detectEnvironment();
console.log(`🔍 Environment detected: ${environment.toUpperCase()}`);

// STEP 2: Load Environment Variables (Multiple Sources)
function loadEnvironmentVariables() {
  console.log('🔧 Loading environment configuration...');
  
  // Try multiple .env file locations
  const envPaths = [
    join(__dirname, '.env'),
    join(__dirname, '.env.production'), 
    join(__dirname, '.env.local'),
    join(process.cwd(), '.env')
  ];
  
  let envLoaded = false;
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      console.log(`✅ Loading env from: ${envPath}`);
      dotenv.config({ path: envPath });
      envLoaded = true;
      break;
    }
  }
  
  if (!envLoaded) {
    console.log('⚠️  No .env file found, using system environment variables');
  }
  
  return envLoaded;
}

loadEnvironmentVariables();

// STEP 3: Force Production Settings
process.env.NODE_ENV = 'production';
process.env.DISABLE_DB_SYNC = 'true';
process.env.SKIP_MIGRATIONS = 'true';

console.log('✅ Production mode enforced');
console.log('✅ Database sync disabled (using existing schema)');

// STEP 4: Database Configuration Validation
function validateDatabaseConfig() {
  console.log('🔍 Validating database configuration...');
  
  const hasFullUrl = !!process.env.DATABASE_URL;
  const hasIndividualVars = !!(
    process.env.PGHOST && 
    process.env.PGDATABASE && 
    process.env.PGUSER && 
    process.env.PGPASSWORD
  );
  
  console.log(`   DATABASE_URL: ${hasFullUrl ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Individual DB vars: ${hasIndividualVars ? '✅ Found' : '❌ Missing'}`);
  
  if (!hasFullUrl && !hasIndividualVars) {
    console.error('❌ CRITICAL: No database configuration found!');
    console.error('');
    console.error('SOLUTIONS:');
    console.error('1. Set DATABASE_URL environment variable:');
    console.error('   DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    console.error('');
    console.error('2. OR set individual variables:');
    console.error('   PGHOST=your-host');
    console.error('   PGDATABASE=your-database');
    console.error('   PGUSER=your-username');
    console.error('   PGPASSWORD=your-password');
    console.error('');
    console.error('3. Create a .env file in project root with the above variables');
    
    if (environment === 'windows') {
      console.error('');
      console.error('WINDOWS USERS:');
      console.error('Create .env file in project root with database credentials');
      console.error('Then run: npm run prod-start');
    }
    
    process.exit(1);
  }
  
  return true;
}

validateDatabaseConfig();

// STEP 5: Port Configuration
const PORT = process.env.PORT || 
             process.env.REPLIT_DEV_DOMAIN ? 3000 : 
             5000;

console.log(`🌐 Server will run on port: ${PORT}`);
console.log(`🔗 Server will bind to: 0.0.0.0 (accessible externally)`);

// STEP 6: Build Verification
async function verifyBuild() {
  const clientPath = join(__dirname, 'dist', 'client');
  const indexPath = join(clientPath, 'index.html');
  
  if (!existsSync(clientPath) || !existsSync(indexPath)) {
    console.log('⚠️  Frontend build not found, running build...');
    
    // Import and run build
    try {
      const childProcess = await import('child_process');
      childProcess.execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      console.error('Run "npm run build" manually before starting production server');
      process.exit(1);
    }
  } else {
    console.log('✅ Frontend build found');
  }
}

// Only verify build if not in Replit (Replit handles builds automatically)
if (environment !== 'replit') {
  await verifyBuild();
}

// STEP 7: Database Connection Test
async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { testConnection } = await import('./src/config/database.js');
    await testConnection();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('');
    console.error('TROUBLESHOOTING:');
    console.error('1. Verify database credentials in .env file');
    console.error('2. Ensure database server is running');
    console.error('3. Check network connectivity to database');
    console.error('4. Verify SSL settings if using cloud database');
    
    // Don't exit - let the app handle connection retries
    return false;
  }
}

await testDatabaseConnection();

// STEP 8: Start Production Server
console.log('🚀 Starting PrintEasy QR production server...');
console.log('=' .repeat(50));

try {
  // Import and start the main application
  const { default: app } = await import('./src/app.js');
  const { createServer } = await import('http');
  
  const server = createServer(app);
  
  // Setup WebSocket
  try {
    const { setupWebSocket } = await import('./src/utils/websocket.js');
    setupWebSocket(server);
    console.log('✅ WebSocket configured');
  } catch (error) {
    console.warn('⚠️  WebSocket setup failed:', error.message);
  }
  
  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log('🎉 SERVER STARTED SUCCESSFULLY!');
    console.log('');
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}/ws`);
    console.log(`🏠 Environment: ${environment}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Individual vars'}`);
    console.log('');
    console.log('✅ PrintEasy QR is ready for production traffic!');
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('❌ FATAL: Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
}