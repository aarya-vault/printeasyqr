import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Search, MapPin, Clock, Store, Printer, Phone, 
  Mail, Star, Users, Award, ArrowLeft, ExternalLink,
  Filter, X, CheckCircle, AlertCircle, Building2,
  Timer, Calendar, Shield, Lock, Unlock, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import { LocationDisplay } from '@/hooks/use-location-from-pincode';

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  publicOwnerName: string;
  completeAddress: string;
  services: string[];
  equipment: string[];
  yearsOfExperience: number;
  workingHours: any;
  isOnline: boolean;
  rating: number;
  totalOrders: number;
  acceptsWalkinOrders: boolean;
}

export default function CustomerBrowseShops() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterOnline, setFilterOnline] = useState<boolean | null>(null);
  const [filterUnlocked, setFilterUnlocked] = useState<'all' | 'locked' | 'unlocked'>('all');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/shops'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch unlocked shops for the customer
  const { data: unlockedShopsData, isLoading: unlockedLoading } = useQuery({
    queryKey: [`/api/customer/${user?.id}/unlocked-shops`],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const unlockedShopIds = (unlockedShopsData as any)?.unlockedShopIds || [];
  
  // Unlock shop mutation
  const unlockShopMutation = useMutation({
    mutationFn: async (shopSlug: string) => {
      const response = await fetch(`/api/unlock-shop/${shopSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to unlock shop: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer/${user?.id}/unlocked-shops`] });
      toast({
        title: "Shop Unlocked!",
        description: "You can now place orders with this shop.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unlock Failed",
        description: error.message || "Failed to unlock shop. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add unlock status to shops
  const shopsWithUnlockStatus = shops.map((shop: Shop) => ({
    ...shop,
    isUnlocked: unlockedShopIds.includes(shop.id)
  }));

  // Filter shops based on search and filters
  const filteredShops = shopsWithUnlockStatus.filter((shop: Shop & { isUnlocked: boolean }) => {
    const matchesSearch = 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.pinCode.includes(searchQuery) ||
      shop.services?.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCity = !filterCity || shop.city.toLowerCase().includes(filterCity.toLowerCase());
    const matchesOnline = filterOnline === null || shop.isOnline === filterOnline;
    const matchesUnlocked = filterUnlocked === 'all' || 
      (filterUnlocked === 'locked' && !shop.isUnlocked) ||
      (filterUnlocked === 'unlocked' && shop.isUnlocked);

    return matchesSearch && matchesCity && matchesOnline && matchesUnlocked;
  });

  // Extract unique cities for filter
  const cities = Array.from(new Set(shops.map((shop: Shop) => shop.city))).sort();

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDetails(true);
  };

  const handleStartOrdering = (shop: Shop) => {
    navigate(`/shop/${shop.slug}`);
  };

  const handleUnlockShop = (shop: Shop) => {
    unlockShopMutation.mutate(shop.slug);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterOnline(null);
    setFilterUnlocked('all');
  };

  const isLoading = shopsLoading || unlockedLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate('/customer-dashboard')}
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-[#FFBF00]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Found {filteredShops.length} of {shops.length} shops
              </p>
              <p className="text-xs text-gray-400">
                {unlockedShopIds.length} unlocked shops
              </p>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-black mb-2">Browse Print Shops</h1>
          <p className="text-gray-600">
            Discover and unlock verified print shops. Scan QR codes or unlock shops to place orders.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Search */}
            <div className="lg:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search shops, cities, PIN codes, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* City Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00]"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            {/* Online Status Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterOnline === null ? '' : filterOnline.toString()}
                onChange={(e) => setFilterOnline(e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00]"
              >
                <option value="">All Status</option>
                <option value="true">Online</option>
                <option value="false">Offline</option>
              </select>
            </div>

            {/* Unlock Status Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterUnlocked}
                onChange={(e) => setFilterUnlocked(e.target.value as 'all' | 'locked' | 'unlocked')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00]"
              >
                <option value="all">All Shops</option>
                <option value="unlocked">Unlocked Only</option>
                <option value="locked">Locked Only</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            <div className="lg:col-span-2">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFBF00] mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading shops...</p>
          </div>
        ) : filteredShops.length > 0 ? (
          /* Shops Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop: Shop & { isUnlocked: boolean }) => (
              <Card key={shop.id} className="hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer relative">
                <CardContent className="p-6">
                  {/* Unlock Status Badge */}
                  <div className="absolute top-4 right-4">
                    {shop.isUnlocked ? (
                      <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                        <Unlock className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4 pr-20">
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-lg mb-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                            ? `${shop.city}, ${shop.state}`
                            : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Online Status */}
                  <div className="mb-4">
                    {shop.isOnline ? (
                      <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                    {shop.rating > 0 && (
                      <div className="inline-flex items-center text-xs text-gray-500 ml-2">
                        <Star className="w-3 h-3 fill-[#FFBF00] text-[#FFBF00] mr-1" />
                        {shop.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  {/* Services */}
                  {shop.services && shop.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {shop.services.slice(0, 3).map((service: string, index: number) => (
                          <span key={index} className="text-xs bg-[#FFBF00]/10 text-gray-700 px-2 py-1 rounded border border-[#FFBF00]/20">
                            {service}
                          </span>
                        ))}
                        {shop.services.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{shop.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience & Orders */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      <span>{shop.yearsOfExperience || 0} years exp.</span>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      <span>{shop.totalOrders || 0} orders</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {shop.isUnlocked ? (
                      <Button
                        onClick={() => handleStartOrdering(shop)}
                        className="w-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Start Ordering
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUnlockShop(shop)}
                        disabled={unlockShopMutation.isPending}
                        className="w-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium"
                      >
                        {unlockShopMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Unlocking...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Unlock Shop
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleShopClick(shop)}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-3">No Shops Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterCity || filterOnline !== null || filterUnlocked !== 'all'
                ? "Try adjusting your search or filters" 
                : "Check back later for verified print shops"}
            </p>
            {(searchQuery || filterCity || filterOnline !== null || filterUnlocked !== 'all') && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Shop Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Store className="w-6 h-6 mr-3 text-[#FFBF00]" />
              {selectedShop?.name}
              {selectedShop && unlockedShopIds.includes(selectedShop.id) && (
                <Badge className="bg-green-100 text-green-800 ml-3">
                  <Unlock className="w-3 h-3 mr-1" />
                  Unlocked
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete shop information and services
            </DialogDescription>
          </DialogHeader>
          
          {selectedShop && (
            <div className="space-y-6">
              {/* Status and Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedShop.isOnline ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Online & Available
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Currently Offline
                    </Badge>
                  )}
                  {selectedShop.acceptsWalkinOrders && (
                    <Badge className="bg-[#FFBF00]/20 text-black border border-[#FFBF00]/40">
                      Walk-in Orders
                    </Badge>
                  )}
                </div>
                {selectedShop.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-5 h-5 fill-[#FFBF00] text-[#FFBF00] mr-1" />
                    <span className="font-semibold">{selectedShop.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({selectedShop.totalOrders} orders)
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center text-black">
                  <MapPin className="w-4 h-4 mr-2 text-[#FFBF00]" />
                  Contact & Location
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Building2 className="w-4 h-4 mr-3 mt-0.5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedShop.completeAddress || selectedShop.address}</p>
                      <LocationDisplay 
                        city={selectedShop.city} 
                        state={selectedShop.state} 
                        pincode={selectedShop.pinCode}
                        className="text-sm text-gray-600"
                        showPincode={true}
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-900">{selectedShop.phone}</span>
                  </div>
                  {selectedShop.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-900">{selectedShop.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Services */}
              {selectedShop.services && selectedShop.services.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-black">
                    <Printer className="w-4 h-4 mr-2 text-[#FFBF00]" />
                    Services Offered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedShop.services.map((service: string, index: number) => (
                      <span key={index} className="bg-[#FFBF00]/10 text-gray-700 px-3 py-1 rounded-md text-sm border border-[#FFBF00]/20">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {selectedShop.equipment && selectedShop.equipment.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center text-black">
                    <Building2 className="w-4 h-4 mr-2 text-[#FFBF00]" />
                    Equipment Available
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedShop.equipment.map((item: string, index: number) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Shop Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Award className="w-8 h-8 text-[#FFBF00] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">{selectedShop.yearsOfExperience || 0}</p>
                  <p className="text-sm text-gray-600">Years Experience</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-[#FFBF00] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">{selectedShop.totalOrders || 0}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                {unlockedShopIds.includes(selectedShop.id) ? (
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      handleStartOrdering(selectedShop);
                    }}
                    className="flex-1 bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Start Ordering
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleUnlockShop(selectedShop);
                      setShowDetails(false);
                    }}
                    disabled={unlockShopMutation.isPending}
                    className="flex-1 bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium"
                  >
                    {unlockShopMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Unlock Shop
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}