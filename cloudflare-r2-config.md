# Cloudflare R2 Configuration Guide

## 1. CORS Policy Configuration (PRIORITY 1)

Go to Cloudflare Dashboard > R2 > Object Storage > Your Bucket > Settings > CORS Policy

Add this CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://printeasyqr.com",
      "https://www.printeasyqr.com",
      "https://*.replit.app",
      "https://*.replit.dev", 
      "http://localhost:5000",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST", 
      "DELETE",
      "HEAD",
      "OPTIONS"
    ],
    "AllowedHeaders": [
      "*",
      "Content-Type",
      "Content-Length",
      "Authorization",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-user-agent"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "x-amz-server-side-encryption",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## 2. Lifecycle Rules Configuration (PRIORITY 2)

Go to Cloudflare Dashboard > R2 > Object Storage > Your Bucket > Settings > Lifecycle Rules

### Rule 1: Auto-delete completed order files
```json
{
  "id": "delete-completed-orders",
  "status": "Enabled",
  "filter": {
    "prefix": "orders/"
  },
  "expiration": {
    "days": 7
  }
}
```

### Rule 2: Cleanup incomplete multipart uploads
```json
{
  "id": "cleanup-incomplete-uploads",
  "status": "Enabled", 
  "filter": {
    "prefix": "orders/"
  },
  "abort_incomplete_multipart_upload": {
    "days_after_initiation": 1
  }
}
```

## 3. Bucket Settings

### Public Access
- **Public Access**: Disabled (we use presigned URLs for security)
- **Block Public Access**: Enabled
- **Block Public ACLs**: Enabled

### Custom Domain (Optional)
- You can set up a custom domain for CDN delivery
- Example: `files.printeasyqr.com` → Your R2 bucket

## 4. Verification Commands

After applying these configurations, test with:

```bash
# Test R2 health
curl -X GET http://localhost:5000/api/health

# Test storage manager
node -e "import('./server/storage/storageManager.js').then(m => m.default.initialize().then(result => console.log('R2 Available:', result)))"

# Test presigned URL generation (with valid auth token)
curl -X POST http://localhost:5000/api/orders/upload-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.pdf","mimetype":"application/pdf","orderId":"1"}'
```

## Key Benefits of This Configuration:

1. **CORS Policy**:
   - Enables direct browser uploads to R2
   - Supports all deployment environments (local, Replit, production)
   - Prevents CORS blocking for presigned URLs
   - Exposes necessary headers for file operations

2. **Lifecycle Rules**:
   - Automatic cleanup after 7 days saves storage costs
   - Removes incomplete uploads within 24 hours
   - Prevents storage bloat from failed uploads

3. **Security**:
   - Public access disabled - only presigned URLs work
   - Controlled origins prevent unauthorized access
   - Headers properly configured for S3-compatible operations

## Status Check:
- ✅ R2 Client: Initialized with bucket `printeasy-qr`
- ✅ Storage Manager: Hybrid system active
- ⏳ CORS Policy: Apply the configuration above
- ⏳ Lifecycle Rules: Apply the rules above

Once these are configured in your Cloudflare dashboard, your R2 storage will be fully operational for PrintEasy QR.