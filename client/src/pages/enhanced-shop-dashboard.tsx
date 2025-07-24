import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Clock, CheckCircle2, AlertCircle, User, LogOut, 
  Package, MessageSquare, Settings, BarChart3, QrCode,
  Eye, MessageCircle, DollarSign, TrendingUp
} from 'lucide-react';

interface Order {
  id: number;
  title: string;
  description: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  customerName: string;
  customerPhone: string;
  createdAt: string;
  estimatedBudget?: number;
  finalAmount?: number;
  files?: string[];
  urgentOrder: boolean;
}

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  email: string;
  rating: number;
  totalOrders: number;
  isOnline: boolean;
  qrCode?: string;
}

export default function EnhancedShopDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch shop details
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['/api/shops/owner', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/shops/owner/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch shop details');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch shop orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/shop', shop?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/shop/${shop?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!shop?.id
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: any }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop', shop?.id] });
      toast({
        title: "Order Updated Successfully!",
        description: "The order status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle shop online status
  const toggleOnlineStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const response = await fetch(`/api/shops/${shop?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline }),
      });
      if (!response.ok) throw new Error('Failed to update shop status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops/owner', user?.id] });
      toast({
        title: "Shop Status Updated!",
        description: `Shop is now ${shop?.isOnline ? 'offline' : 'online'}.`,
      });
    }
  });

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: { status: newStatus }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'processing': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'ready': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'processing';
      case 'processing': return 'ready';
      case 'ready': return 'completed';
      default: return currentStatus;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'Start Processing';
      case 'processing': return 'Mark Ready';
      case 'ready': return 'Mark Completed';
      default: return 'Completed';
    }
  };

  // Calculate statistics
  const newOrders = orders.filter((o: Order) => o.status === 'new').length;
  const processingOrders = orders.filter((o: Order) => o.status === 'processing').length;
  const readyOrders = orders.filter((o: Order) => o.status === 'ready').length;
  const completedOrders = orders.filter((o: Order) => o.status === 'completed').length;
  const monthlyRevenue = orders
    .filter((o: Order) => o.status === 'completed' && o.finalAmount)
    .reduce((sum: number, o: Order) => sum + (o.finalAmount || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-rich-black mb-4">Please login to continue</h2>
          <Button onClick={() => window.location.href = '/'}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Loading shop dashboard...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-rich-black mb-4">No Shop Found</h2>
          <p className="text-medium-gray mb-6">Your shop application may still be under review</p>
          <Button onClick={() => window.location.href = '/'}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">{shop.name}</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-medium-gray">
                    {shop.isOnline ? 'Online' : 'Offline'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleOnlineStatusMutation.mutate(!shop.isOnline)}
                    disabled={toggleOnlineStatusMutation.isPending}
                  >
                    {shop.isOnline ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-medium-gray">Rating</div>
                <div className="text-lg font-bold text-rich-black">⭐ {shop.rating}</div>
              </div>
              <Button onClick={logout} variant="outline" className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">New Orders</p>
                  <p className="text-3xl font-bold text-blue-600">{newOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Processing</p>
                  <p className="text-3xl font-bold text-yellow-600">{processingOrders}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Ready</p>
                  <p className="text-3xl font-bold text-green-600">{readyOrders}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Revenue</p>
                  <p className="text-3xl font-bold text-rich-black">₹{monthlyRevenue}</p>
                </div>
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-rich-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="qr-code" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Order Management</h2>
              <Badge variant="outline" className="text-sm">
                {orders.length} Total Orders
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
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No orders yet</h3>
                  <p className="text-medium-gray">Orders from customers will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(order.status)}
                            <h3 className="text-lg font-semibold text-rich-black">{order.title}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            {order.urgentOrder && (
                              <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-medium-gray mb-2 line-clamp-2">{order.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-medium-gray">
                            <span>Customer: {order.customerName}</span>
                            <span>Order #{order.id}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.estimatedBudget && (
                              <span>Budget: ₹{order.estimatedBudget}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>Chat</span>
                          </Button>
                          {order.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                              disabled={updateOrderMutation.isPending}
                              className="bg-rich-black hover:bg-gray-800"
                            >
                              {getNextStatusLabel(order.status)}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Order Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Total Orders:</span>
                      <span className="font-semibold">{orders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Completed:</span>
                      <span className="font-semibold text-green-600">{completedOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Success Rate:</span>
                      <span className="font-semibold">
                        {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-medium-gray">This Month:</span>
                      <span className="font-semibold text-green-600">₹{monthlyRevenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Average Order:</span>
                      <span className="font-semibold">
                        ₹{completedOrders > 0 ? Math.round(monthlyRevenue / completedOrders) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Shop Rating:</span>
                      <span className="font-semibold">⭐ {shop.rating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Total Reviews:</span>
                      <span className="font-semibold">{Math.floor(shop.totalOrders * 0.7)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr-code" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>Shop QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-medium-gray">QR Code for walk-in orders</p>
                    </div>
                  </div>
                  <p className="text-medium-gray mb-4">
                    Customers can scan this QR code to place walk-in orders
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-medium-gray mb-2">Shop URL:</p>
                    <p className="text-sm font-mono bg-white p-2 rounded border">
                      printeasy.com/shop/{shop.slug}
                    </p>
                  </div>
                  <Button className="mt-4">Download QR Code</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-rich-black mb-2">
                      Shop Name
                    </label>
                    <Input value={shop.name} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-black mb-2">
                      Shop Email
                    </label>
                    <Input value={shop.email} disabled />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-rich-black mb-2">
                    Shop Address
                  </label>
                  <Textarea value={shop.address} disabled rows={3} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-rich-black">Shop Status</h4>
                    <p className="text-sm text-medium-gray">
                      {shop.isOnline ? 'Your shop is currently accepting orders' : 'Your shop is offline'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => toggleOnlineStatusMutation.mutate(!shop.isOnline)}
                    disabled={toggleOnlineStatusMutation.isPending}
                    variant={shop.isOnline ? "destructive" : "default"}
                  >
                    {shop.isOnline ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}