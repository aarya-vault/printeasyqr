import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Share2, Download, Camera, Upload, MessageCircle, Shield, FileCheck, Phone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import type { Shop } from '@shared/schema';
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
            <div className="text-center mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop Contact</h3>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <Phone className="w-5 h-5 text-brand-yellow" />
                <span className="font-medium">{shop.phone}</span>
              </div>
            </div>

            {/* Customer Guide Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-center text-gray-900 mb-4 flex items-center justify-center gap-2">
                <span className="bg-brand-yellow text-rich-black px-3 py-1 rounded-full text-sm font-bold">CUSTOMER GUIDE</span>
              </h3>
              
              <div className="space-y-3">
                {[
                  { 
                    icon: <Camera className="w-5 h-5" />, 
                    title: "Scan QR Code", 
                    desc: "Use your app scanner or visit printeasyqr.com and scan it" 
                  },
                  { 
                    icon: <Phone className="w-5 h-5" />, 
                    title: "Enter Details", 
                    desc: "Enter your name and phone number" 
                  },
                  { 
                    icon: <Upload className="w-5 h-5" />, 
                    title: "Upload & Order", 
                    desc: "Upload your files or create a walk-in order for tracking" 
                  },
                  { 
                    icon: <MessageCircle className="w-5 h-5" />, 
                    title: "Explore & Chat", 
                    desc: "Use dashboard, chat with shop owner - uploaded files auto-delete when complete" 
                  },
                  { 
                    icon: <Check className="w-5 h-5" />, 
                    title: "That's It! Trust", 
                    desc: "Voila! Monitor progress and get notified when ready" 
                  }
                ].map((step, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-rich-black font-bold text-xs sm:text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                        <span className="text-brand-yellow">{step.icon}</span>
                        {step.title}
                      </h4>
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