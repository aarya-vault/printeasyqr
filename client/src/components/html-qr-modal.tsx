import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Share2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface HtmlQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: number;
    name: string;
    phone: string;
    slug: string;
  };
}

export default function HtmlQrModal({ isOpen, onClose, shop }: HtmlQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, shopUrl]);

  const generateQRCode = async () => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!qrContentRef.current) return;

    try {
      // Use html2canvas with specific options for better quality
      const canvas = await html2canvas(qrContentRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true,
        width: 400,
        height: 565,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${shop.slug}-qr-code.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Success",
            description: "QR code downloaded successfully",
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast({
        title: "Copied!",
        description: "Shop URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shop.name} - PrintEasy`,
          text: `Visit ${shop.name} on PrintEasy to place your printing orders`,
          url: shopUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0 overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 hover:bg-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* QR Code Content */}
          <div ref={qrContentRef} className="bg-white">
            {/* Yellow Header */}
            <div className="bg-brand-yellow px-6 py-8 text-center relative">
              {/* Verified Badge */}
              <div className="absolute right-4 top-4 bg-white px-3 py-1 rounded-md border border-black flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium">VERIFIED</span>
              </div>

              {/* Logo */}
              <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-yellow text-4xl font-bold">P</span>
              </div>

              {/* Shop Name */}
              <h2 className="text-2xl font-bold text-black mb-2">{shop.name}</h2>
              
              {/* PrintEasy QR */}
              <div className="flex items-center justify-center gap-2 text-black">
                <span className="text-lg">🔲</span>
                <span className="text-lg">PrintEasy QR</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="px-6 py-8 text-center">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="mx-auto mb-6"
                  style={{ width: '250px', height: '250px' }}
                />
              )}

              {/* Shop Contact */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">Shop Contact</h3>
                <p className="text-gray-700 flex items-center justify-center gap-2">
                  <span>📞</span>
                  <span>{shop.phone}</span>
                </p>
              </div>

              {/* How to Use */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">How to Use This QR Code</h3>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <p className="font-semibold">Open Camera App</p>
                      <p className="text-sm text-gray-600">Point your phone camera at this QR code</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <p className="font-semibold">Tap the Link</p>
                      <p className="text-sm text-gray-600">Your phone will show a notification - tap it</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <p className="font-semibold">Start Ordering</p>
                      <p className="text-sm text-gray-600">Upload files or book walk-in appointments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <p className="font-semibold">Track & Collect</p>
                      <p className="text-sm text-gray-600">Monitor progress and get notified when ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black text-white px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">P</span>
                </div>
                <span className="font-bold text-lg">PrintEasy</span>
              </div>
              <div className="text-sm space-x-4 mb-2">
                <span>⭕ Secure</span>
                <span>⭐ Fast</span>
                <span>☐ Easy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4 bg-gray-50 border-t">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-black"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}