import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, Search, MapPin, Clock, Star, Users, Upload,
  Home, Package, ShoppingCart, User, Phone, Eye, Lock, Unlock
} from 'lucide-react';
import LoadingScreen from '@/components/loading-screen';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import BottomNavigation from '@/components/common/bottom-navigation';
import DetailedShopModal from '@/components/detailed-shop-modal';
import { useToast } from '@/hooks/use-toast';

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  publicName: string;
  publicContactNumber: string;
  isOpen: boolean;
  workingHours: any;
  servicesOffered: string[];
  equipmentAvailable: string[];
}

export default function BrowseShops() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopDetails, setShowShopDetails] = useState(false);
  const { toast } = useToast();

  // Fetch active shops
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch customer's unlocked shops - need to get current user ID first
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: unlockedData } = useQuery<{unlockedShopIds: number[]}>({
    queryKey: [`/api/customer/${userData?.id}/unlocked-shops`],
    enabled: !!userData?.id,
    staleTime: 5 * 60 * 1000,
  });

  const unlockedShopIds = unlockedData?.unlockedShopIds || [];

  // Check if shop is available (unlocked)
  const isShopUnlocked = (shopId: number) => {
    return unlockedShopIds.includes(shopId);
  };

  // Enhanced shop availability calculation
  const calculateShopAvailability = (shop: Shop) => {
    if (!shop.workingHours) return { isOpen: true, status: '24/7 Open' };
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const daySchedule = shop.workingHours[currentDay];
    if (!daySchedule || daySchedule.closed) {
      return { isOpen: false, status: 'Closed Today' };
    }
    
    const openTime = parseInt(daySchedule.open.split(':')[0]) * 60 + parseInt(daySchedule.open.split(':')[1]);
    const closeTime = parseInt(daySchedule.close.split(':')[0]) * 60 + parseInt(daySchedule.close.split(':')[1]);
    
    // Handle 24/7 shops (open equals close time)
    if (openTime === closeTime) {
      return { isOpen: true, status: '24/7 Open' };
    }
    
    // Handle overnight shops
    if (openTime > closeTime) {
      const isOpen = currentTime >= openTime || currentTime <= closeTime;
      return { 
        isOpen, 
        status: isOpen ? 'Open Now' : `Opens at ${daySchedule.open}` 
      };
    }
    
    // Regular hours
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    return { 
      isOpen, 
      status: isOpen ? 'Open Now' : currentTime < openTime ? `Opens at ${daySchedule.open}` : 'Closed'
    };
  };

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
    setShowShopDetails(true);
  };

  const handleOrderClick = (shop: Shop, type: 'upload' | 'walkin') => {
    if (!isShopUnlocked(shop.id)) {
      toast({
        title: "Shop Locked",
        description: "Please scan the shop's QR code to unlock ordering capabilities.",
        variant: "destructive",
      });
      return;
    }

    if (shop.slug) {
      navigate(`/shop/${shop.slug}?type=${type}`);
    } else {
      console.error('Shop slug is missing:', shop);
      toast({
        title: "Navigation Error",
        description: "Unable to navigate to shop. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter shops based on search
  const filteredShops = shops.filter(shop => {
    const search = searchQuery.toLowerCase();
    return (
      shop.name.toLowerCase().includes(search) ||
      shop.address.toLowerCase().includes(search) ||
      shop.servicesOffered.some(service => 
        service.toLowerCase().includes(search)
      )
    );
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/customer-dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Print Shops</h1>
                <p className="text-sm text-gray-500">{filteredShops.length} shops available</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search shops by name, location, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Shops List */}
      <div className="px-6 py-6">
        {filteredShops.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No shops found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try different search terms' : 'No print shops are currently available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredShops.map((shop) => {
              const availability = calculateShopAvailability(shop);
              const isUnlocked = isShopUnlocked(shop.id);
              
              return (
                <Card 
                  key={shop.id} 
                  className={`bg-white hover:shadow-md transition-all cursor-pointer ${
                    isUnlocked ? 'border-brand-yellow/50' : 'border-gray-200'
                  }`}
                  onClick={() => handleShopClick(shop)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-rich-black text-lg">{shop.name}</h3>
                          {isUnlocked ? (
                            <Unlock className="w-4 h-4 text-brand-yellow" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {shop.address || shop.publicAddress || 'Address not available'}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <Phone className="w-4 h-4 mr-1" />
                          {shop.publicContactNumber || shop.phone}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          className={availability.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {availability.status}
                        </Badge>
                        {!isUnlocked && (
                          <Badge variant="secondary" className="text-xs">
                            Scan QR to unlock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    {shop.servicesOffered && shop.servicesOffered.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {shop.servicesOffered.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {shop.servicesOffered.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{shop.servicesOffered.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShopClick(shop)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {isUnlocked ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
                            onClick={() => handleOrderClick(shop, 'upload')}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderClick(shop, 'walkin')}
                            className="text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Walk-in
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-xs opacity-50"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Scan QR
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-xs opacity-50"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Scan QR
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Centralized Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Chat Button */}
      <UnifiedFloatingChatButton />

      {/* Detailed Shop Modal */}
      <DetailedShopModal
        shop={selectedShop}
        isOpen={showShopDetails}
        onClose={() => setShowShopDetails(false)}
        onOrderClick={(type) => {
          if (selectedShop) {
            handleOrderClick(selectedShop, type);
            setShowShopDetails(false);
          }
        }}
      />
    </div>
  );
}