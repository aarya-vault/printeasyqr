/**
 * Lightweight QR Controller - No Puppeteer Dependencies
 * Uses only the qrcode library for QR generation without any heavy browser dependencies
 */

import QRCode from 'qrcode';

class QRLightweightController {
  /**
   * Generate QR code without Puppeteer - Production optimized
   */
  static async generateQR(req, res) {
    try {
      const { shopSlug, shopName } = req.body;
      
      // Generate filename
      const fileName = shopSlug ? 
        `PrintEasy_${shopName?.replace(/\s+/g, '_') || shopSlug}_QR.png` : 
        'PrintEasy_QR.png';
      
      // Generate QR URL
      const qrUrl = shopSlug ? 
        `https://printeasy.com/shop/${shopSlug}` : 
        'https://printeasy.com';
      
      console.log('🔷 Generating lightweight QR for:', qrUrl);
      
      // Generate high-quality QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(qrUrl, {
        width: 800,
        margin: 2,
        color: { 
          dark: '#000000', 
          light: '#FFFFFF' 
        },
        errorCorrectionLevel: 'H',
        type: 'png'
      });
      
      // Send as downloadable PNG
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', qrBuffer.length);
      
      return res.send(qrBuffer);
      
    } catch (error) {
      console.error('❌ QR generation error:', error);
      return res.status(500).json({ 
        message: 'Failed to generate QR code',
        error: error.message 
      });
    }
  }

  /**
   * Generate simple QR code
   */
  static async generateSimpleQR(req, res) {
    return QRLightweightController.generateQR(req, res);
  }
}

export default QRLightweightController;