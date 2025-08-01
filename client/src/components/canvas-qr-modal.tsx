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
      
      // Generate the full design on canvas for download
      setTimeout(() => {
        console.log('Starting to draw full design');
        drawFullDesign();
      }, 100);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const drawFullDesign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !qrDataUrl) {
      console.log('Canvas or QR data not ready:', { canvas: !!canvas, qrDataUrl: !!qrDataUrl });
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
    canvas.height = 800;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header background
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(0, 0, canvas.width, 200);

    // PrintEasy logo circle
    ctx.fillStyle = '#FFBF00';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(300, 80, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Printer icon (simplified)
    ctx.fillStyle = '#000000';
    ctx.fillRect(280, 65, 40, 25);
    ctx.fillRect(285, 70, 30, 15);
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(287, 72, 26, 11);
    
    // Lines inside printer
    ctx.fillStyle = '#000000';
    ctx.fillRect(290, 75, 20, 1);
    ctx.fillRect(290, 78, 20, 1);
    ctx.fillRect(290, 81, 20, 1);

    // Shop name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(shop.name, 300, 150);

    // "PrintEasy Partner" text
    ctx.font = '18px Arial';
    ctx.fillText('PrintEasy Partner', 300, 180);

    // Set initial preview with basic content
    setPreviewDataUrl(canvas.toDataURL());
    console.log('Set initial preview');

    // QR Code
    const qrImg = new Image();
    qrImg.onload = () => {
      console.log('QR image loaded, adding to canvas');
      // QR background
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(150, 220, 300, 300);
      
      // QR code
      ctx.drawImage(qrImg, 200, 270, 200, 200);
      
      // "Scan to Order" text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Scan to Order', 300, 550);

      // How to use section
      ctx.font = 'bold 22px Arial';
      ctx.fillText('How to Use', 300, 590);

      const steps = [
        { num: '1', title: 'Open Camera', desc: 'Point your phone at the QR code' },
        { num: '2', title: 'Tap Link', desc: 'Click the notification that appears' },
        { num: '3', title: 'Upload Files', desc: 'Select your documents to print' },
        { num: '4', title: 'Collect Order', desc: 'Get notified when ready' }
      ];

      let yPos = 620;
      steps.forEach((step) => {
        // Step number circle
        ctx.fillStyle = '#FFBF00';
        ctx.beginPath();
        ctx.arc(180, yPos, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Step number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step.num, 180, yPos + 5);
        
        // Step title
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(step.title, 210, yPos - 5);
        
        // Step description
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(step.desc, 210, yPos + 15);
        
        yPos += 35;
      });

      // Footer background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

      // PrintEasy footer logo
      ctx.fillStyle = '#FFBF00';
      ctx.beginPath();
      ctx.arc(250, canvas.height - 50, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Mini printer icon
      ctx.fillStyle = '#000000';
      ctx.fillRect(244, canvas.height - 55, 12, 8);
      ctx.fillStyle = '#FFBF00';
      ctx.fillRect(245, canvas.height - 53, 10, 4);

      // PrintEasy text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('PrintEasy', 270, canvas.height - 42);

      // Contact info
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Contact: ${shop.phone}`, 300, canvas.height - 20);

      // USP
      ctx.fillStyle = '#FFBF00';
      ctx.font = '14px Arial';
      ctx.fillText('Fast • Secure • Professional', 300, canvas.height - 5);

      // Set final preview
      setPreviewDataUrl(canvas.toDataURL());
      console.log('Final preview set with QR code and all content');
    };
    qrImg.onerror = () => {
      console.error('Failed to load QR image');
    };
    qrImg.src = qrDataUrl;
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