import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  User, LogOut, Package, Store, MapPin, Star, Clock, 
  Phone, Mail, Search, Filter, Upload, Calendar,
  MessageSquare, CheckCircle, AlertCircle, RefreshCw,
  Plus, ArrowRight, FileText, Camera, Printer
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  services: string[];
  workingHours: any;
  isOnline: boolean;
  totalOrders: number;
}

interface Order {
  id: number;
  title: string;
  status: string;
  shopName: string;
  createdAt: string;
  type: string;
}

export default function RevampedCustomerDashboard() {
  const { user, logout } = useAuth();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);

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
      if (!user?.id) return [];
      const response = await fetch(`/api/orders/customer/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user?.id
  });

  const filteredShops = shops.filter((shop: Shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.services.some((service: string) => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
      case 'new': return <Clock className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                <Printer className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">PrintEasy</h1>
                <p className="text-sm text-medium-gray">Customer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-medium-gray" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-rich-black">{user?.name}</p>
                  <p className="text-xs text-medium-gray">{user?.phone}</p>
                </div>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="shops" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Find Shops</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Orders</span>
            </TabsTrigger>
            <TabsTrigger value="new-order" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Order</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray">Total Orders</p>
                      <p className="text-2xl font-bold text-rich-black">{orders.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray">Available Shops</p>
                      <p className="text-2xl font-bold text-rich-black">{shops.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray">Active Orders</p>
                      <p className="text-2xl font-bold text-rich-black">
                        {orders.filter((order: Order) => order.status !== 'completed').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-brand-yellow bg-opacity-20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand-yellow" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    className="h-24 flex-col bg-blue-50 text-blue-700 hover:bg-blue-100 border-0"
                    onClick={() => {
                      const shopsTab = document.querySelector('[value="shops"]') as HTMLElement;
                      shopsTab?.click();
                    }}
                  >
                    <Store className="w-8 h-8 mb-2" />
                    Find Print Shops
                  </Button>
                  <Button 
                    className="h-24 flex-col bg-green-50 text-green-700 hover:bg-green-100 border-0"
                    onClick={() => {
                      const newOrderTab = document.querySelector('[value="new-order"]') as HTMLElement;
                      newOrderTab?.click();
                    }}
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    Upload Files
                  </Button>
                  <Button 
                    className="h-24 flex-col bg-purple-50 text-purple-700 hover:bg-purple-100 border-0"
                    onClick={() => {
                      const newOrderTab = document.querySelector('[value="new-order"]') as HTMLElement;
                      newOrderTab?.click();
                    }}
                  >
                    <Calendar className="w-8 h-8 mb-2" />
                    Book Walk-in
                  </Button>
                  <Button 
                    className="h-24 flex-col bg-orange-50 text-orange-700 hover:bg-orange-100 border-0"
                    onClick={() => {
                      const ordersTab = document.querySelector('[value="orders"]') as HTMLElement;
                      ordersTab?.click();
                    }}
                  >
                    <Package className="w-8 h-8 mb-2" />
                    Track Orders
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const ordersTab = document.querySelector('[value="orders"]') as HTMLElement;
                    ordersTab?.click();
                  }}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-rich-black mb-2">No orders yet</h3>
                    <p className="text-medium-gray mb-4">Start by finding a print shop and placing your first order</p>
                    <Button 
                      onClick={() => {
                        const shopsTab = document.querySelector('[value="shops"]') as HTMLElement;
                        shopsTab?.click();
                      }}
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                    >
                      Find Print Shops
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order: Order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-rich-black">{order.title}</h4>
                            <p className="text-sm text-medium-gray">{order.shopName}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Find Shops Tab */}
          <TabsContent value="shops" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Available Print Shops</CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search shops, services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {shopsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-medium-gray">Loading shops...</p>
                  </div>
                ) : filteredShops.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-rich-black mb-2">No shops found</h3>
                    <p className="text-medium-gray">Try adjusting your search terms</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredShops.map((shop: Shop) => (
                      <Card key={shop.id} className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-rich-black mb-2">{shop.name}</h3>
                              <div className="flex items-center text-sm text-medium-gray mb-2">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{shop.address}, {shop.city}</span>
                              </div>
                              <div className="flex items-center text-sm text-medium-gray">
                                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                <span>{typeof shop.rating === 'number' ? shop.rating.toFixed(1) : '4.5'} rating</span>
                                <span className="mx-2">•</span>
                                <span>{shop.totalOrders} orders</span>
                              </div>
                            </div>
                            <Badge className={shop.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {shop.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium text-rich-black mb-2">Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {shop.services.slice(0, 3).map((service: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {shop.services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{shop.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500"
                            onClick={() => {
                              setSelectedShop(shop);
                              const newOrderTab = document.querySelector('[value="new-order"]') as HTMLElement;
                              newOrderTab?.click();
                            }}
                          >
                            Select Shop
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-medium-gray">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-medium text-rich-black mb-3">No orders yet</h3>
                    <p className="text-medium-gray mb-6">Start by finding a print shop and placing your first order</p>
                    <Button 
                      onClick={() => document.querySelector('[value="shops"]')?.click()}
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                    >
                      Browse Print Shops
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: Order) => (
                      <Card key={order.id} className="border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                {order.type === 'upload' ? <FileText className="w-6 h-6 text-gray-600" /> : <Calendar className="w-6 h-6 text-gray-600" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-rich-black">{order.title}</h4>
                                <p className="text-sm text-medium-gray">{order.shopName}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-medium-gray">
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                              </Button>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-6">
            {!selectedShop ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-rich-black mb-3">Select a Print Shop First</h3>
                  <p className="text-medium-gray mb-6">Choose a print shop from the "Find Shops" tab to start placing an order</p>
                  <Button 
                    onClick={() => document.querySelector('[value="shops"]')?.click()}
                    className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                  >
                    Browse Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Selected Shop Info */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-rich-black">Selected Shop</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedShop(null)}
                      >
                        Change Shop
                      </Button>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                        <Store className="w-6 h-6 text-rich-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-rich-black mb-1">{selectedShop.name}</h4>
                        <p className="text-sm text-medium-gray mb-2">{selectedShop.address}, {selectedShop.city}</p>
                        <div className="flex items-center text-sm">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{typeof selectedShop.rating === 'number' ? selectedShop.rating.toFixed(1) : '4.5'}</span>
                          <span className="mx-2 text-medium-gray">•</span>
                          <span className="text-medium-gray">{selectedShop.totalOrders} orders completed</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Options */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-rich-black mb-2">Upload Files</h3>
                      <p className="text-medium-gray mb-6">Upload documents and specify printing requirements</p>
                      <Button 
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => setShowUploadModal(true)}
                      >
                        Upload & Order
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-rich-black mb-2">Walk-in Appointment</h3>
                      <p className="text-medium-gray mb-6">Book a time slot to visit the shop in person</p>
                      <Button 
                        className="w-full bg-green-600 text-white hover:bg-green-700"
                        onClick={() => setShowWalkinModal(true)}
                      >
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

      {/* Simple Modals */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Upload Order</h3>
            <p className="text-medium-gray mb-4">File upload functionality coming soon!</p>
            <Button onClick={() => setShowUploadModal(false)}>Close</Button>
          </div>
        </div>
      )}

      {showWalkinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Walk-in Appointment</h3>
            <p className="text-medium-gray mb-4">Appointment booking functionality coming soon!</p>
            <Button onClick={() => setShowWalkinModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}