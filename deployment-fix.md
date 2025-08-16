# Deployment Timeout Fix for PrintEasy QR

## Problem Analysis
The deployment is timing out at the "Pushing nix-0 layer..." step because:
1. Nix layers are uncached ("Nix layers for this Repl are uncached")
2. The deployment has to rebuild system dependencies from scratch
3. @sparticuz/chromium (66MB) requires system-level dependencies that take time to build

## The Real Issue
- The build itself completes in 8 seconds ✅
- The timeout happens during Nix layer creation (system dependencies)
- This happens when cache is invalidated or first deployment

## Solutions

### Solution 1: Move Chromium to Optional Dependency
Make chromium load only when actually needed, not during build:

```javascript
// In package.json, move @sparticuz/chromium to optionalDependencies
"optionalDependencies": {
  "@sparticuz/chromium": "^138.0.2"
}
```

### Solution 2: Use Replit's Built-in Chromium
Replit environments often have Chromium pre-installed. Try using system chromium:

```javascript
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser', // Use system chromium
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true
});
```

### Solution 3: Implement Server-Side Caching
Cache generated QR codes to reduce Puppeteer calls:

```javascript
const qrCache = new Map();

function getCachedQR(shopSlug) {
  const cached = qrCache.get(shopSlug);
  if (cached && Date.now() - cached.timestamp < 86400000) { // 24 hours
    return cached.data;
  }
  return null;
}
```

### Solution 4: Build Optimization
Optimize the build process:

1. Add .npmrc file:
```
# .npmrc
omit=dev
legacy-peer-deps=true
```

2. Update build script to skip unnecessary steps:
```json
"build": "NODE_ENV=production vite build --mode production"
```

### Solution 5: Two-Stage Deployment
Split heavy dependencies into a separate service:

1. Main app without Puppeteer (fast deployment)
2. QR generation microservice (deployed separately)

## Immediate Fix to Try

The fastest solution is to make chromium optional and add fallback:

```javascript
// QR controller with fallback
let chromium;
try {
  chromium = await import('@sparticuz/chromium');
} catch (e) {
  console.log('Using system chromium');
  // Fallback to system chromium or lightweight QR
}
```

## Why It Worked Before
- Nix layers were cached
- Cache can expire or be invalidated by:
  - Package updates
  - Replit platform changes
  - First deployment to new instance

## Recommended Approach
1. Keep Puppeteer-core (it's lightweight)
2. Make @sparticuz/chromium optional
3. Implement caching for generated QRs
4. Use system chromium when available