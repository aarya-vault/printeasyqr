import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
    canvas.height = 640;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header background
    ctx.fillStyle = '#FFBF00';
    ctx.fillRect(0, 0, 400, 140);

    // Shop name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shopData.name, 200, 50);

    // Professional services text
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText('Professional Printing Services', 200, 75);

    // Status badges - better alignment and spacing
    const badgeY = 105;
    let badgeStartX = 200; // Center point
    const badges = [];
    
    if (shopData.isOnline) {
      badges.push({ text: 'Online', width: 50 });
    }
    
    if (shopData.acceptsWalkinOrders) {
      badges.push({ text: 'Walk-in Available', width: 120 });
    }

    // Calculate total width and starting position for centered alignment
    const totalWidth = badges.reduce((sum, badge) => sum + badge.width + 10, -10); // -10 to remove last gap
    let currentX = badgeStartX - (totalWidth / 2);

    badges.forEach((badge) => {
      // Badge background
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(currentX, badgeY - 12, badge.width, 24);
      
      // Badge text
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(badge.text, currentX + badge.width/2, badgeY + 4);
      
      currentX += badge.width + 15; // Move to next badge position
    });

    // QR Code
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        // QR code background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(100, 160, 200, 200);
        ctx.strokeStyle = '#E5E5E5';
        ctx.lineWidth = 1;
        ctx.strokeRect(100, 160, 200, 200);
        
        // Draw QR code
        ctx.drawImage(qrImg, 110, 170, 180, 180);

        // "Scan to Visit Shop" text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to Visit Shop', 200, 390);

        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Scan this QR code to view our services and place orders', 200, 410);

        // Shop details background
        ctx.fillStyle = '#F9F9F9';
        ctx.fillRect(20, 430, 360, 160);

        // Location
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Location', 40, 455);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        const locationText = `${shopData.address}, ${shopData.city}`;
        ctx.fillText(locationText.length > 45 ? locationText.substring(0, 42) + '...' : locationText, 40, 475);

        // Contact
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.fillText('Contact', 40, 505);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(shopData.publicContactNumber || shopData.phone || 'Contact Number', 40, 525);

        // Working Hours
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Working Hours', 40, 550);
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        
        if (shopData.workingHours) {
          let yPos = 570;
          // Get the first 3 days to display for better spacing
          const daysToShow = Object.entries(shopData.workingHours).slice(0, 3);

          daysToShow.forEach(([day, hours]: [string, any]) => {
            const dayText = `${day.charAt(0).toUpperCase() + day.slice(1, 2).toLowerCase()}:`;
            const timeText = hours.closed ? 'Closed' :
              hours.open === hours.close ? '24/7' :
              `${hours.open}-${hours.close}`;

            // Set alignment to left for the day
            ctx.textAlign = 'left';
            ctx.fillText(dayText, 40, yPos);

            // Set alignment to right for the time, inside the grey box (width 360, right edge at 380)
            ctx.textAlign = 'right';
            ctx.fillText(timeText, 370, yPos); // Align to the right edge with 10px padding

            yPos += 18; // Slightly more spacing between lines
          });

          // Reset alignment after the loop
          ctx.textAlign = 'left';
        } else {
          ctx.fillStyle = '#FFBF00';
          ctx.font = 'bold 12px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('24/7 Open', 200, 570);
          ctx.textAlign = 'left'; // Reset alignment
        }

        // Footer
        ctx.fillStyle = '#F3F3F3';
        ctx.fillRect(0, 600, 400, 40);
        
        // PrintEasy logo circle
        ctx.fillStyle = '#FFBF00';
        ctx.beginPath();
        ctx.arc(40, 620, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('P', 40, 625);

        ctx.textAlign = 'left';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText('PrintEasy', 60, 625);

        ctx.textAlign = 'right';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Connect • Print • Collect', 380, 625);
      };
      qrImg.src = qrDataUrl;
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    try {
      const link = document.createElement('a');
      link.download = `${shopData.name.replace(/\s+/g, '_')}_QR_Code.jpg`;
      link.href = canvasRef.current.toDataURL('image/jpeg', 0.8);
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
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Shop QR Code</DialogTitle>
          <DialogDescription>Download or share the QR code for {shop.name}</DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Shop QR Code</h3>
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