import React, { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavbarProps {
  onShopLogin?: () => void;
  onShopApplication?: () => void;
}

export function Navbar({ onShopLogin, onShopApplication }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
              <Printer className="w-5 h-5 text-rich-black" />
            </div>
            <span className="text-xl font-bold text-rich-black">PrintEasy</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/apply-shop">
              <Button 
                variant="outline"
                className="border-rich-black text-rich-black hover:bg-rich-black hover:text-white"
              >
                Shop Application
              </Button>
            </Link>
            <Button 
              onClick={onShopLogin}
              className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
            >
              Shop Owner Login
            </Button>
            <Link href="/admin-login">
              <Button 
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                Admin Login
              </Button>
            </Link>
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
                <Link href="/apply-shop">
                  <Button 
                    variant="outline"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full border-rich-black text-rich-black hover:bg-rich-black hover:text-white"
                  >
                    Shop Application
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    onShopLogin?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500"
                >
                  Shop Owner Login
                </Button>
                <Link href="/admin-login">
                  <Button 
                    variant="outline"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Admin Login
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}