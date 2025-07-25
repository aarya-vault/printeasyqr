import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  User, LogOut, Package, Store, MapPin, Star, Clock, Phone, 
  Mail, Search, Upload, Calendar, MessageSquare, CheckCircle, 
  AlertCircle, RefreshCw, Plus, FileText, Printer, ArrowRight,
  ShoppingBag, History, Settings, Bell, Home
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
  shopId: number;
  title: string;
  status: string;
  shopName: string;
  createdAt: string;
  type: string;
  description?: string;
}

export default function OptimizedCustomerDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderType, setOrderType] = useState<'upload' | 'walkin'>('upload');
  const [orderDetails, setOrderDetails] = useState({
    title: '',
    description: '',
    files: [] as File[]
  });
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock unread count

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

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer', user?.id] });
      toast({
        title: "Success",
        description: "Order placed successfully!"
      });
      setShowOrderModal(false);
      resetOrderForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const filteredShops = shops.filter((shop: Shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.services.some((service: string) => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const activeOrders = orders.filter((order: Order) => 
    order.status !== 'completed' && order.status !== 'cancelled'
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

  const handlePlaceOrder = (shop: Shop, type: 'upload' | 'walkin') => {
    setSelectedShop(shop);
    setOrderType(type);
    setShowOrderModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setOrderDetails(prev => ({
        ...prev,
        files: Array.from(e.target.files!)
      }));
    }
  };

  const handleSubmitOrder = () => {
    if (!selectedShop || !orderDetails.title || !orderDetails.description) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      shopId: selectedShop.id,
      customerId: user?.id,
      title: orderDetails.title,
      description: orderDetails.description,
      type: orderType,
      status: 'new',
      isUrgent: false
    };

    createOrderMutation.mutate(orderData);
  };

  const resetOrderForm = () => {
    setOrderDetails({ title: '', description: '', files: [] });
    setSelectedShop(null);
    setOrderType('upload');
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
              <h1 className="text-xl font-bold text-rich-black">PrintEasy</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/customer-notifications')}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/customer-account-settings')}
              >
                <User className="w-4 h-4" />
              </Button>
              
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-rich-black">{user?.name || 'Customer'}</p>
                <p className="text-xs text-medium-gray">{user?.phone}</p>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Active Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{activeOrders.length}</p>
                </div>
                <Package className="w-8 h-8 text-brand-yellow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Total Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{orders.length}</p>
                </div>
                <History className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Available Shops</p>
                  <p className="text-2xl font-bold text-rich-black">{shops.length}</p>
                </div>
                <Store className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Saved Time</p>
                  <p className="text-2xl font-bold text-rich-black">2hrs</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="shops" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="shops" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Print Shops
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Print Shops Tab */}
          <TabsContent value="shops" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search shops, services, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Shops Grid */}
            {shopsLoading ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : filteredShops.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No shops found</h3>
                  <p className="text-medium-gray">Try adjusting your search</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop: Shop) => (
                  <Card key={shop.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{shop.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {shop.address}, {shop.city}
                          </CardDescription>
                        </div>
                        <Badge className={shop.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {shop.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{shop.rating ? Number(shop.rating).toFixed(1) : '0.0'}</span>
                        </div>
                        <span className="text-medium-gray">•</span>
                        <span className="text-medium-gray">{shop.totalOrders} orders</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-rich-black mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2">
                          {shop.services.slice(0, 3).map((service: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {shop.services.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{shop.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handlePlaceOrder(shop, 'upload')}
                          className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                          disabled={!shop.isOnline}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                        <Button 
                          onClick={() => handlePlaceOrder(shop, 'walkin')}
                          variant="outline"
                          disabled={!shop.isOnline}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Walk-in
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-rich-black">Active Orders</h2>
              <Badge variant="outline">{activeOrders.length} Active</Badge>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : activeOrders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No active orders</h3>
                  <p className="text-medium-gray mb-4">Start by placing a new order</p>
                  <Button 
                    onClick={() => {
                      const shopsTab = document.querySelector('[value="shops"]') as HTMLButtonElement;
                      shopsTab?.click();
                    }}
                    className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                  >
                    Browse Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order: Order) => (
                  <Card key={order.id} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            {order.type === 'upload' ? 
                              <FileText className="w-6 h-6 text-gray-600" /> : 
                              <Calendar className="w-6 h-6 text-gray-600" />
                            }
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
                      
                      <p className="text-sm text-medium-gray mb-4">{order.description}</p>
                      
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
                            <Plus className="w-4 h-4 mr-2" />
                            Add Files
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <h2 className="text-xl font-semibold text-rich-black mb-4">Order History</h2>
            
            {orders.filter((order: Order) => order.status === 'completed').length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No completed orders</h3>
                  <p className="text-medium-gray">Your completed orders will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.filter((order: Order) => order.status === 'completed').map((order: Order) => (
                  <Card key={order.id} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-rich-black">{order.title}</h4>
                          <p className="text-sm text-medium-gray">{order.shopName} • Completed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Place {orderType === 'upload' ? 'File Upload' : 'Walk-in'} Order</CardTitle>
              <CardDescription>{selectedShop.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-rich-black">Order Title</label>
                <Input
                  placeholder="e.g., Business Cards, Resume Printing"
                  value={orderDetails.title}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-rich-black">Description</label>
                <Textarea
                  placeholder="Describe your printing requirements..."
                  value={orderDetails.description}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              {orderType === 'upload' && (
                <div>
                  <label className="text-sm font-medium text-rich-black">Upload Files</label>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="mt-1"
                    accept=".pdf,.doc,.docx,.jpg,.png,.txt"
                  />
                  {orderDetails.files.length > 0 && (
                    <p className="text-sm text-medium-gray mt-2">
                      {orderDetails.files.length} file(s) selected
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowOrderModal(false);
                    resetOrderForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitOrder}
                  className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-500"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}