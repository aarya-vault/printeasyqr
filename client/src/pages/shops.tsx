import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { ProfessionalLayout } from '@/components/professional-layout';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Phone,
  Clock,
  Upload,
  Users,
  Search,
  Filter,
  ChevronRight,
  Store
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  services?: string[];
  isOnline: boolean;
  workingHours?: any;
  acceptsWalkinOrders?: boolean;
}

export default function ShopsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');

  // Fetch available shops
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops/available'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get unique services from all shops
  const allServices = React.useMemo(() => {
    const servicesSet = new Set<string>();
    shops.forEach(shop => {
      shop.services?.forEach(service => servicesSet.add(service));
    });
    return Array.from(servicesSet).sort();
  }, [shops]);

  // Filter shops based on search and service
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = selectedService === 'all' || 
      shop.services?.includes(selectedService);
    
    return matchesSearch && matchesService;
  });

  const handleShopClick = (shop: Shop) => {
    if (user) {
      setLocation(`/shop/${shop.id}/upload`);
    } else {
      setLocation(`/shop/${shop.id}`);
    }
  };

  if (isLoading) {
    return (
      <ProfessionalLayout title="Available Shops">
        <ProfessionalLoading message="Loading shops..." size="lg" />
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout title="Available Shops">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shops by name, city, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Service Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              >
                <option value="all">All Services</option>
                {allServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Shops Grid */}
        {filteredShops.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <Card 
                key={shop.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleShopClick(shop)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{shop.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {shop.city || 'Location not specified'}
                      </CardDescription>
                    </div>
                    <Badge className={shop.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {shop.isOnline ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Address */}
                  {shop.address && (
                    <p className="text-sm text-gray-600 mb-3">
                      {shop.address}
                    </p>
                  )}
                  
                  {/* Phone */}
                  {shop.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Phone className="h-3 w-3" />
                      {shop.phone}
                    </div>
                  )}
                  
                  {/* Services */}
                  {shop.services && shop.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {shop.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {shop.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{shop.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Order Types */}
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Files
                    </Badge>
                    {shop.acceptsWalkinOrders && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Walk-in
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <Button 
                    className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                    disabled={!shop.isOnline}
                  >
                    {shop.isOnline ? 'Visit Shop' : 'Currently Closed'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}