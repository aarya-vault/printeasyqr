import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, Search, MapPin, Clock, Star, Users, Upload,
  Home, Package, ShoppingCart, User, Phone
} from 'lucide-react';
import LoadingScreen from '@/components/loading-screen';
import FloatingChatButton from '@/components/floating-chat-button';

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

  // Fetch active shops
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
  });

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
            {filteredShops.map((shop) => (
              <Card key={shop.id} className="bg-white hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-rich-black text-lg">{shop.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {shop.address}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        {shop.publicContactNumber}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        className={shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {shop.isOpen ? 'Open Now' : 'Closed'}
                      </Badge>
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
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                      onClick={() => navigate(`/shop/${shop.slug}?type=upload`)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/shop/${shop.slug}?type=walkin`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Walk-in Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/customer-dashboard">
            <div className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </div>
          </Link>
          <Link href="/customer-orders">
            <div className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Package className="w-5 h-5 mb-1" />
              <span className="text-xs">Orders</span>
            </div>
          </Link>
          <Link href="/browse-shops">
            <div className="flex flex-col items-center justify-center py-3 text-brand-yellow">
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Shops</span>
            </div>
          </Link>
          <Link href="/customer-account">
            <div className="flex flex-col items-center justify-center py-3 text-gray-500">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}