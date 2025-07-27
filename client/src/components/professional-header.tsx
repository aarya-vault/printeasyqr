import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Bell, Menu, Settings, User, LogOut, Home, ShoppingBag, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfessionalHeaderProps {
  title?: string;
  showNavigation?: boolean;
  actions?: React.ReactNode;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  title,
  showNavigation = true,
  actions
}) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigationItems = React.useMemo(() => {
    if (!user) return [];

    const baseItems = [
      { href: '/', label: 'Home', icon: Home }
    ];

    if (user.role === 'customer') {
      return [
        ...baseItems,
        { href: '/customer/dashboard', label: 'Dashboard', icon: User },
        { href: '/customer/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/customer/notifications', label: 'Notifications', icon: Bell }
      ];
    }

    if (user.role === 'shop_owner') {
      return [
        ...baseItems,
        { href: '/shop/dashboard', label: 'Dashboard', icon: User },
        { href: '/shop/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/shop/settings', label: 'Settings', icon: Settings }
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { href: '/admin/dashboard', label: 'Dashboard', icon: User },
        { href: '/admin/applications', label: 'Applications', icon: Users },
        { href: '/admin/shops', label: 'Shops', icon: ShoppingBag }
      ];
    }

    return baseItems;
  }, [user]);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="brand-header hover:opacity-80 transition-opacity">
            <div className="brand-logo">P</div>
            <span className="brand-text">PrintEasy</span>
          </Link>

          {/* Page Title */}
          {title && (
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-black">{title}</h1>
            </div>
          )}

          {/* Navigation & Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            {showNavigation && (
              <nav className="hidden lg:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={`flex items-center gap-2 ${
                          isActive 
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                      <span className="text-black font-semibold text-sm">
                        {user.name?.charAt(0) || user.phone?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-black">
                        {user.name || user.phone || user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200">
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-sm font-semibold text-black">
                      {user.name || user.phone || user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Mobile Navigation Items */}
                  <div className="lg:hidden">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>

                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Button */}
            {!user && (
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};