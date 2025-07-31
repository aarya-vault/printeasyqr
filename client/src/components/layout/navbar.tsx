import React, { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Printer } from 'lucide-react';
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
          
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-6 h-6 text-rich-black" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-6">
                {additionalActions && (
                  <div className="w-full">
                    {additionalActions}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}