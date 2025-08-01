import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface QRModalProps {
  shop: {
    id: number;
    name: string;
    phone: string;
    slug: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function CanvasQRModal({ shop, isOpen, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const { toast } = useToast();

  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, shopUrl]);

  const generateQRCode = async () => {
    try {
      console.log('Generating QR code for:', shopUrl);
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      console.log('QR code generated successfully');
      setQrDataUrl(qrCodeDataUrl);
      
      // Pass the QR data directly to avoid state update delay
      setTimeout(() => {
        console.log('Starting to draw full design');
        drawFullDesign(qrCodeDataUrl);
      }, 100);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const drawFullDesign = async (qrData?: string) => {
    const canvas = canvasRef.current;
    const qrToUse = qrData || qrDataUrl;
    if (!canvas || !qrToUse) {
      console.log('Canvas or QR data not ready:', { canvas: !!canvas, qrDataUrl: !!qrToUse });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context');
      return;
    }

    console.log('Drawing on canvas...');

    // Set canvas size for A4 proportions (high quality)
    canvas.width = 800;
    canvas.height = 1130; // A4 ratio

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yellow header section
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(0, 0, canvas.width, 300);

    // Black square with "P" logo (like in screenshot)
    ctx.fillStyle = '#000000';
    const squareSize = 80;
    const squareX = (canvas.width - squareSize) / 2;
    ctx.fillRect(squareX, 40, squareSize, squareSize);

    // "P" letter in yellow
    ctx.fillStyle = '#FFBF00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('P', 400, 95);

    // Shop name (on yellow background)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(shop.name, 400, 170);

    // PrintEasy QR text with QR icon
    ctx.font = '24px Arial';
    ctx.fillText('🔲 PrintEasy QR', 400, 210);

    // Verified badge - show for all shops as "VERIFIED"
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(540, 40, 120, 32);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(540, 40, 120, 32);
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.fillText('✓ VERIFIED', 600, 60);

    // Set initial preview with basic content
    setPreviewDataUrl(canvas.toDataURL());
    console.log('Set initial preview');

    // QR Code section (white background)
    const qrImg = new Image();
    qrImg.onload = () => {
      console.log('QR image loaded, adding to canvas');
      
      // White section for QR code
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 300, canvas.width, 400);
      
      // QR code container (centered)
      const qrSize = 300;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX, 340, qrSize, qrSize);
      
      // QR code
      ctx.drawImage(qrImg, qrX, 340, qrSize, qrSize);
      
      // Shop Contact heading
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Shop Contact', 400, 690);
      
      // Phone number with icon
      ctx.font = '20px Arial';
      ctx.fillText(`📞 ${shop.phone}`, 400, 720);

      // Customer Guide section
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 750, canvas.width, 250);
      
      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Customer Guide', 400, 790);

      // Custom guide text as requested
      ctx.font = '17px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      
      const guideLines = [
        'Scan this QR via your phone camera or visit',
        'printeasyqr.com website and scan it.',
        '',
        'Enter your name & number, upload your file',
        'or create a walk-in order for tracking.',
        '',
        'Voilà! Explore dashboard, chat with shop owner.',
        'Uploaded files are auto-deleted on completion.',
        '',
        'Trust PrintEasy for secure printing!'
      ];

      let yPos = 820;
      guideLines.forEach((line) => {
        if (line === '') {
          yPos += 10; // Space between paragraphs
        } else {
          ctx.fillText(line, 400, yPos);
          yPos += 22;
        }
      });

      // Footer section (black background)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, canvas.height - 130, canvas.width, 130);

      // P logo in yellow circle
      ctx.fillStyle = '#FFBF00';
      ctx.beginPath();
      ctx.arc(350, canvas.height - 80, 20, 0, 2 * Math.PI);
      ctx.fill();

      // P letter
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('P', 350, canvas.height - 72);

      // PrintEasy text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('PrintEasy', 380, canvas.height - 72);

      // Feature tags
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⭕ Secure   ⭐ Fast   ☐ Easy', 400, canvas.height - 40);

      // Website URL 
      ctx.fillStyle = '#FFBF00';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('https://printeasyqr.com', 400, canvas.height - 15);

      // Set final preview
      setPreviewDataUrl(canvas.toDataURL());
      console.log('Final preview set with QR code and all content');
    };
    qrImg.onerror = () => {
      console.error('Failed to load QR image');
    };
    qrImg.src = qrToUse;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been saved to your device",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${shop.name} - PrintEasy QR`,
        text: `Order printing services from ${shop.name}`,
        url: shopUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    toast({
      title: "Link Copied",
      description: "Shop link has been copied to clipboard",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          data-testid="button-close-qr-modal"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Preview */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-center mb-4">Your QR Code</h3>
          {previewDataUrl && (
            <div className="flex justify-center mb-4">
              <img 
                src={previewDataUrl} 
                alt="QR Code Preview" 
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '500px' }}
              />
            </div>
          )}
        </div>

        {/* Hidden canvas for generating download */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-[#FFBF00] hover:bg-[#F0B000] text-black font-semibold"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 border-gray-300"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 border-gray-300"
            data-testid="button-copy-link"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}