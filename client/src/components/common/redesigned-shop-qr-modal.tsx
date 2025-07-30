import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Download, Share2, MapPin, Phone, Clock, 
  Store, ExternalLink, Check, Copy, MessageSquare,
  QrCode as QrCodeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getShopUrl } from '@/utils/domain';
import ShopStatusIndicator from '@/components/shop-status-indicator';

interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  publicContactNumber?: string;
  workingHours?: any;
  isOnline: boolean;
  acceptsWalkinOrders?: boolean;
}

interface ShopQRModalProps {
  shop: Shop;
  onClose: () => void;
}

export default function RedesignedShopQRModal({ shop, onClose }: ShopQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // State to store shop data permanently and prevent data loss
  const [permanentShopData, setPermanentShopData] = useState(shop);

  // Fetch real-time shop data for QR modal with robust error handling
  const { data: currentShop, error, isError } = useQuery({
    queryKey: [`/api/shops/slug/${shop.slug}`],
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds for immediate updates
    retry: 3,
    retryDelay: 1000,
    // Always keep the original shop data as fallback
    initialData: shop,
    // Ensure we always have shop data even during failed requests
    select: (data: any) => {
      // If API returns shop data, use it; otherwise keep original shop data
      return data?.shop || data || shop;
    }
  });

  // Update permanent shop data when we get new valid data
  useEffect(() => {
    if (currentShop && currentShop.name) {
      setPermanentShopData(currentShop);
    }
  }, [currentShop]);

  // Log when data is missing for debugging
  useEffect(() => {
    if (isError || !currentShop) {
      console.warn('QR Modal shop data issue:', { error, currentShop, fallbackShop: shop });
    }
  }, [isError, currentShop, error, shop]);

  // Always guarantee we have shop data - use permanent data that never gets lost
  const displayShop = permanentShopData;

  // Generate QR code when displayShop changes
  useEffect(() => {
    if (displayShop && displayShop.slug) {
      const shopUrl = getShopUrl(displayShop.slug);
      QRCode.toDataURL(shopUrl, {
        width: 280,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl).catch((error) => {
        console.error('QR Code generation failed:', error);
        // Fallback QR generation with basic shop slug
        QRCode.toDataURL(`${window.location.origin}/shop/${displayShop.slug}`, {
          width: 280,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        }).then(setQrDataUrl);
      });
    }
  }, [displayShop?.slug]);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2, // Balanced scale for quality and performance
        useCORS: true,
        allowTaint: true,
        width: 480, // Fixed width matching container
        height: qrRef.current.scrollHeight, // Use scroll height for full content
        scrollX: 0,
        scrollY: 0,
        logging: false, // Disable logging for cleaner output
      });

      const link = document.createElement('a');
      link.download = `${(displayShop?.name || 'Shop').replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating QR code image:', error);
    }
  };

  const handleShare = () => {
    const shopSlug = displayShop?.slug || shop.slug;
    const shopName = displayShop?.name || shop.name;
    const shopUrl = getShopUrl(shopSlug);
    const shareText = `Visit ${shopName} at ${shopUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: shopName,
        text: shareText,
        url: shopUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleCopy = () => {
    const shopSlug = displayShop?.slug || shop.slug;
    const shopUrl = getShopUrl(shopSlug);
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
        <div ref={qrRef} className="bg-white" style={{ width: '480px', height: 'auto' }}>
          {/* Header */}
          <div className="bg-brand-yellow p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Store className="w-8 h-8 text-rich-black" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-rich-black mb-3 leading-tight">
              {displayShop?.name || 'Shop Name'}
            </h2>
            <p className="text-rich-black/80 text-sm font-medium mb-4">Professional Printing Services</p>
            
            {/* Status Badges - Redesigned for better layout */}
            {displayShop && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="px-3 py-1 bg-white/20 rounded-full">
                  <span className="text-xs font-medium text-rich-black">
                    {displayShop.isOnline ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
                {displayShop.acceptsWalkinOrders && (
                  <div className="px-3 py-1 bg-white/20 rounded-full">
                    <span className="text-xs font-medium text-rich-black">Walk-in Available</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="px-8 py-6 bg-white flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 mx-auto">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  className="w-48 h-48 block"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
            
            {/* Scan Instructions */}
            <div className="text-center mt-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <QrCodeIcon className="w-4 h-4 text-brand-yellow" />
                <p className="text-base font-semibold text-rich-black">Scan to Visit Shop</p>
              </div>
              <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                Scan this QR code to view our services and place orders
              </p>
            </div>

            {/* Shop Details */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-4 mx-6 mb-4">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3 h-3 text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rich-black mb-1">Location</p>
                  <p className="text-xs text-gray-600 leading-tight">
                    {displayShop?.address || 'Address'}, {displayShop?.city || 'City'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Phone className="w-3 h-3 text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rich-black mb-1">Contact</p>
                  <p className="text-xs text-gray-600">
                    {displayShop?.publicContactNumber || displayShop?.phone || 'Contact Number'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Clock className="w-3 h-3 text-brand-yellow mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rich-black mb-1">Working Hours</p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {displayShop?.workingHours ? (
                      Object.entries(displayShop.workingHours).slice(0, 7).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between items-center">
                          <span className="capitalize font-medium w-8">{day.slice(0, 3)}:</span>
                          <span className="text-right text-xs">
                            {hours.closed ? 'Closed' : 
                             hours.open === hours.close ? '24/7' : 
                             `${hours.open}-${hours.close}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-1">
                        <span className="font-semibold text-brand-yellow text-xs">24/7 Open</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-rich-black">P</span>
                </div>
                <span className="text-xs font-semibold text-rich-black">PrintEasy</span>
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