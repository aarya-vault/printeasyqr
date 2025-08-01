import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import type { Shop } from '@shared/schema';

interface ProfessionalQRModalProps {
  shop: Shop;
  onClose: () => void;
}

export default function ProfessionalQRModal({ shop, onClose }: ProfessionalQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate shop URL
  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(shopUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl).catch(console.error);
  }, [shopUrl]);

  const handleDownload = async () => {
    try {
      toast({
        title: "Generating QR Code...",
        description: "Please wait while we create your high-quality image",
      });

      const response = await fetch('/api/generate-qr-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopName: shop.name,
          shopPhone: shop.phone,
          shopSlug: shop.slug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      // Get the image blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast({
        title: "QR Code Downloaded",
        description: "High-quality PNG saved to your device",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
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
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Shop link has been copied to clipboard",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden relative max-h-[95vh] overflow-y-auto">
        {/* Modal Content for Preview */}
        <div ref={qrRef} className="bg-white">
          {/* Header with Golden Background */}
          <div className="bg-[#FFBF00] px-6 py-8 relative">
            {/* Verified Badge - Positioned in top right */}
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1">
              <svg className="w-4 h-4 text-[#FFBF00]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">VERIFIED</span>
            </div>

            {/* Logo and Shop Name */}
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-[#FFBF00] font-bold text-2xl">P</span>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">{shop.name}</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-[#FFBF00] font-bold text-xs">QR</span>
                </div>
                <span className="text-black font-semibold">PrintEasy QR</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-4 sm:p-8">
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 sm:w-64 sm:h-64 mx-auto block"
                  crossOrigin="anonymous"
                />
              )}
            </div>

            {/* Shop Contact */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop Contact</h3>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">{shop.phone}</span>
              </div>
            </div>

            {/* How to Use Section */}
            <div className="space-y-4 mb-6 sm:mb-8">
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-4">How to Use This QR Code</h3>
              
              <div className="space-y-3">
                {[
                  { num: 1, title: "Open Camera App", desc: "Point your phone camera at this QR code" },
                  { num: 2, title: "Tap the Link", desc: "Your phone will show a notification - tap it" },
                  { num: 3, title: "Start Ordering", desc: "Upload files or book walk-in appointments" },
                  { num: 4, title: "Track & Collect", desc: "Monitor progress and get notified when ready" }
                ].map((step) => (
                  <div key={step.num} className="flex gap-3 sm:gap-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold text-xs sm:text-sm">{step.num}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{step.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-black px-6 py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">P</span>
              </div>
              <span className="text-white font-semibold">PrintEasy</span>
            </div>
            <div className="flex items-center justify-center gap-6 text-white/80 text-xs">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>Easy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Outside the preview area */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 text-sm"
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 text-sm"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-[#FFBF00] text-black hover:bg-[#E5AC00] text-sm font-semibold"
              data-testid="button-download-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </div>

        {/* Close Button - Fixed outside the modal */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 z-10 border border-gray-200"
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}