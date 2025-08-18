import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, Search, Store, X, CheckCircle, SlidersHorizontal
} from 'lucide-react';
import LoadingScreen from '@/components/loading-screen';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import BottomNavigation from '@/components/common/bottom-navigation';
import UnifiedShopModal from '@/components/unified-shop-modal';
import UnifiedShopCard from '@/components/unified-shop-card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Shop } from '@/types/shop';
import { isShopCurrentlyOpen } from '@/utils/working-hours';

// Using imported Shop type from @/types/shop

export default function CustomerBrowseShops() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopDetails, setShowShopDetails] = useState(false);
  const [filterCity, setFilterCity] = useState('');

  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch active shops with performance optimization
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when available
  });

  // Fetch customer's unlocked shops - need to get current user ID first
  const { data: userData } = useQuery<{id: number}>({
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

  // Extract unique cities for filter
  const cities = Array.from(
    new Set(shops.map((shop: Shop) => shop.city)),
  ).sort();

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterOpenNow(false);
  };

  const handleShopClick = (shop: Shop) => {
    console.log('🔍 Shop data for detailed modal:', {
      name: shop.name,
      services: shop.services,
      equipment: shop.equipment,
      workingHours: shop.workingHours,
      yearsOfExperience: shop.yearsOfExperience,
      formationYear: shop.formationYear
    });
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

  // Filter shops based on search and filters
  const filteredShops = shops.filter((shop: Shop) => {
    const matchesSearch = searchQuery.trim() === '' ||
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.pinCode?.includes(searchQuery) ||
      shop.services?.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      shop.customServices?.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      shop.equipment?.some((equipment) =>
        equipment.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      shop.customEquipment?.some((equipment) =>
        equipment.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCity =
      !filterCity || shop.city.toLowerCase().includes(filterCity.toLowerCase());
    
    const matchesOpenNow = filterOpenNow 
      ? isShopCurrentlyOpen(shop.workingHours) 
      : true;

    return matchesSearch && matchesCity && matchesOpenNow;
  });

  // Sort shops - unlocked shops first with yellow border priority
  const sortedShops = [...filteredShops].sort((a, b) => {
    const aUnlocked = isShopUnlocked(a.id);
    const bUnlocked = isShopUnlocked(b.id);
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl font-bold text-rich-black">Browse Shops</h1>
              </div>
            </div>
          </div>
        </header>
        
        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFBF00] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading print shops...</p>
            <p className="text-gray-500 text-sm mt-2">Finding the best shops near you</p>
          </div>
        </div>
      </div>
    );
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

          {/* Search and Filters */}
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search shops by name, location, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00]"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              

              
              <Button
                onClick={() => setFilterOpenNow(!filterOpenNow)}
                variant={filterOpenNow ? "default" : "outline"}
                size="sm"
                className={`${
                  filterOpenNow 
                    ? "bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90" 
                    : "border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Open Now
              </Button>
              
              {(searchQuery || filterCity || filterOpenNow) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shops List */}
      <div className="px-6 py-6">
        {filteredShops.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-3">
              No Shops Found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterCity || filterOpenNow
                ? "Try adjusting your search or filters"
                : "No print shops are currently available"}
            </p>
            {(searchQuery || filterCity || filterOpenNow) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedShops.map((shop: Shop) => (
              <UnifiedShopCard
                key={shop.id}
                shop={shop}
                onClick={() => handleShopClick(shop)}
                showUnlockStatus={true}
                isUnlocked={isShopUnlocked(shop.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Centralized Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Chat Button */}
      <UnifiedFloatingChatButton />

      {/* Shop Details Modal */}
      <UnifiedShopModal
        isOpen={showShopDetails}
        onClose={() => setShowShopDetails(false)}
        shop={selectedShop}
      />
    </div>
  );
}