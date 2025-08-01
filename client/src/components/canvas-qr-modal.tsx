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

    // Header section with generous spacing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, 200);

    // PrintEasy logo - Yellow circle with black printer (proper size for A4)
    ctx.fillStyle = '#FFBF00';
    ctx.beginPath();
    ctx.arc(400, 80, 45, 0, 2 * Math.PI);
    ctx.fill();

    // Printer icon (clean Lucide-style design)
    ctx.fillStyle = '#000000';
    ctx.fillRect(380, 62, 40, 28);
    ctx.fillRect(385, 68, 30, 16);
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(388, 72, 24, 8);
    // Printer details
    ctx.fillStyle = '#000000';
    ctx.fillRect(392, 75, 16, 1);
    ctx.fillRect(392, 78, 16, 1);

    // PrintEasy title (correct branding)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PrintEasy', 400, 150);

    // Shop name (prominent with generous spacing)
    ctx.font = 'bold 32px Arial';
    ctx.fillText(shop.name, 400, 190);

    // Divider line
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 220);
    ctx.lineTo(700, 220);
    ctx.stroke();

    // Set initial preview with basic content
    setPreviewDataUrl(canvas.toDataURL());
    console.log('Set initial preview');

    // QR Code section with proper A4 spacing
    const qrImg = new Image();
    qrImg.onload = () => {
      console.log('QR image loaded, adding to canvas');
      
      // QR section with background
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 240, canvas.width, 350);
      
      // QR code container (centered, larger for A4)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(250, 280, 300, 300);
      
      // QR code border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(250, 280, 300, 300);
      
      // QR code (larger size)
      ctx.drawImage(qrImg, 275, 305, 250, 250);
      
      // Shop contact information
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Contact: ${shop.phone}`, 400, 620);
      
      // Shop URL
      ctx.font = '18px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`Visit: ${shopUrl}`, 400, 650);

      // Customer Guide section with generous spacing
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 680, canvas.width, 350);
      
      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Customer Guide', 400, 720);

      // Main instruction paragraph with proper line breaks
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      const guideText = [
        'Scan this QR via your phone camera or visit printeasyqr.com',
        'and scan it there. Enter your name and number, upload your',
        'files or create a walk-in order for tracking purposes.',
        '',
        'Voilà! Explore the dashboard, chat with shop owner and',
        'don\'t worry - uploaded files are auto-deleted on completion.',
        'Trust PrintEasy for secure, hassle-free printing!'
      ];

      let textY = 760;
      guideText.forEach((line, index) => {
        if (line === '') {
          textY += 15; // Extra space for paragraph break
        } else {
          if (index < 3) {
            ctx.fillStyle = '#000000';
          } else {
            ctx.fillStyle = '#666666';
          }
          ctx.fillText(line, 80, textY);
          textY += 25;
        }
      });

      // Trust indicators
      ctx.fillStyle = '#FFBF00';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✓ Secure File Handling  ✓ Auto-Delete  ✓ Real-time Chat', 400, 950);

      // Footer with generous spacing
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, canvas.height - 160, canvas.width, 160);

      // PrintEasy footer logo (larger for A4)
      ctx.fillStyle = '#FFBF00';
      ctx.beginPath();
      ctx.arc(300, canvas.height - 110, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Mini printer icon (larger)
      ctx.fillStyle = '#000000';
      ctx.fillRect(290, canvas.height - 120, 20, 16);
      ctx.fillRect(293, canvas.height - 115, 14, 10);
      ctx.fillStyle = '#FFBF00';
      ctx.fillRect(295, canvas.height - 112, 10, 4);

      // PrintEasy text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('PrintEasy', 330, canvas.height - 100);

      // Website URL (prominent)
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('https://printeasyqr.com', 400, canvas.height - 70);

      // Platform USP
      ctx.fillStyle = '#FFBF00';
      ctx.font = '16px Arial';
      ctx.fillText('Connecting You to Local Print Shops', 400, canvas.height - 45);

      // Final tagline
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '14px Arial';
      ctx.fillText('Fast • Secure • Reliable • Professional', 400, canvas.height - 20);

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