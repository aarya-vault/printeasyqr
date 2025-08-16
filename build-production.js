#!/usr/bin/env node

// Production build script with better error handling
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Check if required files exist
const requiredFiles = [
  'vite.config.ts',
  'tailwind.config.ts',
  'tsconfig.json',
  'client/src/main.tsx',
  'client/index.html'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}

// Run Vite build
exec('npx vite build', { cwd: process.cwd() }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    console.error('STDOUT:', stdout);
    console.error('STDERR:', stderr);
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully');
  console.log(stdout);
  
  // Check if dist directory was created
  if (fs.existsSync('dist/client')) {
    console.log('✅ Build artifacts created in dist/client');
  } else {
    console.error('❌ Build artifacts not found in dist/client');
    process.exit(1);
  }
});