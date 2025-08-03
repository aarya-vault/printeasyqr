/**
 * PrintEasy QR Generation Microservice
 * Optimized for Vercel serverless functions
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { htmlContent, filename = 'PrintEasy_QR.png' } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: 'htmlContent is required' });
    }

    const puppeteer = await import('puppeteer');

    // Vercel-optimized Puppeteer configuration
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-crash-upload',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text',
        '--disable-background-networking',
        '--hide-scrollbars',
        '--mute-audio'
      ],
      defaultViewport: { width: 400, height: 800 },
      timeout: 30000 // 30 seconds for Vercel function limits
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 3 });

      // Create full HTML with PrintEasy styling
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'golden-yellow': '#FFBF00',
                    'rich-black': '#000000'
                  }
                }
              }
            }
          </script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: 400px;
            }
          </style>
        </head>
        <body>${htmlContent}</body>
        </html>
      `;

      await page.setContent(fullHtml, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 25000 // Conservative timeout for Vercel
      });

      // Wait for fonts and external resources
      await page.evaluate(() => {
        return document.fonts.ready;
      });
      
      // Small delay for rendering
      await new Promise(resolve => setTimeout(resolve, 200));

      // Take screenshot of body
      const bodyHandle = await page.$('body');
      const screenshot = await bodyHandle.screenshot({
        type: 'png',
        omitBackground: false
      });

      await browser.close();

      // Return image as base64 for JSON response
      const base64Image = screenshot.toString('base64');
      
      return res.status(200).json({
        success: true,
        image: base64Image,
        filename: filename,
        size: screenshot.length
      });

    } catch (error) {
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('QR Generation Error:', error);
    
    return res.status(500).json({
      error: 'Failed to generate QR code',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}