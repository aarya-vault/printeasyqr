import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';

interface ShopStatusIndicatorProps {
  shop: {
    isOnline: boolean;
    workingHours?: any;
    acceptsWalkinOrders?: boolean;
  };
  showWalkinStatus?: boolean;
}

export default function ShopStatusIndicator({ shop, showWalkinStatus = false }: ShopStatusIndicatorProps) {
  // Calculate if shop is open based on current time and working hours (including 24/7 support)
  const isShopOpen = () => {
    if (!shop || !shop.isOnline) return false;
    
    // If no working hours defined, assume 24/7 operation
    if (!shop.workingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    // If day is marked as closed, shop is closed
    if (!todayHours || todayHours.closed) return false;
    
    // Handle 24/7 operation - if open time equals close time (00:00 = 00:00 or same times)
    if (todayHours.open === todayHours.close) return true;
    
    // Handle overnight operations (e.g., 22:00 to 06:00)
    if (todayHours.open > todayHours.close) {
      return currentTime >= todayHours.open || currentTime <= todayHours.close;
    }
    
    // Normal day operation
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const shopOpen = isShopOpen();
  const canPlaceWalkinOrder = shop.acceptsWalkinOrders && shopOpen;

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
            canPlaceWalkinOrder 
              ? 'border-brand-yellow/50 text-brand-yellow bg-brand-yellow/10' 
              : 'border-gray-300 text-gray-500'
          }`}
        >
          Walk-in {canPlaceWalkinOrder ? 'Available' : 'Closed'}
        </Badge>
      )}
    </div>
  );
}