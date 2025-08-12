import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Clock, Phone, Printer, Eye, Lock, 
  Users, Package, CheckCircle, AlertCircle, Store, ExternalLink 
} from 'lucide-react';
import { Shop } from '@/types/shop';
import { isShopCurrentlyOpen, getWorkingHoursDisplay } from '@/utils/working-hours';

interface UnifiedShopCardProps {
  shop: Shop;
  isUnlocked?: boolean;
  onClick: () => void;
  showUnlockStatus?: boolean;
}

export default function UnifiedShopCard({ 
  shop, 
  isUnlocked = true, 
  onClick, 
  showUnlockStatus = false 
}: UnifiedShopCardProps) {
  const isCurrentlyOpen = isShopCurrentlyOpen(shop.workingHours);
  const workingHoursDisplay = getWorkingHoursDisplay(shop.workingHours);

  const handleGoogleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card onClick from firing
    if (shop.googleMapsLink) {
      window.open(shop.googleMapsLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
        isUnlocked ? 'border-gray-200 hover:border-[#FFBF00]' : 'border-gray-100 bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Only show exterior image if it exists */}
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
            
            {/* Status badges overlay on image */}
            <div className="absolute top-2 left-2 flex gap-2">
              {isCurrentlyOpen && shop.isOnline ? (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Open Now
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Closed
              </span>
            )}
            
            {shop.acceptsWalkinOrders && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#FFBF00]/20 text-black border-[#FFBF00]/40">
                Walk-in
              </span>
            )}
          </div>
        </div>
        )}

        {/* Status badges when no image */}
        {!shop.exteriorImage && (
          <div className="flex gap-2 mb-4">
            {isCurrentlyOpen && shop.isOnline ? (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Open Now
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Closed
              </span>
            )}
            
            {shop.acceptsWalkinOrders && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#FFBF00]/20 text-black border-[#FFBF00]/40">
                Walk-in
              </span>
            )}
          </div>
        )}

        {/* Shop Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
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
              {shop.completeAddress || shop.address}
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

        {/* Services */}
        {((shop.services && shop.services.length > 0) || 
          (shop.servicesOffered && shop.servicesOffered.length > 0)) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Printer className={`w-4 h-4 ${
                isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
              }`} />
              <span className={`text-xs font-medium ${
                isUnlocked ? 'text-gray-700' : 'text-gray-500'
              }`}>
                Services Available
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {((shop.services || shop.servicesOffered) || []).slice(0, 3).map((service, index) => (
                <span 
                  key={index} 
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    isUnlocked 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                >
                  {service}
                </span>
              ))}
              {((shop.services || shop.servicesOffered) || []).length > 3 && (
                <span 
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    isUnlocked 
                      ? 'border-gray-300 bg-gray-50' 
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                >
                  +{((shop.services || shop.servicesOffered) || []).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {shop.publicOwnerName && (
              <div className="flex items-center gap-1">
                <Users className={`w-4 h-4 ${
                  isUnlocked ? 'text-[#FFBF00]' : 'text-gray-400'
                }`} />
                <span className={`text-sm ${
                  isUnlocked ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {shop.publicOwnerName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Google Maps Button - Only show if link exists and shop is unlocked */}
            {shop.googleMapsLink && isUnlocked && (
              <button
                onClick={handleGoogleMapsClick}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-brand-yellow/20 text-black border-brand-yellow/40 hover:bg-brand-yellow hover:border-brand-yellow transition-colors"
                title="Open in Google Maps"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Maps
              </button>
            )}

            {showUnlockStatus ? (
              isUnlocked ? (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#FFBF00] text-black">
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-200 text-gray-600">
                  <Lock className="w-3 h-3 mr-1" />
                  Scan QR to Unlock
                </span>
              )
            ) : (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-[#FFBF00] text-black">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}