import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  MapPin,
  Clock,
  Store,
  Printer,
  Phone,
  Mail,
  Star,
  Users,
  Award,
  ArrowLeft,
  ExternalLink,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Building2,
  Timer,
  Calendar,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { LocationDisplay } from "@/hooks/use-location-from-pincode";
import UnifiedShopModal from "@/components/unified-shop-modal";

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

export default function AnonymousVisitorBrowseShops() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterOnline, setFilterOnline] = useState<boolean | null>(null);

  // Fetch all shops
  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["/api/shops"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter shops based on search and filters
  const filteredShops = shops.filter((shop: Shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.pinCode.includes(searchQuery) ||
      shop.services?.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCity =
      !filterCity || shop.city.toLowerCase().includes(filterCity.toLowerCase());
    const matchesOnline =
      filterOnline === null || shop.isOnline === filterOnline;

    return matchesSearch && matchesCity && matchesOnline;
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
    setFilterOnline(null);
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
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
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

            {/* Online Status Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterOnline === null ? "" : filterOnline.toString()}
                onChange={(e) =>
                  setFilterOnline(
                    e.target.value === "" ? null : e.target.value === "true",
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FFBF00] focus:border-[#FFBF00]"
              >
                <option value="">All Status</option>
                <option value="true">Online</option>
                <option value="false">Offline</option>
              </select>
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
              <Card
                key={shop.id}
                className="hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer"
                onClick={() => handleShopClick(shop)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-black text-base sm:text-lg mb-1 truncate">
                        {shop.name}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {shop.city &&
                          shop.state &&
                          shop.city !== "Unknown" &&
                          shop.state !== "Unknown"
                            ? `${shop.city}, ${shop.state}`
                            : shop.pinCode
                              ? `PIN: ${shop.pinCode}`
                              : "Location not available"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0 ml-2">
                      {shop.isOnline ? (
                        <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Online
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Offline
                        </Badge>
                      )}
                      {shop.acceptsWalkinOrders && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1"
                        >
                          Walk-ins
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  {shop.services && shop.services.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Services:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {shop.services
                          .slice(0, 3)
                          .map((service: string, index: number) => (
                            <span
                              key={index}
                              className="text-[10px] sm:text-xs bg-[#FFBF00]/10 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-[#FFBF00]/20"
                            >
                              {service}
                            </span>
                          ))}
                        {shop.services.length > 3 && (
                          <span className="text-[10px] sm:text-xs text-gray-500 px-1.5 sm:px-2 py-0.5 sm:py-1">
                            +{shop.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience & Orders */}
                  {(shop.yearsOfExperience > 0 || shop.totalOrders > 0) && (
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      {shop.yearsOfExperience > 0 && (
                        <div className="flex items-center">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span>{shop.yearsOfExperience} years exp.</span>
                        </div>
                      )}
                      {shop.totalOrders > 0 && (
                        <div className="flex items-center">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span>{shop.totalOrders} {shop.totalOrders === 1 ? 'order' : 'orders'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${shop.phone}`, "_self");
                      }}
                      className="w-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium text-xs sm:text-sm py-2"
                    >
                      <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Call the Shop
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShopClick(shop);
                      }}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00] text-xs sm:text-sm py-2"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
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
            <h3 className="text-xl font-semibold text-gray-600 mb-3">
              No Shops Found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterCity || filterOnline !== null
                ? "Try adjusting your search or filters"
                : "Check back later for verified print shops"}
            </p>
            {(searchQuery || filterCity || filterOnline !== null) && (
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
      />
    </div>
  );
}
