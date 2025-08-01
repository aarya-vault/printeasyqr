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

    // Set canvas size for high quality
    canvas.width = 600;
    canvas.height = 900;

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section - White background with yellow accent
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, 180);

    // PrintEasy logo - Yellow circle with black printer
    ctx.fillStyle = '#FFBF00';
    ctx.beginPath();
    ctx.arc(300, 60, 35, 0, 2 * Math.PI);
    ctx.fill();

    // Printer icon (clean design)
    ctx.fillStyle = '#000000';
    ctx.fillRect(285, 47, 30, 20);
    ctx.fillRect(288, 52, 24, 10);
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(290, 54, 20, 6);
    // Printer lines
    ctx.fillStyle = '#000000';
    ctx.fillRect(292, 56, 16, 1);
    ctx.fillRect(292, 58, 16, 1);

    // PrintEasy QR title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PrintEasy QR', 300, 110);

    // Shop name (larger, prominent)
    ctx.font = 'bold 28px Arial';
    ctx.fillText(shop.name, 300, 145);

    // Shop contact info
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(`Contact: ${shop.phone}`, 300, 170);

    // Set initial preview with basic content
    setPreviewDataUrl(canvas.toDataURL());
    console.log('Set initial preview');

    // QR Code section
    const qrImg = new Image();
    qrImg.onload = () => {
      console.log('QR image loaded, adding to canvas');
      
      // QR section background
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 190, canvas.width, 280);
      
      // QR code container (white background)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(175, 220, 250, 250);
      
      // QR code border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 2;
      ctx.strokeRect(175, 220, 250, 250);
      
      // QR code
      ctx.drawImage(qrImg, 200, 245, 200, 200);
      
      // "Scan to Order" text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Scan QR Code to Order', 300, 500);

      // How to use section
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 520, canvas.width, 260);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('How to Use This QR Code', 300, 550);

      const steps = [
        { num: '1', title: 'Open Camera App', desc: 'Point your phone camera at the QR code above' },
        { num: '2', title: 'Tap the Link', desc: 'Your phone will show a notification - tap it' },
        { num: '3', title: 'Upload & Order', desc: 'Select files or book walk-in appointment' },
        { num: '4', title: 'Track & Collect', desc: 'Monitor progress and collect when ready' }
      ];

      let yPos = 580;
      steps.forEach((step, index) => {
        // Step number circle
        ctx.fillStyle = '#FFBF00';
        ctx.beginPath();
        ctx.arc(120, yPos, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Step number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step.num, 120, yPos + 4);
        
        // Step title
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(step.title, 145, yPos - 5);
        
        // Step description
        ctx.font = '13px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(step.desc, 145, yPos + 12);
        
        yPos += 40;
      });

      // Footer background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

      // PrintEasy footer logo
      ctx.fillStyle = '#FFBF00';
      ctx.beginPath();
      ctx.arc(190, canvas.height - 80, 16, 0, 2 * Math.PI);
      ctx.fill();

      // Mini printer icon
      ctx.fillStyle = '#000000';
      ctx.fillRect(182, canvas.height - 88, 16, 12);
      ctx.fillRect(184, canvas.height - 84, 12, 8);
      ctx.fillStyle = '#FFBF00';
      ctx.fillRect(185, canvas.height - 82, 10, 4);

      // PrintEasy text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('PrintEasy', 220, canvas.height - 72);

      // Website URL
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('www.printeasyqr.com', 300, canvas.height - 50);

      // Shop URL
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FFBF00';
      ctx.fillText(`Visit: ${shopUrl}`, 300, canvas.height - 30);

      // USP
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '12px Arial';
      ctx.fillText('Fast • Secure • Professional Printing Services', 300, canvas.height - 10);

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