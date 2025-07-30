import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Package, Store, User, QrCode } from 'lucide-react';
import QRScanner from '@/components/common/qr-scanner';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BottomNavigationProps {
  className?: string;
}

export default function BottomNavigation({ className = '' }: BottomNavigationProps) {
  const [location] = useLocation();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const navItems = [
    {
      path: '/customer-dashboard',
      icon: Home,
      label: 'Home',
      isActive: location === '/customer-dashboard' || location === '/'
    },
    {
      path: '/customer-orders',
      icon: Package,
      label: 'Orders',
      isActive: location === '/customer-orders'
    },
    // QR Scanner will be in the middle as a special button
    {
      path: '/browse-shops',
      icon: Store,
      label: 'Shops',
      isActive: location === '/browse-shops' || location.includes('/shop/')
    },
    {
      path: '/customer-account',
      icon: User,
      label: 'Account',
      isActive: location === '/customer-account'
    }
  ];

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}>
        <div className="grid grid-cols-5 max-w-screen-xl mx-auto relative">
          {/* First two nav items */}
          {navItems.slice(0, 2).map(({ path, icon: Icon, label, isActive }) => (
            <Link key={path} to={path}>
              <div className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
                isActive 
                  ? 'text-brand-yellow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                <span className={`text-xs truncate ${isActive ? 'font-medium' : ''}`}>
                  {label}
                </span>
              </div>
            </Link>
          ))}
          
          {/* Central QR Scanner Button - Highlighted and Elevated */}
          <div className="flex flex-col items-center justify-center relative">
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-rich-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform -translate-y-2 transition-all duration-200 hover:scale-105 border-4 border-white"
            >
              <QrCode className="w-6 h-6" />
            </button>
            <span className="text-xs font-medium text-brand-yellow mt-1">Scan QR</span>
          </div>
          
          {/* Last two nav items */}
          {navItems.slice(2).map(({ path, icon: Icon, label, isActive }) => (
            <Link key={path} to={path}>
              <div className={`flex flex-col items-center justify-center py-3 px-2 min-h-[60px] transition-colors ${
                isActive 
                  ? 'text-brand-yellow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                <span className={`text-xs truncate ${isActive ? 'font-medium' : ''}`}>
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onShopUnlocked={(shopId, shopName) => {
            toast({
              title: "Shop Unlocked! 🎉",
              description: `You can now place orders at ${shopName}`
            });
            queryClient.invalidateQueries({ queryKey: [`/api/customer/${user?.id}/unlocked-shops`] });
          }}
        />
      )}
    </>
  );
}