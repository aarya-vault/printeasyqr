import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { 
  X, Download, Share2, MapPin, Phone, Clock, 
  Store, ExternalLink, Check, Copy, MessageSquare,
  QrCode as QrCodeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  publicContactNumber?: string;
  workingHours?: any;
}

interface ShopQRModalProps {
  shop: Shop;
  onClose: () => void;
}

export default function RedesignedShopQRModal({ shop, onClose }: ShopQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate QR code on mount
  useState(() => {
    const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
    QRCode.toDataURL(shopUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  });

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${shop.name.replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating QR code image:', error);
    }
  };

  const handleShare = () => {
    const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
    const shareText = `Visit ${shop.name} at ${shopUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text: shareText,
        url: shopUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleCopy = () => {
    const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-lg relative overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* QR Code Design */}
        <div ref={qrRef} className="bg-white">
          {/* Header */}
          <div className="bg-brand-yellow p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Store className="w-10 h-10 text-rich-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-rich-black mb-1">{shop.name}</h2>
            <p className="text-rich-black/80 text-sm font-medium">Professional Printing Services</p>
          </div>

          {/* QR Code */}
          <div className="p-8 bg-white">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 mx-auto w-fit">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  className="w-64 h-64"
                />
              )}
            </div>
            
            {/* Scan Instructions */}
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <QrCodeIcon className="w-5 h-5 text-brand-yellow" />
                <p className="text-lg font-semibold text-rich-black">Scan to Visit Shop</p>
              </div>
              <p className="text-sm text-gray-600">
                Scan this QR code to view our services and place orders
              </p>
            </div>

            {/* Shop Details */}
            <div className="mt-6 space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-yellow mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rich-black">Location</p>
                  <p className="text-sm text-gray-600">{shop.address}, {shop.city}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-brand-yellow mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rich-black">Contact</p>
                  <p className="text-sm text-gray-600">{shop.publicContactNumber || shop.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-brand-yellow mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rich-black">Working Hours</p>
                  <p className="text-sm text-gray-600">Mon-Sat: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-rich-black">P</span>
                </div>
                <span className="text-sm font-medium text-rich-black">PrintEasy</span>
              </div>
              <p className="text-xs text-gray-500">Connect • Print • Collect</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-brand-yellow text-rich-black hover:bg-brand-yellow/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg">
              <input
                type="text"
                value={`${window.location.origin}/shop/${shop.slug}`}
                readOnly
                className="flex-1 text-sm text-gray-600 bg-transparent outline-none"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="hover:bg-gray-100"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            This QR code is permanent and linked to your shop
          </p>
        </div>
      </Card>
    </div>
  );
}