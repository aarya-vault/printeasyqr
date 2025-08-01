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
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl).catch((error) => {
        console.error('QR Code generation failed:', error);
        // Fallback QR generation with basic shop slug
        QRCode.toDataURL(`${window.location.origin}/shop/${displayShop.slug}`, {
          width: 320,
          margin: 2,
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
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        width: 600, // Fixed width for consistent output
        height: qrRef.current.scrollHeight, // Use scroll height for full content
        scrollX: 0,
        scrollY: 0,
        logging: false, // Disable logging for cleaner output
      });

      const link = document.createElement('a');
      link.download = `PrintEasy_${(displayShop?.name || 'Shop').replace(/\s+/g, '_')}_QR.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
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

        {/* QR Code Design - Complete Redesign with PrintEasy Branding */}
        <div ref={qrRef} className="bg-white w-full" style={{ width: '600px' }}>
          {/* Header with Enhanced PrintEasy Branding */}
          <div className="bg-gradient-to-b from-brand-yellow to-[#FFD700] p-8 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-rich-black rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rich-black rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rich-black/10 rounded-full"></div>
            </div>
            
            {/* PrintEasy Logo and Branding */}
            <div className="relative flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-rich-black rounded-2xl flex items-center justify-center shadow-2xl mb-4 transform rotate-3 hover:rotate-0 transition-transform">
                <Printer className="w-10 h-10 text-brand-yellow" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-rich-black tracking-tight">PrintEasy QR</div>
                <div className="text-sm text-rich-black/90 font-bold uppercase tracking-wider mt-1">
                  Trusted Printing Partner
                </div>
              </div>
            </div>
            
            {/* Verified Badge */}
            <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
              <div className="flex items-center gap-1">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-xs font-bold text-green-600 pr-2">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Shop Information Section */}
          <div className="bg-rich-black text-white p-6">
            <h2 className="text-2xl font-bold mb-2">
              {displayShop?.name || 'Shop Name'}
            </h2>
            <div className="flex items-center gap-2 text-brand-yellow">
              <Store className="w-4 h-4" />
              <span className="text-sm font-semibold">Professional Printing Services</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-8 py-10 bg-gray-50">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-brand-yellow mx-auto max-w-fit">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  className="w-64 h-64 block"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              )}
            </div>
            
            {/* Customer Guide Text */}
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                  <QrCodeIcon className="w-5 h-5 text-rich-black" />
                </div>
                <h3 className="text-lg font-bold text-rich-black">How to Use This QR Code</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Scan this QR via your app scanner or visit <span className="font-bold text-brand-yellow">printeasyqr.com</span> website 
                and scan it, then enter your name & number, upload your file or just create a walk-in order 
                for tracking purpose and voila! That's it - explore dashboard, chat with shop owner. 
                <span className="font-semibold text-green-600"> Don't worry - uploaded files are auto deleted on download complete. Trust!</span>
              </p>
            </div>

            {/* Shop Details */}
            <div className="mt-6 grid grid-cols-1 gap-4">
              {/* Contact Information */}
              <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-rich-black">Shop Owner Details</h4>
                  <Badge className="bg-brand-yellow/20 text-rich-black border-brand-yellow">
                    Direct Contact
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="font-semibold text-rich-black">
                        {displayShop?.publicContactNumber || displayShop?.phone || 'Contact Number'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Shop Address</p>
                      <p className="font-semibold text-rich-black text-sm">
                        {displayShop?.address || 'Address'}, {displayShop?.city || 'City'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-brand-yellow" />
                  <h4 className="font-bold text-rich-black">Working Hours</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {displayShop?.workingHours ? (
                    Object.entries(displayShop.workingHours).slice(0, 7).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                        <span className="capitalize font-medium text-gray-700">{day}:</span>
                        <span className="text-right font-semibold">
                          {hours.closed ? 
                            <span className="text-red-500">Closed</span> : 
                           hours.open === hours.close ? 
                            <span className="text-green-600">24/7</span> : 
                           <span className="text-rich-black">{hours.open}-{hours.close}</span>}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4">
                      <span className="font-bold text-green-600 text-lg">24/7 Open</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with USP */}
          <div className="bg-gradient-to-r from-rich-black to-gray-900 p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-xl font-black text-rich-black">P</span>
                </div>
                <span className="text-2xl font-bold text-white">PrintEasy QR</span>
              </div>
              <p className="text-brand-yellow font-semibold">India's Fastest Growing Print Network</p>
            </div>
            
            {/* USP Points */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-brand-yellow mb-1">500MB</div>
                <p className="text-xs text-gray-300">Max File Size</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-yellow mb-1">100+</div>
                <p className="text-xs text-gray-300">File Formats</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-yellow mb-1">24/7</div>
                <p className="text-xs text-gray-300">Support</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                <span className="font-semibold text-white">Connect</span> • 
                <span className="font-semibold text-brand-yellow"> Print</span> • 
                <span className="font-semibold text-white"> Collect</span>
              </p>
              <p className="text-center text-xs text-gray-500 mt-2">
                © 2025 PrintEasy QR - Transforming Local Printing
              </p>
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