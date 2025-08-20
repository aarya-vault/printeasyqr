import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  Filter,
  X,
  ArrowLeft,
  Store,
  CheckCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import UnifiedShopModal from "@/components/unified-shop-modal";
import UnifiedShopCard from "@/components/unified-shop-card";
import { Shop } from "@/types/shop";
import { calculateUnifiedShopStatus } from "@/utils/shop-timing";

export default function AnonymousVisitorBrowseShops() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCity, setFilterCity] = useState("");

  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);

  // Fetch all shops - CRITICAL FIX: Reduced stale time for real-time updates
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
    staleTime: 30 * 1000, // Cache for 30 seconds only for immediate updates
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });

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
      );

    const matchesCity =
      !filterCity || shop.city.toLowerCase().includes(filterCity.toLowerCase());

    
    const matchesOpenNow = filterOpenNow 
      ? calculateUnifiedShopStatus({
          isOnline: shop.isOnline,
          workingHours: shop.workingHours,
          acceptsWalkinOrders: shop.acceptsWalkinOrders
        }).isOpen 
      : true;

    return matchesSearch && matchesCity && matchesOpenNow;
  });

  // Extract unique cities for filter
  const cities = Array.from(
    new Set(shops.map((shop: Shop) => shop.city)),
  ).sort();

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDetails(true);
  };

  const handleStartOrdering = (shop: Shop) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to place orders and unlock shops",
        variant: "default",
      });
      navigate("/");
      return;
    }

    navigate(`/shop/${shop.slug}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCity("");
    setFilterOpenNow(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="flex items-center text-gray-600 hover:text-[#FFBF00]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Found {filteredShops.length} of {shops.length} shops
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-black mb-2">
            Discover Print Shops
          </h1>
          <p className="text-gray-600">
            Explore verified print shops near you. Login to unlock shops and
            place orders.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Search */}
            <div className="lg:col-span-5">
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
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>



            {/* Open Now Filter */}
            <div className="lg:col-span-2">
              <Button
                onClick={() => setFilterOpenNow(!filterOpenNow)}
                variant={filterOpenNow ? "default" : "outline"}
                className={`w-full ${
                  filterOpenNow 
                    ? "bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90" 
                    : "border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Open Now
              </Button>
            </div>

            {/* Clear Filters */}
            <div className="lg:col-span-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredShops.map((shop: Shop) => (
              <UnifiedShopCard
                key={shop.id}
                shop={shop}
                onClick={() => handleShopClick(shop)}
                showUnlockStatus={!user}
                isUnlocked={!!user}
                onPlaceOrder={user ? (shop) => navigate(`/shop/${shop.slug}`) : undefined}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-3">
              No Shops Found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterCity || filterOpenNow
                ? "Try adjusting your search or filters"
                : "Check back later for verified print shops"}
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
        )}
      </div>

      {/* Shop Details Modal */}
      <UnifiedShopModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        shop={selectedShop}
        isUnlocked={!!user}
        onOrderClick={(shopSlug) => navigate(`/shop/${shopSlug}`)}
      />
    </div>
  );
}
