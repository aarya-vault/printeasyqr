import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Share2, Download, Camera, Upload, MessageCircle, Shield, FileCheck, Phone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
// Local Shop interface
interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  publicOwnerName?: string;
  workingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  isOnline: boolean;
  acceptsWalkinOrders?: boolean;
}
import PrintEasyLogo from '@/components/common/printeasy-logo';

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
        description: "Please wait while we create your professional-quality image",
      });

      // Capture the fully rendered HTML from the client
      const renderedHtml = qrRef.current?.innerHTML;
      if (!renderedHtml) {
        throw new Error('Failed to capture QR content');
      }

      // Send to server for high-quality Puppeteer screenshot
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: renderedHtml,
          filename: `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server failed to generate QR code');
      }

      // Get the base64 image from JSON response
      const data = await response.json();
      if (!data.success || !data.image) {
        throw new Error('Invalid response from server');
      }
      
      // Convert base64 to blob
      const base64Data = data.image;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
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
        description: "Professional-quality PNG saved to your device",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Please try again",
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg overflow-hidden relative max-h-[95vh] overflow-y-auto">
        {/* Modal Content for Preview */}
        <div ref={qrRef} className="bg-white">
          {/* Header with Golden Background */}
          <div className="bg-brand-yellow px-6 py-6 relative">
            {/* Verified Badge - Positioned in top right */}
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Shield className="w-4 h-4 text-brand-yellow" />
              <span className="text-xs font-bold text-rich-black">VERIFIED</span>
            </div>

            {/* Logo and Shop Name */}
            <div className="text-center">
              {/* Exact PrintEasy Logo from Homepage */}
              <div className="flex justify-center mb-4">
                <PrintEasyLogo size="xl" showText={false} />
              </div>
              <h2 className="text-2xl font-bold text-rich-black mb-2">{shop.name}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-rich-black font-bold text-lg">PrintEasy QR</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-100">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto block"
                  crossOrigin="anonymous"
                />
              )}
            </div>

            {/* Shop Contact */}
            <div className="text-center mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-rich-black mb-2">Shop Contact</h3>
              <div className="flex items-center justify-center gap-2 text-rich-black">
                <Phone className="w-5 h-5 text-brand-yellow" />
                <span className="font-semibold">{shop.phone}</span>
              </div>
            </div>

            {/* Customer Guide Section */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-rich-black mb-2">Customer Guide</h3>
                <div className="w-16 h-1 bg-brand-yellow mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                {[
                  "Scan this QR via your app scanner or visit printeasyqr.com website and scan it",
                  "Enter your name and phone number", 
                  "Upload your files or create a walk-in order for tracking purpose",
                  "Explore dashboard, chat with shop owner and don't worry - uploaded files are auto-deleted when complete",
                  "Voila! That's it - trust the process"
                ].map((step, index) => (
                  <div key={index} className="flex gap-3 items-start bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-rich-black font-bold text-xs">{index + 1}</span>
                    </div>
                    <p className="text-sm text-rich-black leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-rich-black px-6 py-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PrintEasyLogo size="sm" showText={false} />
              <span className="text-white font-semibold">PrintEasy</span>
            </div>
            <div className="flex items-center justify-center gap-6 text-white/90 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3" />
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