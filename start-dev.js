import { spawn } from 'child_process';

// Start the unified server directly
console.log('🚀 Starting PrintEasy unified development server...');

const server = spawn('npx', ['tsx', 'server/index-unified.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: '3001' }
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  server.kill('SIGINT');
  process.exit(0);
});