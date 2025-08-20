import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Clock, Phone, Printer, Eye, Lock, 
  Users, Package, CheckCircle, AlertCircle, Store, ExternalLink, ShoppingCart 
} from 'lucide-react';
import { Shop } from '@/types/shop';
import { calculateUnifiedShopStatus } from '@/utils/shop-timing';
import { getWorkingHoursDisplay } from '@/utils/working-hours';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface UnifiedShopCardProps {
  shop: Shop;
  isUnlocked?: boolean;
  onClick: () => void;
  showUnlockStatus?: boolean;
  onPlaceOrder?: (shop: Shop) => void;
}

export default function UnifiedShopCard({ 
  shop, 
  isUnlocked = true, 
  onClick, 
  showUnlockStatus = false,
  onPlaceOrder 
}: UnifiedShopCardProps) {
  const [, navigate] = useLocation();
  const unifiedStatus = shop.unifiedStatus || calculateUnifiedShopStatus({
    isOnline: shop.isOnline,
    workingHours: shop.workingHours,
    acceptsWalkinOrders: shop.acceptsWalkinOrders
  });
  const workingHoursDisplay = getWorkingHoursDisplay(shop.workingHours);

  const handleGoogleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card onClick from firing
    if (shop.googleMapsLink) {
      window.open(shop.googleMapsLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlaceOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card onClick from firing
    if (onPlaceOrder) {
      onPlaceOrder(shop);
    } else if (shop.slug) {
      navigate(`/shop/${shop.slug}`);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
        isUnlocked ? 'border-[#FFBF00] bg-[#FFBF00]/5 hover:border-[#FFBF00] hover:bg-[#FFBF00]/10' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Status badges - Always show at the top regardless of image presence */}
        <div className="flex gap-2 mb-4">
          {/* Unified status */}
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            unifiedStatus.isOpen 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {unifiedStatus.isOpen ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {unifiedStatus.statusText}
          </span>
          
          {shop.acceptsWalkinOrders && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#FFBF00]/20 text-black border-[#FFBF00]/40">
              Walk-in
            </span>
          )}
        </div>

        {/* Shop exterior image if it exists */}
        {shop.exteriorImage && (
          <div className="relative mb-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src={shop.exteriorImage}
                alt={`${shop.name} exterior`}
                className={`w-full h-full object-cover transition-opacity ${
                  isUnlocked ? 'opacity-100' : 'opacity-60 grayscale'
                }`}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', shop.exteriorImage);
                }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', shop.exteriorImage);
                  // Hide entire image section if fails to load
                  const target = e.target as HTMLImageElement;
                  const imageContainer = target.closest('.relative');
                  if (imageContainer) {
                    (imageContainer as HTMLElement).style.display = 'none';
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Shop Header with Eye Icon */}
        <div className="mb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className={`font-bold text-lg mb-1 line-clamp-1 ${
                isUnlocked ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {shop.name}
              </h3>
              <div className="flex items-center gap-3 mb-2">
                {shop.totalOrders > 0 && (
                  <div className="flex items-center gap-1">
                    <Package className={`w-4 h-4 ${
                      isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm ${
                      isUnlocked ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {shop.totalOrders} {shop.totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Eye Icon for View Details - Top Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={`p-2 rounded-full transition-colors ${
                isUnlocked 
                  ? 'hover:bg-[#FFBF00]/20 text-[#FFBF00]' 
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="View Details"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shop Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
            }`} />
            <span className={`text-sm line-clamp-2 ${
              isUnlocked ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {shop.address || shop.completeAddress}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className={`w-4 h-4 flex-shrink-0 ${
              isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
            }`} />
            <span className={`text-sm ${
              isUnlocked ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {shop.phone}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 flex-shrink-0 ${
              isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
            }`} />
            <span className={`text-sm ${
              isUnlocked ? 'text-gray-700' : 'text-gray-500'
            }`}>
              {workingHoursDisplay}
            </span>
          </div>
        </div>

        {/* Services & Equipment */}
        {(() => {
          const allServices = [
            ...((shop.services || shop.servicesOffered) || []),
            ...((shop.customServices) || [])
          ].filter(Boolean);
          
          const allEquipment = [
            ...((shop.equipment || shop.equipmentAvailable) || []),
            ...((shop.customEquipment) || [])
          ].filter(Boolean);
          
          const allItems = [...allServices, ...allEquipment].filter(Boolean);
          
          return allItems.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Printer className={`w-4 h-4 ${
                  isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
                }`} />
                <span className={`text-xs font-medium ${
                  isUnlocked ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  Services & Equipment
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {allItems.slice(0, 4).map((item, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      isUnlocked 
                        ? 'border-gray-300 bg-white' 
                        : 'border-gray-200 bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item}
                  </span>
                ))}
                {allItems.length > 4 && (
                  <span 
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      isUnlocked 
                        ? 'border-gray-300 bg-gray-50' 
                        : 'border-gray-200 bg-gray-100 text-gray-500'
                    }`}
                  >
                    +{allItems.length - 4} more
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action Footer - Simplified */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {shop.publicOwnerName && (
              <div className="flex items-center gap-1">
                <Users className={`w-3.5 h-3.5 ${
                  isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
                }`} />
                <span className={`text-xs ${
                  isUnlocked ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {shop.publicOwnerName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Google Maps Button */}
            {shop.googleMapsLink && (
              <button
                onClick={handleGoogleMapsClick}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-[#FFBF00] hover:bg-[#FFBF00]/10 transition-colors"
                title="Open in Google Maps"
              >
                <MapPin className="w-3.5 h-3.5 mr-1" />
                Maps
              </button>
            )}

            {/* Place Order Button - Only show for unlocked shops */}
            {showUnlockStatus && isUnlocked && (
              <button
                onClick={handlePlaceOrderClick}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 transition-colors"
                title="Place an order"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                Place Order
              </button>
            )}

            {/* Lock indicator for locked shops */}
            {showUnlockStatus && !isUnlocked && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-gray-500">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Locked
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}