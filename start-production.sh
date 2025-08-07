#!/bin/bash

echo "🚀 PrintEasy QR - Production Server"
echo "===================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Use production package.json if exists
if [ -f "package-production.json" ]; then
    echo "📦 Using production configuration"
    cp package-production.json package.json.backup 2>/dev/null
    cp package.json package.json.original 2>/dev/null
    cp package-production.json package.json
fi

# Start unified server
echo "🔧 Starting unified CommonJS server..."
echo ""

node server/start-unified.cjs

# Restore original package.json on exit
if [ -f "package.json.original" ]; then
    cp package.json.original package.json
    rm package.json.original
fi
