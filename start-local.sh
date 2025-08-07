#!/bin/bash

echo "🚀 PrintEasy QR - Local Development Startup"
echo "==========================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "node.*simple-dev" 2>/dev/null || true
sleep 2

# Set environment
export NODE_ENV=development
export DATABASE_URL="postgresql://neondb_owner:npg_JYU5CrLBeod4@ep-calm-bush-a57zaqqb.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "📋 Environment: $NODE_ENV"
echo "🗄️  Database: Connected"

# Start simple development server
echo ""
echo "🔥 Starting PrintEasy on http://localhost:3000"
echo "   📱 Frontend: http://localhost:3000"
echo "   🔌 API: http://localhost:3000/api/*"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="

node server/simple-dev.js