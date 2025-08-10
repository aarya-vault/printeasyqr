import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  shopName: string;
}

export function QRCodeModal({ isOpen, onClose, shopId, shopName }: QRCodeModalProps) {
  // Generate QR code data URL
  const qrCodeData = `${window.location.origin}/shop/${shopId}/order`;
  
  const handleDownload = () => {
    // This would typically generate and download a QR code image
    // For now, we'll show a success message
    console.log('Downloading QR code for:', qrCodeData);
  };

  const handlePrint = () => {
    // Print the QR code
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-rich-black">
            Shop QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {/* QR Code Display */}
          <div className="bg-light-gray rounded-xl p-8">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
              {/* Mock QR Code Pattern - In production, use a QR code library */}
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 64 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 ${
                      Math.random() > 0.5 ? 'bg-rich-black' : 'bg-white'
                    } rounded-sm`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center mt-4">
              <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center mr-2">
                <Printer className="w-4 h-4 text-rich-black" />
              </div>
              <span className="font-semibold text-rich-black">PrintEasy</span>
            </div>
            <p className="text-sm text-medium-gray mt-2">{shopName}</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-medium-gray">
              Customers can scan this QR code to directly access your shop's order page
            </p>
            
            <p className="text-xs text-medium-gray bg-light-gray p-3 rounded-lg break-all">
              {qrCodeData}
            </p>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button 
                onClick={handlePrint}
                className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-400"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print QR Code
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
