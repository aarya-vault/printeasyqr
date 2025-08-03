# PrintEasy QR Generation Microservice

A Vercel-optimized serverless function for generating high-quality QR code images using Puppeteer.

## Deployment to Vercel

### 1. Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account linked: `vercel login`

### 2. Deploy Steps
```bash
cd vercel-microservice
npm install
vercel --prod
```

### 3. Environment Configuration
The microservice is pre-configured for Vercel's Chrome installation:
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

### 4. API Endpoint
After deployment, you'll get a URL like:
```
https://printeasy-qr-microservice.vercel.app/api/generate-qr
```

## Usage

### Request Format
```javascript
POST /api/generate-qr
Content-Type: application/json

{
  "htmlContent": "<div>Your QR content HTML</div>",
  "filename": "optional-filename.png"
}
```

### Response Format
```javascript
{
  "success": true,
  "image": "base64-encoded-png-data",
  "filename": "PrintEasy_QR.png",
  "size": 35672
}
```

## Performance
- **Cold Start**: ~3-5 seconds
- **Warm Function**: ~1-2 seconds  
- **Max Duration**: 30 seconds (Vercel limit)
- **Memory**: Optimized for 1024MB functions

## Integration with Main App
Update your main application's environment variable:
```
QR_MICROSERVICE_URL=https://your-deployment.vercel.app/api/generate-qr
```

The main app will automatically use this microservice instead of local Puppeteer.