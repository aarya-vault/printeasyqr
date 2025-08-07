import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';
import { isShopCurrentlyOpen, canPlaceWalkinOrder } from '@/utils/shop-timing';

interface ShopStatusIndicatorProps {
  shop: {
    isOnline: boolean;
    workingHours?: any;
    acceptsWalkinOrders?: boolean;
  };
  showWalkinStatus?: boolean;
}

export default function ShopStatusIndicator({ shop, showWalkinStatus = false }: ShopStatusIndicatorProps) {
  // Real-time updates for shop status
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute for real-time status checking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Use centralized timing utility for consistent shop availability checking
  const shopOpen = shop ? isShopCurrentlyOpen(shop) : false;
  const canPlaceWalkin = shop ? canPlaceWalkinOrder(shop) : false;

  // Debug shop status in console
  useEffect(() => {
    if (shop) {
      console.log('🔍 SHOP STATUS INDICATOR - Status check:', {
        name: shop.name || 'Unknown Shop',
        isOnline: shop.isOnline,
        shopOpen,
        canPlaceWalkin,
        workingHours: shop.workingHours,
        currentTime: currentTime.toLocaleTimeString()
      });
    }
  }, [shop, shopOpen, canPlaceWalkin, currentTime]);

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <Badge 
        variant={shopOpen ? 'default' : 'secondary'} 
        className={`text-xs ${
          shopOpen 
            ? 'bg-brand-yellow/80 text-rich-black hover:bg-brand-yellow' 
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {shopOpen ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Open
          </>
        ) : (
          <>
            <Clock className="w-3 h-3 mr-1" />
            Closed
          </>
        )}
      </Badge>

      {/* Walk-in Order Status */}
      {showWalkinStatus && shop.acceptsWalkinOrders && (
        <Badge 
          variant="outline" 
          className={`text-xs ${
            canPlaceWalkin 
              ? 'border-brand-yellow/50 text-brand-yellow bg-brand-yellow/10' 
              : 'border-gray-300 text-gray-500'
          }`}
        >
          Walk-in {canPlaceWalkin ? 'Available' : 'Closed'}
        </Badge>
      )}
    </div>
  );
}