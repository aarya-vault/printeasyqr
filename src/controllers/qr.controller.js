import QRCode from 'qrcode';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

class QRController {
  // Generate QR code with professional design
  static async generateQR(req, res) {
    try {
      const { htmlContent, filename = 'PrintEasy_QR.jpg' } = req.body;

      if (!htmlContent) {
        return res.status(400).json({ message: 'htmlContent is required' });
      }

      // Launch Puppeteer-Core with @sparticuz/chromium for Netlify deployment
      const browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--hide-scrollbars',
          '--mute-audio'
        ],
        defaultViewport: { width: 400, height: 800 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
        timeout: 30000
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
          timeout: 25000
        });

        // Wait for fonts and external resources
        await page.evaluate(() => {
          return document.fonts.ready;
        });
        
        // Extended delay for complete CSS and font rendering (increased from 200ms to 2000ms)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Wait for all images to load (if any)
        await page.evaluate(() => {
          return Promise.all([...document.images].map(img => {
            if (img.complete) return;
            return new Promise(resolve => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            });
          }));
        });

        // Take screenshot of body
        const bodyHandle = await page.$('body');
        const screenshot = await bodyHandle.screenshot({
          type: 'jpeg',
          quality: 80,
          omitBackground: false
        });

        await browser.close();

        // Return image as base64 for JSON response
        const base64Image = screenshot.toString('base64');
        
        res.json({
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
      
      res.status(500).json({
        message: 'Failed to generate QR code',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Simple QR code generation
  static async generateSimpleQR(req, res) {
    try {
      const { url, size = 200 } = req.body;

      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Remove data URL prefix to get base64
      const base64Image = qrCodeDataUrl.split(',')[1];

      res.json({
        success: true,
        image: base64Image,
        dataUrl: qrCodeDataUrl
      });

    } catch (error) {
      console.error('Simple QR Generation Error:', error);
      res.status(500).json({
        message: 'Failed to generate QR code',
        error: error.message
      });
    }
  }
}

export default QRController;