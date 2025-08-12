import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Clock, Star, Phone, Printer, Eye, Lock, 
  Users, Package, CheckCircle, AlertCircle, Store 
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

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
        isUnlocked ? 'border-gray-200 hover:border-[#FFBF00]' : 'border-gray-100 bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Shop Image Section */}
        <div className="relative mb-4">
          {shop.exteriorImage ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src={shop.exteriorImage}
                alt={`${shop.name} exterior`}
                className={`w-full h-full object-cover transition-opacity ${
                  isUnlocked ? 'opacity-100' : 'opacity-60 grayscale'
                }`}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback placeholder */}
              <div 
                className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${
                  isUnlocked ? 'text-gray-500' : 'text-gray-400'
                }`}
                style={{ display: 'none' }}
              >
                <Store className="w-12 h-12" />
              </div>
            </div>
          ) : (
            /* No image placeholder */
            <div className={`aspect-video w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${
              isUnlocked ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <Store className="w-12 h-12" />
            </div>
          )}
          
          {/* Status badges overlay */}
          <div className="absolute top-2 left-2 flex gap-2">
            {isCurrentlyOpen && shop.isOnline ? (
              <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Open Now
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 text-xs px-2 py-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                Closed
              </Badge>
            )}
            
            {shop.acceptsWalkinOrders && (
              <Badge className="bg-[#FFBF00]/20 text-black border border-[#FFBF00]/40 text-xs px-2 py-1">
                Walk-in
              </Badge>
            )}
          </div>
        </div>

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
                {shop.rating && shop.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 fill-current ${
                      isUnlocked ? 'text-yellow-400' : 'text-gray-300'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isUnlocked ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {shop.rating}
                    </span>
                  </div>
                )}
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
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={`text-xs ${
                    isUnlocked 
                      ? 'border-gray-300 bg-white' 
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                >
                  {service}
                </Badge>
              ))}
              {((shop.services || shop.servicesOffered) || []).length > 3 && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    isUnlocked 
                      ? 'border-gray-300 bg-gray-50' 
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                >
                  +{((shop.services || shop.servicesOffered) || []).length - 3} more
                </Badge>
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
            {showUnlockStatus ? (
              isUnlocked ? (
                <Badge className="bg-[#FFBF00] text-black px-3 py-1 font-medium">
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-200 text-gray-600 px-3 py-1">
                  <Lock className="w-3 h-3 mr-1" />
                  Scan QR to Unlock
                </Badge>
              )
            ) : (
              <Badge className="bg-[#FFBF00] text-black px-3 py-1 font-medium">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}