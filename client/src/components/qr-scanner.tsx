import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Camera, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onShopUnlocked?: (shopId: number, shopName: string) => void;
}

export default function QRScanner({ isOpen, onClose, onShopUnlocked }: QRScannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (isOpen && !user?.id) {
      setScanError('Please log in to scan QR codes');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to your account to scan QR codes',
        variant: 'destructive'
      });
    }
  }, [isOpen, user?.id, toast]);

  // Mutation to unlock shop
  const unlockShopMutation = useMutation({
    mutationFn: async ({ shopId, shopSlug }: { shopId?: number; shopSlug?: string }) => {
      // Validate user authentication
      if (!user?.id) {
        throw new Error('Please log in to scan QR codes');
      }
      
      // Validate shop identifier
      if (!shopId && !shopSlug) {
        throw new Error('Invalid QR code - no shop identifier found');
      }
      
      console.log('Unlocking shop:', { customerId: user.id, shopId, shopSlug });
      
      const response = await fetch('/api/customer/unlock-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: user.id, 
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
        description: `You can now place orders at ${data.shopName}`
      });
      
      // Invalidate queries to refresh unlocked shops
      queryClient.invalidateQueries({ queryKey: ['/api/customer/unlocked-shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      
      onShopUnlocked?.(data.shopId, data.shopName);
      onClose();
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
    if (isOpen && user?.id) {
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
  }, [isOpen, user?.id]);

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
      
      // Unlock the shop - handle both numeric IDs and slugs
      if (isNaN(shopId)) {
        // It's a shop slug
        unlockShopMutation.mutate({ shopSlug: shopIdentifier });
      } else {
        // It's a numeric shop ID
        unlockShopMutation.mutate({ shopId });
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
      <DialogContent className="w-full max-w-md mx-2 sm:mx-auto p-0">
        <DialogHeader className="p-4 bg-[#FFBF00]">
          <DialogTitle className="text-black font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan Shop QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Instructions */}
          <Card className="p-3 bg-gray-50 border-[#FFBF00]/30">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-[#FFBF00] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-black mb-1">How to unlock shops:</h4>
                <p className="text-xs text-gray-600">
                  Point your camera at a PrintEasy shop QR code to unlock ordering capabilities for that shop permanently.
                </p>
              </div>
            </div>
          </Card>

          {/* Scanner Area */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
            />
            
            {/* Loading overlay */}
            {!isScanning && !scanError && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-8 h-8 mx-auto mb-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Scan guidelines overlay */}
            {isScanning && (
              <div className="absolute inset-4 border-2 border-[#FFBF00] rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFBF00]"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFBF00]"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFBF00]"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFBF00]"></div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {scanError && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-red-800 mb-1">Scan Error</h4>
                  <p className="text-xs text-red-600">{scanError}</p>
                </div>
              </div>
            </Card>
          )}

          {unlockShopMutation.isPending && (
            <Card className="p-3 bg-[#FFBF00]/20 border-[#FFBF00]/50">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 animate-spin rounded-full border-2 border-[#FFBF00] border-t-transparent"></div>
                <div>
                  <h4 className="font-medium text-sm text-black mb-1">Unlocking Shop...</h4>
                  <p className="text-xs text-gray-600">Processing QR code and unlocking shop access</p>
                </div>
              </div>
            </Card>
          )}

          {/* Retry Button */}
          {scanError && (
            <Button
              onClick={initializeScanner}
              className="w-full bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-black"
              disabled={unlockShopMutation.isPending}
            >
              <Camera className="w-4 h-4 mr-2" />
              Retry Camera Access
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}