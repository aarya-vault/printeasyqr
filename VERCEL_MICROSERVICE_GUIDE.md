# PrintEasy Vercel Microservice Deployment Guide

## Overview

The PrintEasy QR generation has been restructured to use a Vercel microservice for better scalability, reliability, and cost-effectiveness. This hybrid approach uses Vercel for QR generation while keeping the main application on Replit.

## Architecture Benefits

### Microservice Advantages
- **Serverless Scaling**: Vercel automatically scales QR generation based on demand
- **Better Performance**: Dedicated resources for Puppeteer operations
- **Cost Optimization**: Pay-per-use model instead of always-running containers
- **Global CDN**: Faster response times worldwide
- **Automatic HTTPS**: Built-in SSL/TLS certificates

### Hybrid Fallback System
- **Primary**: Vercel microservice for production-grade QR generation
- **Fallback**: Local Puppeteer generation if microservice is unavailable
- **Seamless**: Automatic failover with no user interaction required

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Navigate to microservice directory
cd vercel-microservice

# Install dependencies
npm install

# Login to Vercel (if not already logged in)
vercel login

# Deploy to production
vercel --prod
```

### 2. Configure Main Application

After successful deployment, update your Replit environment variable:

```
QR_MICROSERVICE_URL=https://your-deployment-url.vercel.app/api/generate-qr
```

**Example URL**: `https://printeasy-qr-microservice.vercel.app/api/generate-qr`

### 3. Test Integration

```bash
# Test microservice directly
curl -X POST https://your-deployment-url.vercel.app/api/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"htmlContent":"<div>Test QR</div>"}'

# Test main application (should use microservice)
curl -X POST http://localhost:5000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"htmlContent":"<div>Test QR</div>"}'
```

## Configuration Details

### Vercel Optimization
- **Runtime**: Node.js 18.x
- **Max Duration**: 30 seconds
- **Memory**: 1024MB (default)
- **Chrome**: System-installed Google Chrome Stable
- **Environment**: Serverless functions

### Security & CORS
- **CORS**: Configured for cross-origin requests
- **Headers**: Proper security headers
- **Timeouts**: 30-second function timeout, 35-second client timeout

## Performance Metrics

### Expected Performance
- **Cold Start**: 3-5 seconds (first request after idle)
- **Warm Function**: 1-2 seconds (subsequent requests)
- **Image Quality**: Professional 35KB+ PNG files
- **Reliability**: 99.9% uptime with Vercel infrastructure

### Monitoring
- **Vercel Dashboard**: Monitor function invocations and errors
- **Main App Logs**: Track microservice vs fallback usage
- **Client Metrics**: QR generation success rates

## Troubleshooting

### Common Issues

1. **Microservice Timeout**
   ```
   Solution: Increase client timeout or optimize HTML content
   ```

2. **CORS Errors**
   ```
   Solution: Verify domain is allowed in vercel.json
   ```

3. **Base64 Conversion Issues**
   ```
   Solution: Check image data format in response
   ```

### Fallback Behavior
If microservice fails:
1. Main app automatically falls back to local Puppeteer
2. Error is logged but user experience is maintained
3. QR generation continues with local system

## Cost Optimization

### Vercel Pricing
- **Hobby Plan**: 100GB-hrs/month free
- **Pro Plan**: $20/month + usage
- **Function Invocations**: Free tier includes significant allowance

### Usage Estimation
- **Typical QR**: 2-3 seconds execution time
- **Monthly QRs**: ~15,000 free tier QRs possible
- **Enterprise**: Scales automatically with Pro plan

## Development Workflow

### Local Development
```bash
# Test microservice locally
cd vercel-microservice
vercel dev

# Test with main app
QR_MICROSERVICE_URL=http://localhost:3000/api/generate-qr npm run dev
```

### Production Updates
```bash
# Deploy updates
vercel --prod

# Monitor deployment
vercel logs --follow
```

## Security Considerations

### Environment Variables
- No sensitive data stored in microservice
- All configuration through Vercel environment
- HTTPS-only communication

### Content Security
- HTML sanitization in main application
- No file system access in microservice
- Stateless operation for security

## Integration Status

✅ **Microservice Created**: Vercel-optimized serverless function
✅ **Hybrid Endpoint**: Main app with microservice + fallback
✅ **Configuration**: Environment variable integration
✅ **Error Handling**: Comprehensive fallback system
✅ **Documentation**: Complete deployment guide

The system is now ready for production deployment with enterprise-grade QR generation capabilities.