# Production QR Generation Fix

## Issue
QR generation fails in production with 500 error: `Error: Could not find Chrome`

## Quick Fix for Replit Deployment

### 1. Add Chrome Installation Command
Run this command in your Replit Shell before deployment:
```bash
npx puppeteer browsers install chrome
```

### 2. Environment Variables
Add these to your Replit Secrets:
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 3. Manual Package.json Update
Add this to your scripts section in package.json:
```json
"postinstall": "npx puppeteer browsers install chrome || echo 'Chrome installation failed, continuing...'"
```

## Alternative: Simple HTML2Canvas Solution

If Puppeteer continues to fail, here's a client-side only solution that works in all environments:

### Replace Server-Side QR Generation
Update `client/src/components/professional-qr-modal.tsx`:

```javascript
// Replace the handleDownload function with this:
const handleDownload = async () => {
  try {
    // Use html2canvas to capture the QR directly in browser
    const html2canvas = (await import('html2canvas')).default;
    
    const element = qrRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 3,
      backgroundColor: '#ffffff',
      width: 400,
      height: 800
    });

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      toast({
        title: "QR Code Downloaded",
        description: "High-quality PNG saved to your device",
      });
    }, 'image/png', 0.95);

  } catch (error) {
    console.error('Error downloading QR code:', error);
    toast({
      title: "Download Failed", 
      description: "Please try again",
      variant: "destructive",
    });
  }
};
```

## Recommended: Hybrid Approach

Keep server-side generation as primary, fallback to client-side:

```javascript
const handleDownload = async () => {
  try {
    // Try server-side generation first
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent: renderedHtml,
        filename: `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`
      }),
    });

    if (response.ok) {
      // Server-side worked, download the blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('Server generation failed');
    }

  } catch (error) {
    console.log('Server generation failed, using client-side fallback');
    
    // Fallback to client-side generation
    const html2canvas = (await import('html2canvas')).default;
    const element = qrRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 3,
      backgroundColor: '#ffffff',
      width: 400,
      height: 800
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 'image/png', 0.95);
  }

  toast({
    title: "QR Code Downloaded",
    description: "High-quality PNG saved to your device",
  });
};
```

## Production Deployment Checklist

1. ✅ Fixed Puppeteer configuration (completed)
2. ✅ Added production Chrome arguments (completed)  
3. ✅ Increased timeout to 90 seconds (completed)
4. ⚠️ Install Chrome: `npx puppeteer browsers install chrome`
5. ⚠️ Add environment variables to deployment
6. ⚠️ Optional: Add postinstall script to package.json

The server-side fixes are already implemented. You just need to ensure Chrome is installed in your production environment.