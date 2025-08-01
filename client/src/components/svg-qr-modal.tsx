import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Share2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import QRCode from 'qrcode';

interface SvgQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: number;
    name: string;
    phone: string;
    slug: string;
  };
}

export default function SvgQrModal({ isOpen, onClose, shop }: SvgQrModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { toast } = useToast();
  
  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, shop]);

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Fetch SVG template
      const response = await fetch('/qr-poster-template.svg');
      let svgTemplate = await response.text();

      // Replace placeholders with actual data
      svgTemplate = svgTemplate.replace('{{shop_name}}', shop.name);
      svgTemplate = svgTemplate.replace('{{phone_number}}', shop.phone);
      svgTemplate = svgTemplate.replace('{{qr_code_data}}', qrCodeDataUrl);

      // Convert SVG to data URL for preview
      const svgBlob = new Blob([svgTemplate], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      setPreviewUrl(svgUrl);

    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code preview",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Fetch SVG template
      const response = await fetch('/qr-poster-template.svg');
      let svgTemplate = await response.text();

      // Replace placeholders
      svgTemplate = svgTemplate.replace('{{shop_name}}', shop.name);
      svgTemplate = svgTemplate.replace('{{phone_number}}', shop.phone);
      svgTemplate = svgTemplate.replace('{{qr_code_data}}', qrCodeDataUrl);

      // Create canvas for high-quality PNG export
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        // Draw the SVG onto canvas
        ctx.drawImage(img, 0, 0);

        // Convert to PNG and download
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
        }, 'image/png', 1.0);
      };

      img.onerror = () => {
        throw new Error('Failed to load SVG image');
      };

      // Convert SVG to data URL and load into image
      const svgBlob = new Blob([svgTemplate], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      img.src = svgUrl;

    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
      <DialogContent className="max-w-[500px] p-0">
        <VisuallyHidden>
          <DialogTitle>QR Code for {shop.name}</DialogTitle>
          <DialogDescription>
            Download and share the QR code for {shop.name} to allow customers to easily place orders
          </DialogDescription>
        </VisuallyHidden>
        <div className="relative">
          {/* Header with close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md mx-auto">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-yellow" />
                  <p className="text-gray-600">Generating QR code...</p>
                </div>
              ) : previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="QR Code Preview" 
                  className="w-full h-auto"
                  style={{ maxHeight: '600px', objectFit: 'contain' }}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-gray-500">
                  <p>Failed to load preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 p-4 bg-white border-t">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
              disabled={isGenerating}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
              disabled={isGenerating}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-black"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}