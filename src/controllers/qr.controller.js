import QRCode from 'qrcode';
import puppeteer from 'puppeteer';

class QRController {
  // Generate QR code with professional design
  static async generateQR(req, res) {
    try {
      const { htmlContent, filename = 'PrintEasy_QR.jpg' } = req.body;

      if (!htmlContent) {
        return res.status(400).json({ message: 'htmlContent is required' });
      }

      // Launch Puppeteer with optimized settings for Netlify
      const browser = await puppeteer.launch({
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
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--hide-scrollbars',
          '--mute-audio'
        ],
        defaultViewport: { width: 400, height: 800 },
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
        
        // Small delay for rendering
        await new Promise(resolve => setTimeout(resolve, 200));

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