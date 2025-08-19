#!/bin/bash

echo "🚀 Starting production build process..."

# Skip database migrations entirely
export DISABLE_DB_SYNC=true
export SKIP_MIGRATIONS=true
echo "✅ Database sync and migrations disabled"

# Build the frontend only
echo "📦 Building frontend assets..."
npm run build

# Verify build output
if [ -d "dist/client" ]; then
  echo "✅ Frontend build successful"
else
  echo "❌ Frontend build failed - dist/client not found"
  exit 1
fi

echo "✅ Production build complete!"
echo "⚠️  Note: Database schema must already exist in production"