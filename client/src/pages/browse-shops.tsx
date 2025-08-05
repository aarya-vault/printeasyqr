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
  publicName?: string;
  publicAddress?: string;
  publicContactNumber?: string;
  isOpen?: boolean;
  isOnline?: boolean;
  workingHours?: Record<string, {
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean;
  }>;
  servicesOffered?: string[];
  equipmentAvailable?: string[];
  services?: string[];
  equipment?: string[];
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
    // Handle shops with no working hours data
    if (!shop.workingHours || typeof shop.workingHours !== 'object') {
      return { isOpen: shop.isOnline !== false, status: 'Hours not available' };
    }
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const daySchedule = shop.workingHours[currentDay];
    if (!daySchedule || daySchedule.closed) {
      return { isOpen: false, status: 'Closed Today' };
    }
    
    // Check for 24/7 operation
    if (daySchedule.is24Hours) {
      return { isOpen: true, status: 'Open 24 Hours' };
    }
    
    // Ensure open and close times exist
    if (!daySchedule.open || !daySchedule.close) {
      return { isOpen: false, status: 'Hours not available' };
    }
    
    const openTimeParts = daySchedule.open.split(':');
    const closeTimeParts = daySchedule.close.split(':');
    
    if (openTimeParts.length !== 2 || closeTimeParts.length !== 2) {
      return { isOpen: false, status: 'Invalid hours format' };
    }
    
    const openTime = parseInt(openTimeParts[0]) * 60 + parseInt(openTimeParts[1]);
    const closeTime = parseInt(closeTimeParts[0]) * 60 + parseInt(closeTimeParts[1]);
    
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
      (shop.servicesOffered || shop.services || []).some(service => 
        service.toLowerCase().includes(search)
      )
    );
  });

  // Sort shops - unlocked shops first
  const sortedShops = [...filteredShops].sort((a, b) => {
    const aUnlocked = isShopUnlocked(a.id);
    const bUnlocked = isShopUnlocked(b.id);
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedShops.map((shop) => {
              const availability = calculateShopAvailability(shop);
              const isUnlocked = isShopUnlocked(shop.id);
              
              return (
                <Card 
                  key={shop.id} 
                  className={`transition-all cursor-pointer ${
                    isUnlocked 
                      ? 'border-2 border-brand-yellow/50 hover:border-brand-yellow bg-gradient-to-br from-white to-brand-yellow/5 hover:shadow-lg' 
                      : 'border border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75'
                  }`}
                  onClick={() => handleShopClick(shop)}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Shop Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Shop Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isUnlocked ? 'bg-brand-yellow' : 'bg-gray-300'
                          }`}>
                            <Store className={`w-6 h-6 ${isUnlocked ? 'text-rich-black' : 'text-gray-600'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-bold text-lg ${isUnlocked ? 'text-rich-black' : 'text-gray-700'}`}>
                                {shop.name}
                              </h3>
                              {isUnlocked ? (
                                <Badge className="bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unlocked
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                            
                            {/* Availability Badge */}
                            <div className="mt-1">
                              <Badge 
                                className={`text-xs ${
                                  availability.isOpen 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {availability.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shop Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isUnlocked ? 'text-brand-yellow' : 'text-gray-400'}`} />
                        <span className={`text-sm line-clamp-2 ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                          {shop.address || shop.publicAddress || 'Address not available'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className={`w-4 h-4 flex-shrink-0 ${isUnlocked ? 'text-brand-yellow' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                          {shop.publicContactNumber || shop.phone}
                        </span>
                      </div>
                    </div>

                    {/* Services */}
                    {(shop.servicesOffered || shop.services) && (shop.servicesOffered || shop.services).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Printer className={`w-4 h-4 ${isUnlocked ? 'text-brand-yellow' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                            Services Available
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(shop.servicesOffered || shop.services || []).slice(0, 3).map((service, index) => (
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
                          {(shop.servicesOffered || shop.services || []).length > 3 && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                isUnlocked 
                                  ? 'border-gray-300 bg-gray-50' 
                                  : 'border-gray-200 bg-gray-100 text-gray-500'
                              }`}
                            >
                              +{(shop.servicesOffered || shop.services).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {isUnlocked ? (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium"
                            onClick={() => handleOrderClick(shop, 'upload')}
                          >
                            <Upload className="w-4 h-4 mr-1.5" />
                            Place Order
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                            onClick={() => handleShopClick(shop)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="flex-1 opacity-50"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Scan QR to Unlock
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-70"
                            onClick={() => handleShopClick(shop)}
                          >
                            <Eye className="w-4 h-4" />
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