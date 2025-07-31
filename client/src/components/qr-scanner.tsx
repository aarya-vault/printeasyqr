import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Camera, QrCode, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onShopUnlocked?: (shopId: number, shopName: string) => void;
  autoRedirect?: boolean; // Enhanced feature: redirect to order page after unlock
}

export default function QRScanner({ isOpen, onClose, onShopUnlocked, autoRedirect = false }: QRScannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  // No authentication check needed - anonymous users can scan QR codes too

  // Mutation to unlock shop (for authenticated users)
  const unlockShopMutation = useMutation({
    mutationFn: async ({ shopId, shopSlug }: { shopId?: number; shopSlug?: string }) => {
      // Validate shop identifier
      if (!shopId && !shopSlug) {
        throw new Error('Invalid QR code - no shop identifier found');
      }
      
      console.log('Unlocking shop:', { customerId: user?.id, shopId, shopSlug });
      
      const response = await fetch('/api/customer/unlock-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: user?.id, 
          shopId,
          shopSlug,
          qrScanLocation: 'dashboard_scanner'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unlock shop');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Shop Unlocked! 🎉',
        description: autoRedirect 
          ? `Redirecting to ${data.shopName} order page...`
          : `You can now place orders at ${data.shopName}`
      });
      
      // Invalidate queries to refresh unlocked shops
      queryClient.invalidateQueries({ queryKey: ['/api/customer/unlocked-shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      
      onShopUnlocked?.(data.shopId, data.shopName);
      onClose();
      
      // Enhanced QR Scan Workflow: Auto-redirect to order page with prefilled data
      if (autoRedirect && data.shopSlug) {
        setTimeout(() => {
          navigate(`/shop/${data.shopSlug}?source=qr&prefill=true`);
        }, 1000); // Brief delay to show success message
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Unable to unlock shop',
        description: error.message,
        variant: 'destructive'
      });
      setScanError(error.message);
    }
  });

  // Initialize scanner when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (videoRef.current) {
          initializeScanner();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setIsScanning(true);
      setScanError(null);
      
      if (!videoRef.current) return;

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScanSuccess(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
          preferredCamera: 'environment' // Use back camera on mobile
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();
      
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      setScanError('Unable to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const handleScanSuccess = (data: string) => {
    console.log('QR code scanned:', data);
    setLastScanResult(data);
    
    try {
      // Parse QR data - expecting PrintEasy shop QR format
      // Format: printeasy://shop/{shopId} or https://printeasy.com/shop/{shopSlug}
      
      let shopIdentifier: string | null = null;
      
      if (data.startsWith('printeasy://shop/')) {
        shopIdentifier = data.replace('printeasy://shop/', '');
      } else if (data.includes('/shop/')) {
        const matches = data.match(/\/shop\/([^\/\?#]+)/);
        shopIdentifier = matches?.[1] || null;
      }
      
      if (!shopIdentifier) {
        throw new Error('Invalid PrintEasy shop QR code');
      }
      
      // Check if it's a numeric shop ID or shop slug
      const shopId = parseInt(shopIdentifier);
      
      // Stop scanning temporarily while processing
      if (qrScannerRef.current) {
        qrScannerRef.current.pause();
      }
      
      // Handle shop access based on user authentication
      if (user?.id) {
        // Authenticated user - unlock the shop
        if (isNaN(shopId)) {
          // It's a shop slug
          unlockShopMutation.mutate({ shopSlug: shopIdentifier });
        } else {
          // It's a numeric shop ID
          unlockShopMutation.mutate({ shopId });
        }
      } else {
        // Anonymous user - redirect to shop page
        const shopUrl = isNaN(shopId) ? `/shop/${shopIdentifier}` : `/shop/${shopIdentifier}`;
        
        toast({
          title: 'Redirecting to Shop',
          description: 'You will be taken to the shop page to place orders'
        });
        
        onClose();
        
        // Navigate to shop page
        setTimeout(() => {
          window.location.href = shopUrl;
        }, 500);
      }
      
    } catch (error) {
      console.error('QR scan error:', error);
      setScanError(error instanceof Error ? error.message : 'Invalid QR code format');
      
      // Resume scanning after error
      setTimeout(() => {
        setScanError(null);
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
      }, 2000);
    }
  };

  const handleClose = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setScanError(null);
    setLastScanResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-2 sm:mx-auto p-0 overflow-hidden aspect-square">
        {/* Beautiful PrintEasy Header */}
        <div className="bg-brand-yellow p-6 text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-2 top-2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-rich-black"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* PrintEasy Logo and Title */}
          <div className="flex flex-col items-center mb-4">
            <div className="bg-rich-black rounded-full p-3 mb-3 shadow-lg">
              <Printer className="w-8 h-8 text-brand-yellow" />
            </div>
            <h2 className="text-2xl font-bold text-rich-black">PrintEasy</h2>
            <p className="text-rich-black/80 text-sm mt-1">Scan QR to Unlock Shop</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 space-y-3 bg-white">
          {/* Scanner Area - Centered and Square */}
          <div className="flex-1 flex items-center justify-center">

            <div className="relative w-full max-w-xs">
              <video
                ref={videoRef}
                className="w-full aspect-square bg-black rounded-2xl object-cover shadow-xl"
                playsInline
                muted
              />
            
              {/* Loading overlay */}
              {!isScanning && !scanError && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-10 h-10 mx-auto mb-3 animate-spin rounded-full border-3 border-brand-yellow border-t-transparent"></div>
                    <p className="text-sm font-medium">Starting camera...</p>
                  </div>
                </div>
              )}

              {/* Scan guidelines overlay */}
              {isScanning && (
                <div className="absolute inset-4 rounded-xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-yellow rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-yellow rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-yellow rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-yellow rounded-br-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-rich-black/80 px-3 py-1 rounded-full">
                      <p className="text-xs text-brand-yellow font-medium">Scanning...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions - Beautiful Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-brand-yellow" />
              </div>
              <h4 className="font-semibold text-sm text-rich-black">How to scan</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {user?.id 
                ? "Point your camera at a PrintEasy shop QR code to unlock ordering capabilities."
                : "Point your camera at a PrintEasy shop QR code to visit the shop and place orders."
              }
            </p>
          </div>

          {/* Status Messages */}
          {scanError && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-red-800 mb-1">Scan Error</h4>
                  <p className="text-xs text-red-600">{scanError}</p>
                </div>
              </div>
            </div>
          )}

          {unlockShopMutation.isPending && (
            <div className="bg-brand-yellow/10 rounded-xl p-4 border border-brand-yellow/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-brand-yellow border-t-transparent"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-rich-black mb-1">Unlocking Shop...</h4>
                  <p className="text-xs text-gray-600">Processing QR code and unlocking shop access</p>
                </div>
              </div>
            </div>
          )}

          {/* Retry Button - Beautiful Design */}
          {scanError && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={initializeScanner}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-semibold shadow-lg px-6"
                disabled={unlockShopMutation.isPending}
              >
                <Camera className="w-4 h-4 mr-2" />
                Retry Camera Access
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}