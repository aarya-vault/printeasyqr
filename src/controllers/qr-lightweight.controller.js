import QRCode from 'qrcode';

// Lightweight QR controller without Puppeteer for faster deployments
class QRLightweightController {
  // Generate QR code as base64 image without Puppeteer
  static async generateQR(req, res) {
    try {
      const { shopSlug, shopName, htmlContent, filename } = req.body;

      // Support both new API (shopSlug/shopName) and legacy (htmlContent)
      if (!shopSlug && !shopName && !htmlContent) {
        return res.status(400).json({ 
          message: 'Either shopSlug and shopName, or htmlContent is required' 
        });
      }

      let finalFilename = filename || 'PrintEasy_QR.png';
      let qrUrl = '';
      
      if (shopSlug && shopName) {
        finalFilename = `PrintEasy_${shopName.replace(/\s+/g, '_')}_QR.png`;
        qrUrl = `https://printeasy.com/shop/${shopSlug}`;
      } else if (htmlContent) {
        // For legacy support - extract URL from HTML if possible
        const urlMatch = htmlContent.match(/https:\/\/[^\s'"]+/);
        qrUrl = urlMatch ? urlMatch[0] : 'https://printeasy.com';
      }

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      // Convert data URL to buffer
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Send as image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.send(buffer);
      
    } catch (error) {
      console.error('QR generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate QR code',
        error: error.message 
      });
    }
  }

  // Generate QR data URL for embedding
  static async generateQRDataURL(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      res.json({ 
        success: true,
        dataUrl: qrDataUrl 
      });
      
    } catch (error) {
      console.error('QR generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate QR code',
        error: error.message 
      });
    }
  }
}

export default QRLightweightController;