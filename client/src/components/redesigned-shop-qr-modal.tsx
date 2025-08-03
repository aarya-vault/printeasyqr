import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Download, Share2, MapPin, Phone, Clock, 
  Store, ExternalLink, Check, Copy, MessageSquare,
  QrCode as QrCodeIcon, Printer
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
      <div className="bg-white w-full max-w-sm sm:max-w-md md:max-w-lg relative overflow-hidden rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Close Button - Beautiful Design */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 bg-white/90 hover:bg-white rounded-full shadow-lg h-10 w-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* QR Code Design - Beautiful Redesign */}
        <div ref={qrRef} className="bg-white w-full">
          {/* Header with Enhanced PrintEasy Branding */}
          <div className="bg-brand-yellow p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-rich-black rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-rich-black rounded-full"></div>
            </div>
            
            {/* PrintEasy Logo */}
            <div className="relative flex flex-col items-center mb-4">
              <div className="w-16 h-16 bg-rich-black rounded-full flex items-center justify-center shadow-xl mb-3">
                <Printer className="w-8 h-8 text-brand-yellow" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rich-black">PrintEasy</div>
                <div className="text-sm text-rich-black/80 font-medium">Verified Partner</div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-rich-black mb-2 relative">
              {displayShop?.name || 'Shop Name'}
            </h2>
            <p className="text-rich-black/80 text-sm font-medium mb-4">Professional Printing Services</p>
            
            {/* Status Badges - Enhanced Design */}
            {displayShop && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="px-3 py-1.5 bg-white/30 backdrop-blur-sm rounded-full shadow-sm">
                  <span className="text-xs font-semibold text-rich-black flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                {displayShop.acceptsWalkinOrders && (
                  <div className="px-3 py-1.5 bg-white/30 backdrop-blur-sm rounded-full shadow-sm">
                    <span className="text-xs font-semibold text-rich-black">Walk-in Ready</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QR Code - Enhanced Design */}
          <div className="px-6 py-8 bg-gray-50 flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 mx-auto">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  className="w-48 h-48 block"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
            
            {/* Scan Instructions - Beautiful Design */}
            <div className="text-center mt-6 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <QrCodeIcon className="w-4 h-4 text-rich-black" />
                </div>
                <p className="text-lg font-bold text-rich-black">Scan to Visit Shop</p>
              </div>
              <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
                Scan this QR code to view our services and place orders
              </p>
            </div>

            {/* Shop Details - Beautiful Card Design */}
            <div className="space-y-3 bg-white rounded-2xl p-5 mx-4 mb-6 shadow-lg border border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-brand-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rich-black mb-1">Location</p>
                  <p className="text-sm text-gray-600 leading-tight">
                    {displayShop?.address || 'Address'}, {displayShop?.city || 'City'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-brand-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rich-black mb-1">Contact</p>
                  <p className="text-sm text-gray-600">
                    {displayShop?.publicContactNumber || displayShop?.phone || 'Contact Number'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-brand-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rich-black mb-2">Working Hours</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {displayShop?.workingHours ? (
                      Object.entries(displayShop.workingHours).slice(0, 7).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between items-center">
                          <span className="capitalize font-medium">{day.slice(0, 3)}:</span>
                          <span className="text-right">
                            {hours.closed ? 'Closed' : 
                             hours.open === hours.close ? '24/7' : 
                             `${hours.open}-${hours.close}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <span className="font-bold text-brand-yellow">24/7 Open</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Beautiful Design */}
          <div className="bg-rich-black px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-rich-black">P</span>
                </div>
                <span className="text-sm font-bold text-white">PrintEasy</span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Connect • Print • Collect</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Beautiful Design */}
        <div className="p-6 bg-white border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-semibold shadow-lg py-3"
              size="default"
            >
              <Download className="w-5 h-5 mr-2" />
              Download QR
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-2 border-brand-yellow text-rich-black hover:bg-brand-yellow/10 font-semibold py-3"
              size="default"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <ExternalLink className="w-5 h-5 text-brand-yellow flex-shrink-0" />
              <input
                type="text"
                value={`${window.location.origin}/shop/${shop.slug}`}
                readOnly
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none font-medium"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="hover:bg-brand-yellow/10 p-2 rounded-lg"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-rich-black" />
                )}
              </Button>
            </div>
            {copied && (
              <div className="absolute -top-8 right-0 bg-rich-black text-white text-xs px-3 py-1 rounded-full animate-fade-in">
                Copied!
              </div>
            )}
          </div>

          <p className="text-sm text-center text-gray-600 font-medium">
            This QR code is permanent and linked to your shop
          </p>
        </div>
      </div>
    </div>
  );
}