import React, { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';

interface NavbarProps {
  onShopLogin?: () => void;
  onShopApplication?: () => void;
  additionalActions?: React.ReactNode;
}

export function Navbar({ onShopLogin, onShopApplication, additionalActions }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if additionalActions contains a QR scanner button by converting to string
  const actionsString = React.isValidElement(additionalActions) ? additionalActions.toString() : '';
  const hasQRScanner = actionsString.includes('QrCode') || actionsString.includes('Scan QR');

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <PrintEasyLogoNav />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {additionalActions}
          </div>
          
          {/* Mobile Navigation - QR Scanner always visible */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Show QR Scanner directly in header on mobile */}
            {additionalActions}
            
            {/* Minimal hamburger menu for other actions if needed */}
            {onShopLogin && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5 text-rich-black" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-6">
                    <Button
                      onClick={() => {
                        onShopLogin();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      Shop Owner Login
                    </Button>
                    {onShopApplication && (
                      <Button
                        onClick={() => {
                          onShopApplication();
                          setIsMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Register Shop
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}