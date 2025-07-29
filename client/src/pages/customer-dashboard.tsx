import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Upload, MapPin, FileText, Image, Star, Bell, LogOut, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UploadOrderModal } from '@/components/order/upload-order-modal';
import { WalkinOrderModal } from '@/components/order/walkin-order-modal';
import UnifiedChatSystem from '@/components/unified-chat-system';
// Types will be defined inline to avoid import issues
import { formatDistanceToNow } from 'date-fns';

export default function CustomerDashboard() {
  const [showUploadOrder, setShowUploadOrder] = useState(false);
  const [showWalkinOrder, setShowWalkinOrder] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not a customer
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'customer') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Types
  interface Shop {
    id: number;
    name: string;
    address?: string;
    phone?: string;
  }

  interface Order {
    id: number;
    title: string;
    status: string;
    customerId: number;
    shopId: number;
    createdAt: string;
  }

  interface OrderFormData {
    shopId: number;
    title: string;
    description?: string;
    type: 'upload' | 'walkin';
    specifications?: any;
    walkinTime?: string;
    isUrgent?: boolean;
  }

  // Fetch shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/shops'],
    enabled: !!user,
  });

  // Fetch customer orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/customer', user?.id],
    enabled: !!user,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ orderData, files }: { orderData: OrderFormData; files?: File[] }) => {
      const formData = new FormData();
      formData.append('orderData', JSON.stringify({
        ...orderData,
        customerId: user!.id,
      }));

      if (files) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer'] });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleUploadOrder = async (orderData: OrderFormData, files: File[]) => {
    await createOrderMutation.mutateAsync({ orderData, files });
  };

  const handleWalkinOrder = async (orderData: OrderFormData) => {
    await createOrderMutation.mutateAsync({ orderData });
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    setShowChat(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-warning-amber bg-opacity-20 text-warning-amber';
      case 'ready':
        return 'bg-success-green bg-opacity-20 text-success-green';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderIcon = (type: string) => {
    return type === 'upload' ? FileText : MapPin;
  };

  if (!user) {
    return null;
  }

  const recentOrders = (orders as Order[]).slice(0, 5);
  const favoriteShops = (shops as Shop[]).slice(0, 3);

  return (
    <div className="min-h-screen bg-light-gray">
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
                <p className="text-sm text-medium-gray">
                  Welcome back, {user.name || 'Customer'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-6 h-6 text-medium-gray" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-rich-black">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 text-medium-gray" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center mr-4">
                  <Upload className="w-6 h-6 text-rich-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-rich-black">Upload Files</h3>
                  <p className="text-medium-gray text-sm">Submit documents for printing</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowUploadOrder(true)}
                className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
              >
                Start Upload Order
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-rich-black rounded-xl flex items-center justify-center mr-4">
                  <MapPin className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-rich-black">Walk-in Order</h3>
                  <p className="text-medium-gray text-sm">Pre-book for shop visit</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowWalkinOrder(true)}
                className="w-full bg-rich-black text-white hover:bg-gray-800"
              >
                Book Walk-in
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Orders */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-rich-black">Recent Orders</h2>
              <Button variant="link" className="text-brand-yellow hover:underline">
                View All
              </Button>
            </div>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-lg"></div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <p className="text-medium-gray">No orders yet. Place your first order!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order: Order) => {
                  const OrderIcon = getOrderIcon(order.type);
                  const shop = (shops as Shop[]).find((s: Shop) => s.id === order.shopId);
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-light-gray rounded-lg flex items-center justify-center">
                          <OrderIcon className="w-5 h-5 text-medium-gray" />
                        </div>
                        <div>
                          <p className="font-medium text-rich-black">{order.title}</p>
                          <p className="text-sm text-medium-gray">{shop?.name || 'Unknown Shop'}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="text-xs text-medium-gray mt-1">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenChat(order)}
                          className="text-brand-yellow hover:bg-brand-yellow hover:bg-opacity-10"
                        >
                          Chat
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Favorite Shops */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-rich-black mb-6">Available Shops</h2>
            
            {shopsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-32 rounded-lg"></div>
                ))}
              </div>
            ) : (shops as Shop[]).length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <p className="text-medium-gray">No shops available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {favoriteShops.map((shop: Shop) => (
                  <div key={shop.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-rich-black">{shop.name}</h3>
                      <span className={`w-3 h-3 rounded-full ${shop.isOnline ? 'bg-success-green' : 'bg-gray-400'}`}></span>
                    </div>
                    <p className="text-sm text-medium-gray mb-3">{shop.address}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-brand-yellow fill-current" />
                        <span className="text-sm text-medium-gray ml-1">{shop.rating}</span>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => setShowUploadOrder(true)}
                        className="text-brand-yellow hover:underline"
                      >
                        Order Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <UploadOrderModal
        isOpen={showUploadOrder}
        onClose={() => setShowUploadOrder(false)}
        shops={shops as Shop[]}
        onSubmit={handleUploadOrder}
      />
      
      <WalkinOrderModal
        isOpen={showWalkinOrder}
        onClose={() => setShowWalkinOrder(false)}
        shops={shops as Shop[]}
        onSubmit={handleWalkinOrder}
      />
      
      <UnifiedChatSystem
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        initialOrderId={selectedOrder?.id}
        userRole="customer"
      />
    </div>
  );
}
