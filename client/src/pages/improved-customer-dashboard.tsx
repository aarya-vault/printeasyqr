import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, MapPin, Star, Clock, FileText, Search, 
  Plus, Phone, Mail, LogOut, Package, CheckCircle,
  AlertCircle, RefreshCw, Upload
} from 'lucide-react';


interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  rating: number;
  services: string[];
  isOnline: boolean;
  phone?: string;
}

interface Order {
  id: number;
  title: string;
  shopName: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  createdAt: string;
  type: 'upload' | 'walkin';
}

export default function ImprovedCustomerDashboard() {
  const { user, logout } = useAuth();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/shops'],
    queryFn: async () => {
      const response = await fetch('/api/shops');
      if (!response.ok) throw new Error('Failed to fetch shops');
      return response.json();
    }
  });

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/customer', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/customer/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user?.id
  });

  const filteredShops = shops.filter((shop: Shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-yellow-600" />;
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': return <Package className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">PrintEasy</h1>
                <p className="text-sm text-medium-gray">Customer Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-rich-black">{user?.name || 'Customer'}</p>
                <p className="text-xs text-medium-gray">{user?.phone}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="shops" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shops" className="flex items-center space-x-2">
              <Store className="w-4 h-4" />
              <span>Find Shops</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </TabsTrigger>
            <TabsTrigger value="new-order" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </TabsTrigger>
          </TabsList>

          {/* Find Shops Tab */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by shop name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Badge variant="outline" className="text-sm w-fit">
                {filteredShops.length} shops available
              </Badge>
            </div>

            {shopsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop: Shop) => (
                  <Card key={shop.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-rich-black">{shop.name}</h3>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-medium-gray">
                            {shop.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-medium-gray">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{shop.address}, {shop.city}</span>
                        </div>
                        <div className="flex items-center text-sm text-medium-gray">
                          <Star className="w-4 h-4 mr-2 text-yellow-500" />
                          <span>{typeof shop.rating === 'number' ? shop.rating.toFixed(1) : '4.5'} rating</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-rich-black mb-2">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {shop.services.slice(0, 3).map((service: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {shop.services.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{shop.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        onClick={() => setSelectedShop(shop)}
                        className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
                      >
                        Select Shop
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">My Orders</h2>
              <Badge variant="outline" className="text-sm">
                {orders.length} orders
              </Badge>
            </div>

            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No orders yet</h3>
                  <p className="text-medium-gray mb-6">Start by finding a print shop and placing your first order</p>
                  <Button onClick={() => {
                    const shopsTab = document.querySelector('[value="shops"]') as HTMLElement;
                    shopsTab?.click();
                  }}>
                    Find Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {getStatusIcon(order.status)}
                            <h3 className="text-lg font-semibold text-rich-black">{order.title}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-medium-gray">
                            <p>Shop: {order.shopName}</p>
                            <div className="flex items-center space-x-4">
                              <span>Order #{order.id}</span>
                              <span>Type: {order.type === 'upload' ? 'File Upload' : 'Walk-in'}</span>
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {order.status === 'ready' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Mark Collected
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-6">
            {!selectedShop ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">Select a Print Shop First</h3>
                  <p className="text-medium-gray mb-6">Choose a print shop from the "Find Shops" tab to start placing an order</p>
                  <Button onClick={() => {
                    const shopsTab = document.querySelector('[value="shops"]') as HTMLElement;
                    shopsTab?.click();
                  }}>
                    Browse Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="border-brand-yellow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Store className="w-5 h-5 text-brand-yellow" />
                      <span>Selected Shop: {selectedShop.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-medium-gray mb-1">Location</p>
                        <p className="font-medium">{selectedShop.address}, {selectedShop.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-medium-gray mb-1">Rating</p>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{typeof selectedShop.rating === 'number' ? selectedShop.rating.toFixed(1) : '4.5'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowUploadModal(true)}>
                    <CardContent className="p-8 text-center">
                      <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-rich-black mb-2">Upload Files</h3>
                      <p className="text-medium-gray mb-4">Upload your documents and specify printing requirements</p>
                      <Button className="w-full">
                        Start File Upload
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowWalkinModal(true)}>
                    <CardContent className="p-8 text-center">
                      <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-rich-black mb-2">Walk-in Order</h3>
                      <p className="text-medium-gray mb-4">Book an appointment to visit the shop with your materials</p>
                      <Button variant="outline" className="w-full">
                        Book Appointment
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals - Temporarily disabled for testing */}
      {showUploadModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Upload Order</h3>
            <p className="text-medium-gray mb-4">File upload functionality will be available soon.</p>
            <Button onClick={() => setShowUploadModal(false)}>Close</Button>
          </div>
        </div>
      )}

      {showWalkinModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Walk-in Order</h3>
            <p className="text-medium-gray mb-4">Walk-in booking functionality will be available soon.</p>
            <Button onClick={() => setShowWalkinModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}