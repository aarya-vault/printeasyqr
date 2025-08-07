#!/bin/bash

echo "🚀 PrintEasy - Clean Development Startup"
echo "======================================="

# Clean any existing processes
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 1

# Environment setup
export NODE_ENV=development

# Start clean server
echo "🔥 Starting PrintEasy on http://localhost:5000"
echo "📦 Pure Sequelize system (no Drizzle conflicts)"
echo ""

node -r tsx/esm server/index-fixed.ts
