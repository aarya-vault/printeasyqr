#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 Building PrintEasy QR for production...');

try {
  // Build the client
  console.log('📦 Building client application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Ensure dist/client directory exists
  const distClientDir = 'dist/client';
  if (!existsSync(distClientDir)) {
    mkdirSync(distClientDir, { recursive: true });
  }

  // Copy critical files to build output
  console.log('📋 Copying critical files...');
  
  // Copy _redirects file
  if (existsSync('_redirects')) {
    copyFileSync('_redirects', join(distClientDir, '_redirects'));
    console.log('✅ Copied _redirects');
  }

  // Copy favicon and SEO images from public directory
  const publicFiles = [
    'favicon.png',
    'favicon-16x16.png', 
    'favicon-32x32.png',
    'favicon.ico',
    'og-image.png',
    'manifest.json',
    'sitemap.xml'
  ];

  publicFiles.forEach(file => {
    const sourcePath = join('public', file);
    const destPath = join(distClientDir, file);
    
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file}`);
    } else {
      console.log(`⚠️  Warning: ${file} not found in public directory`);
    }
  });

  console.log('🎉 Production build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}