import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
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
  MapPin,
  Phone,
  Clock,
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

interface SimpleShopQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
}

export function SimpleShopQRModal({ isOpen, onClose, shop }: SimpleShopQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
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

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      // Create a temporary container with exact dimensions
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '400px';
      tempContainer.innerHTML = qrRef.current.innerHTML;
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        width: 400,
        height: tempContainer.scrollHeight,
        logging: false,
      });

      document.body.removeChild(tempContainer);

      const link = document.createElement('a');
      link.download = `${(shopData?.name || 'Shop').replace(/\s+/g, '_')}_QR_Code.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.8);
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your device",
      });
    } catch (error) {
      console.error('Error generating QR code image:', error);
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

  // Format working hours display
  const formatWorkingHours = (hours: any) => {
    if (!hours) return '24/7';
    if (hours.closed) return 'Closed';
    if (hours.open === hours.close) return '24/7';
    return `${hours.open}-${hours.close}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Shop QR Code</DialogTitle>
        </DialogHeader>

        {/* QR Code Design - Simplified for perfect rendering */}
        <div ref={qrRef} className="bg-white" style={{ width: '400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ backgroundColor: '#FFBF00', padding: '24px', textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: 'white',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <Store style={{ width: '28px', height: '28px', color: '#000' }} />
            </div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#000',
              margin: '0 0 8px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {shopData?.name || 'Shop Name'}
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(0,0,0,0.8)',
              margin: '0 0 16px 0',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              Professional Printing Services
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#000',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {shopData.isOnline ? 'Online' : 'Offline'}
              </span>
              {shopData.acceptsWalkinOrders && (
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#000',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Walk-in Available
                </span>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'white' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              display: 'inline-block',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Shop QR Code" 
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              )}
            </div>
            
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <p style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#000',
                margin: '0 0 4px 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Scan to Visit Shop
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: '#666',
                margin: '0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Scan this QR code to view our services and place orders
              </p>
            </div>

            {/* Shop Details */}
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '16px',
              margin: '16px 0',
              textAlign: 'left',
              fontSize: '12px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {/* Location */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', color: '#000', marginBottom: '2px' }}>
                  Location
                </div>
                <div style={{ color: '#666' }}>
                  {shopData?.address || 'Address'}, {shopData?.city || 'City'}
                </div>
              </div>

              {/* Contact */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', color: '#000', marginBottom: '2px' }}>
                  Contact
                </div>
                <div style={{ color: '#666' }}>
                  {shopData?.publicContactNumber || shopData?.phone || 'Contact Number'}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <div style={{ fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                  Working Hours
                </div>
                <div style={{ color: '#666' }}>
                  {shopData?.workingHours ? (
                    <div>
                      {Object.entries(shopData.workingHours).slice(0, 7).map(([day, hours]: [string, any]) => (
                        <div key={day} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginBottom: '2px'
                        }}>
                          <span>{day.slice(0, 3)}:</span>
                          <span>{formatWorkingHours(hours)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#FFBF00', fontWeight: '600' }}>
                      24/7 Open
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#f3f3f3',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#FFBF00',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#000'
              }}>
                🖨️
              </div>
              <span style={{ fontWeight: '600', color: '#000' }}>PrintEasy</span>
            </div>
            <span style={{ color: '#666' }}>Connect • Print • Collect</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t">
          <div className="flex items-center space-x-3">
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
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}