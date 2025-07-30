import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, Search, Upload, Users, MapPin, Phone, 
  Clock, Star, Package, RefreshCw
} from 'lucide-react';
import LoadingScreen from '@/components/loading-screen';

export default function CustomerVisitedShops() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch visited shops
  const { data: visitedShops = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [`/api/shops/customer/${user?.id}/visited`],
    enabled: !!user?.id,
  });

  // Filter shops based on search
  const filteredShops = visitedShops.filter(shop => {
    const search = searchQuery.toLowerCase();
    return (
      shop.name.toLowerCase().includes(search) ||
      shop.city?.toLowerCase().includes(search) ||
      shop.phone?.includes(search)
    );
  });

  if (isLoading) {
    return <LoadingScreen message="Loading your visited shops..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-xl font-bold text-rich-black">Previously Visited Shops</h1>
                <p className="text-sm text-gray-500">{visitedShops.length} shops visited</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search shops by name, city, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Shops List */}
      <div className="px-6 py-6 pb-24">
        {filteredShops.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching shops' : 'No shops visited yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start by placing your first order!'
                }
              </p>
              {!searchQuery && (
                <Link href="/">
                  <Button className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
                    Browse Print Shops
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredShops.map((shop) => (
              <Card key={shop.id} className="bg-white hover:shadow-md transition-all">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-rich-black">{shop.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs ${shop.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                          {shop.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{shop.city || 'Location not specified'}</span>
                        </div>
                        {shop.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{shop.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                      onClick={() => navigate(`/shop/${shop.slug}?type=upload`)}
                      disabled={!shop.isOnline}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/shop/${shop.slug}?type=walkin`)}
                      disabled={!shop.isOnline}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Walk-in Order
                    </Button>
                  </div>

                  {!shop.isOnline && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Shop is currently offline
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/customer-dashboard">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Package className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </a>
          </Link>
          <Link href="/customer-orders">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Clock className="w-5 h-5 mb-1" />
              <span className="text-xs">Orders</span>
            </a>
          </Link>
          <Link href="/customer-visited-shops">
            <a className="flex flex-col items-center justify-center py-3 text-brand-yellow">
              <Star className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Shops</span>
            </a>
          </Link>
          <Link href="/customer-account-settings">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}