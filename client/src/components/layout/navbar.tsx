import React from 'react';
import { Link } from 'wouter';
import { Printer, QrCode } from 'lucide-react';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';

interface NavbarProps {
  onShopLogin?: () => void;
  onShopApplication?: () => void;
  additionalActions?: React.ReactNode;
}

export function Navbar({ onShopLogin, onShopApplication, additionalActions }: NavbarProps) {

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
          
          {/* Mobile Navigation - QR Scanner only */}
          <div className="flex items-center md:hidden">
            {additionalActions}
          </div>
        </div>
      </div>
    </nav>
  );
}