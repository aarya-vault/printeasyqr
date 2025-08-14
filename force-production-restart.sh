#!/bin/bash

# Force production restart with new credentials
echo "=== FORCING PRODUCTION RESTART ==="
echo "This script will force the production deployment to use new credentials"

# Export the correct database credentials
export DATABASE_URL="postgresql://neondb_owner:npg_Di0XSQx1ONHM@ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
export PGHOST="ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech"
export PGUSER="neondb_owner"
export PGPASSWORD="npg_Di0XSQx1ONHM"
export PGDATABASE="neondb"
export NODE_ENV="production"

echo "✅ Environment variables set with correct credentials"
echo ""
echo "Starting production server with forced new credentials..."

# Build and start production
npm run build
npm run start:prod