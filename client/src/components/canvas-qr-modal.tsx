import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Share2, 
  Copy, 
  Check,
  X,
  Store,
  QrCode as QrCodeIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  publicContactNumber?: string;
  workingHours: any;
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
}

interface CanvasQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
}

export function CanvasQRModal({ isOpen, onClose, shop }: CanvasQRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Store shop data permanently
  const [shopData] = useState(shop);

  // Generate QR code
  useEffect(() => {
    if (shopData && shopData.slug) {
      const shopUrl = `${window.location.origin}/shop/${shopData.slug}`;
      QRCode.toDataURL(shopUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl);
    }
  }, [shopData?.slug]);

  // Draw QR card on canvas
  useEffect(() => {
    if (canvasRef.current && qrDataUrl && shopData) {
      drawQRCard();
    }
  }, [qrDataUrl, shopData]);

  const drawQRCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header background
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(0, 0, 400, 120);

    // Shop name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shopData.name, 200, 40);

    // Professional services text
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText('Professional Printing Services', 200, 65);

    // Status badges
    let badgeY = 85;
    if (shopData.isOnline) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(120, badgeY - 15, 60, 20);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('Online', 150, badgeY);
    }
    
    if (shopData.acceptsWalkinOrders) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(190, badgeY - 15, 100, 20);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('Walk-in Available', 240, badgeY);
    }

    // QR Code
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        // QR code background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(100, 140, 200, 200);
        ctx.strokeStyle = '#E5E5E5';
        ctx.lineWidth = 1;
        ctx.strokeRect(100, 140, 200, 200);
        
        // Draw QR code
        ctx.drawImage(qrImg, 110, 150, 180, 180);

        // "Scan to Visit Shop" text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to Visit Shop', 200, 370);

        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Scan this QR code to view our services and place orders', 200, 390);

        // Shop details background
        ctx.fillStyle = '#F9F9F9';
        ctx.fillRect(20, 410, 360, 140);

        // Location
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Location', 40, 435);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        const locationText = `${shopData.address}, ${shopData.city}`;
        ctx.fillText(locationText.length > 50 ? locationText.substring(0, 47) + '...' : locationText, 40, 450);

        // Contact
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('Contact', 40, 475);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(shopData.publicContactNumber || shopData.phone || 'Contact Number', 40, 490);

        // Working Hours
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('Working Hours', 40, 515);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        
        if (shopData.workingHours) {
          let yPos = 530;
          Object.entries(shopData.workingHours).slice(0, 3).forEach(([day, hours]: [string, any]) => {
            const dayText = `${day.slice(0, 3)}:`;
            const timeText = hours.closed ? 'Closed' : 
                           hours.open === hours.close ? '24/7' : 
                           `${hours.open}-${hours.close}`;
            ctx.fillText(dayText, 40, yPos);
            ctx.fillText(timeText, 300, yPos);
            yPos += 15;
          });
        } else {
          ctx.fillStyle = '#FFBF00';
          ctx.font = 'bold 12px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('24/7 Open', 200, 535);
        }

        // Footer
        ctx.fillStyle = '#F3F3F3';
        ctx.fillRect(0, 560, 400, 40);
        
        // PrintEasy logo circle
        ctx.fillStyle = '#FFBF00';
        ctx.beginPath();
        ctx.arc(40, 580, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('P', 40, 585);

        ctx.textAlign = 'left';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('PrintEasy', 60, 585);

        ctx.textAlign = 'right';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Connect • Print • Collect', 380, 585);
      };
      qrImg.src = qrDataUrl;
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    try {
      const link = document.createElement('a');
      link.download = `${shopData.name.replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your device",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const shopUrl = `${window.location.origin}/shop/${shopData.slug}`;
    const shareText = `Visit ${shopData.name} at ${shopUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: shopData.name,
        text: shareText,
        url: shopUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleCopy = () => {
    const shopUrl = `${window.location.origin}/shop/${shopData.slug}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Shop link has been copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Shop QR Code</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Shop QR Code</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Canvas Preview */}
          <div className="flex justify-center mb-6">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded-lg shadow-sm max-w-full h-auto"
              style={{ maxWidth: '400px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={handleDownload}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-rich-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}