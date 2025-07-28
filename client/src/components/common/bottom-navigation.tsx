import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Package, Store, User } from 'lucide-react';

interface BottomNavigationProps {
  className?: string;
}

export default function BottomNavigation({ className = '' }: BottomNavigationProps) {
  const [location] = useLocation();

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
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 ${className}`}>
      <div className="grid grid-cols-4 max-w-screen-xl mx-auto">
        {navItems.map(({ path, icon: Icon, label, isActive }) => (
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
  );
}