import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getShopUrl } from '@/utils/domain';

interface ShopQRModalProps {
  shop: {
    id: number;
    name: string;
    slug: string;
    phone: string;
    address: string;
    city: string;
    publicContactNumber?: string;
    workingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  };
  onClose: () => void;
}

export default function ShopQRModal({ shop, onClose }: ShopQRModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate QR code on component mount
  useState(() => {
    const orderUrl = getShopUrl(shop.slug);
    QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).then(setQrCodeUrl).catch(console.error);
  });

  const orderUrl = getShopUrl(shop.slug);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.8);
      link.click();

      toast({
        title: 'QR Code Downloaded',
        description: 'QR code has been saved to your device',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Unable to download QR code',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shop.name} - PrintEasy`,
          text: `Place your printing orders at ${shop.name}`,
          url: orderUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link Copied',
      description: 'Order link has been copied to clipboard',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-rich-black">Shop QR Code</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code Preview */}
          <div className="flex justify-center">
            <div ref={qrRef} className="bg-white p-8 rounded-lg">
              {/* Header */}
              <div className="bg-brand-yellow text-white p-6 -m-8 mb-6 rounded-t-lg">
                <h1 className="text-3xl font-bold text-center text-rich-black">PrintEasy</h1>
                <p className="text-center text-rich-black mt-1">Instant Printing Solutions</p>
              </div>

              {/* Shop Details */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-rich-black mb-2">{shop.name}</h2>
                <p className="text-medium-gray">
                  {shop.address}{shop.city && shop.city !== 'Unknown' ? `, ${shop.city}` : ''}
                  {shop.state && shop.state !== 'Unknown' && shop.city && shop.city !== 'Unknown' ? `, ${shop.state}` : ''}
                </p>
                <p className="text-medium-gray mt-2 flex items-center justify-center">
                  <span className="text-xl mr-2">📞</span>
                  {shop.publicContactNumber || shop.phone}
                </p>
                
                {/* Working Hours */}
                {shop.workingHours && (
                  <div className="mt-4 text-xs text-medium-gray">
                    <p className="font-semibold mb-1">Working Hours:</p>
                    <div className="space-y-1">
                      {Object.entries(shop.workingHours).map(([day, hours]) => (
                        <p key={day} className="flex justify-between">
                          <span className="capitalize">{day.slice(0, 3)}:</span>
                          <span>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center mb-6">
                  <img src={qrCodeUrl} alt="Shop QR Code" className="w-64 h-64" />
                </div>
              )}

              {/* Instructions */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-rich-black mb-2">Scan to Place Order</h3>
                <p className="text-medium-gray text-sm max-w-xs mx-auto">
                  Point your camera at this QR code to start placing your printing order
                </p>
              </div>

              {/* Footer */}
              <div className="bg-brand-yellow text-rich-black p-4 -m-8 mt-6 rounded-b-lg">
                <p className="text-center font-semibold">Powered by PrintEasy</p>
                <p className="text-center text-sm">Fast • Reliable • Convenient</p>
              </div>
            </div>
          </div>

          {/* Order URL */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-rich-black mb-2">Order Page URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={orderUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border rounded-md text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="hover:bg-gray-100"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleDownload}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-rich-black text-rich-black hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}