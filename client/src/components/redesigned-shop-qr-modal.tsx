import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Download, Share2, QrCode as QrCodeIcon, 
  Check, Copy, Star, Shield, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getShopUrl } from '@/utils/domain';

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

  // State to store shop data permanently
  const [permanentShopData, setPermanentShopData] = useState(shop);

  // Fetch real-time shop data
  const { data: currentShop } = useQuery({
    queryKey: [`/api/shops/slug/${shop.slug}`],
    refetchInterval: 15000,
    staleTime: 5000,
    retry: 3,
    retryDelay: 1000,
    initialData: shop,
    select: (data: any) => data?.shop || data || shop,
  });

  // Update permanent shop data when we get new valid data
  useEffect(() => {
    if (currentShop && currentShop.name) {
      setPermanentShopData(currentShop);
    }
  }, [currentShop]);

  // Always guarantee we have shop data
  const displayShop = permanentShopData;

  // Generate QR code
  useEffect(() => {
    if (displayShop && displayShop.slug) {
      const shopUrl = getShopUrl(displayShop.slug);
      QRCode.toDataURL(shopUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0A0908',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl).catch((error) => {
        console.error('QR Code generation failed:', error);
      });
    }
  }, [displayShop?.slug]);

  const handleDownload = async () => {
    if (!displayShop?.slug || !displayShop?.name) return;

    try {
      // Use the professional Puppeteer-powered QR generation endpoint
      const response = await fetch('/api/qr/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopSlug: displayShop.slug,
          shopName: displayShop.name,
          filename: `PrintEasy_${displayShop.name.replace(/\s+/g, '_')}_QR.jpg`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate professional QR code');
      }

      const result = await response.json();
      
      if (result.success && (result.imageUrl || result.image)) {
        // Create download link for the professional QR template
        const link = document.createElement('a');
        link.download = `PrintEasy_${displayShop.name.replace(/\s+/g, '_')}_QR.jpg`;
        
        // Handle both URL and base64 image responses
        if (result.imageUrl) {
          link.href = result.imageUrl;
        } else if (result.image) {
          link.href = `data:image/jpeg;base64,${result.image}`;
        }
        
        link.click();
      } else {
        throw new Error('Professional QR generation failed');
      }
    } catch (error) {
      console.error('Error generating professional QR code:', error);
      
      // Fallback to basic html2canvas if professional generation fails
      if (qrRef.current) {
        try {
          const canvas = await html2canvas(qrRef.current, {
            backgroundColor: '#FFFFFF',
            scale: 3,
            useCORS: true,
            allowTaint: true,
            width: 500,
            height: qrRef.current.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            logging: false,
          });

          const link = document.createElement('a');
          link.download = `PrintEasy_${(displayShop?.name || 'Shop').replace(/\s+/g, '_')}_QR.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.8);
          link.click();
        } catch (fallbackError) {
          console.error('Fallback QR generation also failed:', fallbackError);
        }
      }
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
      <div className="bg-white w-full max-w-md relative overflow-hidden rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 bg-white/90 hover:bg-white rounded-full shadow-md h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* QR Code Design - Complete Redesign */}
        <div ref={qrRef} className="bg-white w-full">
          {/* Header with PrintEasy Branding */}
          <div className="bg-[#FFBF00] px-6 py-8 text-center relative">
            {/* Shop Verification Badge - Top Right */}
            <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-lg">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-xs font-bold text-black">VERIFIED</span>
              </div>
            </div>
            
            {/* PrintEasy Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-[#FFBF00] text-2xl font-bold">P</span>
              </div>
            </div>
            
            {/* Shop Name */}
            <h1 className="text-xl font-bold text-black mb-2">{displayShop?.name || shop.name}</h1>
            
            {/* PrintEasy QR Branding */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCodeIcon className="w-4 h-4 text-black" />
              <span className="text-sm font-semibold text-black">PrintEasy QR</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 text-center">
            {qrDataUrl && (
              <div className="inline-block p-4 bg-white rounded-xl shadow-lg border-2 border-gray-100 mb-6">
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
            )}
            
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-black mb-2">Shop Contact</h3>
              <p className="text-sm text-gray-700">
                📞 {displayShop?.publicContactNumber || displayShop?.phone || shop.phone}
              </p>
            </div>
          </div>

          {/* Customer Guide - Step by Step */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-bold text-black mb-4 text-center">How to Use This QR Code</h3>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-black">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Open Camera App</p>
                    <p className="text-xs text-gray-600">Point your phone camera at this QR code</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-black">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Tap the Link</p>
                    <p className="text-xs text-gray-600">Your phone will show a notification - tap it</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-black">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Start Ordering</p>
                    <p className="text-xs text-gray-600">Upload files or book walk-in appointments</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-black">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Track & Collect</p>
                    <p className="text-xs text-gray-600">Monitor progress and get notified when ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="bg-black px-6 py-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-black">P</span>
                </div>
                <span className="text-white font-bold text-sm">PrintEasy</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span>Easy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs"
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}