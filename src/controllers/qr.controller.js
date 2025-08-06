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

        // Create full HTML with comprehensive PrintEasy styling
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
                      'brand-yellow': '#FFBF00',
                      'golden-yellow': '#FFBF00',
                      'rich-black': '#000000'
                    }
                  }
                }
              }
            </script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              * {
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                width: 400px;
                background: #ffffff;
                line-height: 1.4;
              }
              
              /* Ensure all Tailwind classes work */
              .bg-\\[\\#FFBF00\\] { background-color: #FFBF00 !important; }
              .text-black { color: #000000 !important; }
              .text-white { color: #ffffff !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-gray-700 { color: #374151 !important; }
              .font-bold { font-weight: 700 !important; }
              .font-semibold { font-weight: 600 !important; }
              .font-medium { font-weight: 500 !important; }
              .text-xs { font-size: 0.75rem !important; }
              .text-sm { font-size: 0.875rem !important; }
              .text-base { font-size: 1rem !important; }
              .text-lg { font-size: 1.125rem !important; }
              .text-xl { font-size: 1.25rem !important; }
              .text-2xl { font-size: 1.5rem !important; }
              .text-3xl { font-size: 1.875rem !important; }
              .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
              .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
              .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
              .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
              .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
              .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
              .py-6 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
              .p-4 { padding: 1rem !important; }
              .p-6 { padding: 1.5rem !important; }
              .mt-2 { margin-top: 0.5rem !important; }
              .mt-3 { margin-top: 0.75rem !important; }
              .mt-4 { margin-top: 1rem !important; }
              .mb-2 { margin-bottom: 0.5rem !important; }
              .mb-3 { margin-bottom: 0.75rem !important; }
              .mb-4 { margin-bottom: 1rem !important; }
              .mx-auto { margin-left: auto !important; margin-right: auto !important; }
              .text-center { text-align: center !important; }
              .flex { display: flex !important; }
              .items-center { align-items: center !important; }
              .justify-center { justify-content: center !important; }
              .gap-2 { gap: 0.5rem !important; }
              .gap-3 { gap: 0.75rem !important; }
              .rounded-lg { border-radius: 0.5rem !important; }
              .rounded-full { border-radius: 9999px !important; }
              .border { border-width: 1px !important; }
              .border-gray-200 { border-color: #e5e7eb !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-white { background-color: #ffffff !important; }
              .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }
              .opacity-80 { opacity: 0.8 !important; }
            </style>
          </head>
          <body>${htmlContent}</body>
          </html>
        `;

        await page.setContent(fullHtml, { 
          waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
          timeout: 30000
        });

        // Wait for all external resources to load completely
        await page.evaluate(() => {
          return Promise.all([
            document.fonts.ready,
            new Promise(resolve => {
              if (document.readyState === 'complete') {
                resolve();
              } else {
                window.addEventListener('load', resolve);
              }
            })
          ]);
        });
        
        // Extended delay for complete CSS, font, and Tailwind rendering
        await new Promise(resolve => setTimeout(resolve, 3000));
        
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