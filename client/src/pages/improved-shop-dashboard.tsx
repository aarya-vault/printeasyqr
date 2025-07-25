import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  User, LogOut, Package, Phone, MessageSquare, Settings, 
  Clock, CheckCircle2, AlertCircle, QrCode, Search, Printer,
  DollarSign, Calendar, Filter, ChevronRight
} from 'lucide-react';

interface Order {
  id: number;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderType: 'uploaded-files' | 'walk-in';
  description: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  isUrgent: boolean;
  hasUnreadMessages?: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  files?: Array<{ id: string; name: string; }>;
}

export default function ImprovedShopDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Find shop by owner ID since we don't have shopId in user
  const { data: shopData, isLoading: shopLoading } = useQuery({
    queryKey: ['/api/shops/owner', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/shops/owner/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch shop');
      return response.json();
    },
    enabled: !!user?.id && user?.role === 'shop_owner'
  });

  const shop = shopData?.shop;

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/shop', shop?.id],
    queryFn: async () => {
      if (!shop?.id) return [];
      const response = await fetch(`/api/orders/shop/${shop.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!shop?.id
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop', shop?.id] });
      toast({
        title: "Success",
        description: "Order status updated successfully"
      });
    }
  });

  // Filter orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toString().includes(searchTerm) ||
                         order.customerPhone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Group orders by status
  const ordersByStatus = {
    new: filteredOrders.filter((o: Order) => o.status === 'new'),
    processing: filteredOrders.filter((o: Order) => o.status === 'processing'),
    ready: filteredOrders.filter((o: Order) => o.status === 'ready'),
    completed: filteredOrders.filter((o: Order) => o.status === 'completed')
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      new: 'processing',
      processing: 'ready',
      ready: 'completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
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

  if (shopLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-rich-black">{shop?.name || 'Shop Dashboard'}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/shop-chat')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/shop-settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <div className="h-8 w-px bg-gray-200" />
              
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-rich-black">{user?.name}</p>
                <p className="text-xs text-medium-gray">{user?.email}</p>
              </div>
              
              <Button 
                onClick={() => {
                  logout();
                  navigate('/');
                  toast({
                    title: "Signed Out",
                    description: "You have been successfully signed out",
                  });
                }}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">New Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{ordersByStatus.new.length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Processing</p>
                  <p className="text-2xl font-bold text-rich-black">{ordersByStatus.processing.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Ready</p>
                  <p className="text-2xl font-bold text-rich-black">{ordersByStatus.ready.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Completed</p>
                  <p className="text-2xl font-bold text-rich-black">{ordersByStatus.completed.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-brand-yellow/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Total Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{orders.length}</p>
                </div>
                <Package className="w-8 h-8 text-brand-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by customer name, phone, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
              className={selectedStatus === 'all' ? 'bg-brand-yellow text-rich-black' : ''}
            >
              All
            </Button>
            <Button
              variant={selectedStatus === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('new')}
              className={selectedStatus === 'new' ? 'bg-blue-500 text-white' : ''}
            >
              New
            </Button>
            <Button
              variant={selectedStatus === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('processing')}
              className={selectedStatus === 'processing' ? 'bg-yellow-500 text-white' : ''}
            >
              Processing
            </Button>
            <Button
              variant={selectedStatus === 'ready' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('ready')}
              className={selectedStatus === 'ready' ? 'bg-green-500 text-white' : ''}
            >
              Ready
            </Button>
          </div>
        </div>

        {/* Orders Grid - 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* New Orders */}
          <div className="space-y-3">
            <h3 className="font-semibold text-rich-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              New Orders ({ordersByStatus.new.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {ordersByStatus.new.map((order: Order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusUpdate={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                  />
                ))}
                {ordersByStatus.new.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No new orders</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Processing Orders */}
          <div className="space-y-3">
            <h3 className="font-semibold text-rich-black flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Processing ({ordersByStatus.processing.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {ordersByStatus.processing.map((order: Order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusUpdate={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                  />
                ))}
                {ordersByStatus.processing.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No processing orders</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Ready Orders */}
          <div className="space-y-3">
            <h3 className="font-semibold text-rich-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Ready for Pickup ({ordersByStatus.ready.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {ordersByStatus.ready.map((order: Order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusUpdate={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                  />
                ))}
                {ordersByStatus.ready.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No ready orders</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Completed Orders */}
          <div className="space-y-3">
            <h3 className="font-semibold text-rich-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gray-500" />
              Completed ({ordersByStatus.completed.length})
            </h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {ordersByStatus.completed.map((order: Order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusUpdate={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                  />
                ))}
                {ordersByStatus.completed.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No completed orders</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (status: string) => void }) {
  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      new: 'processing',
      processing: 'ready',
      ready: 'completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Start Processing';
      case 'processing': return 'Mark Ready';
      case 'ready': return 'Mark Completed';
      default: return '';
    }
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-rich-black">
                Order #{order.orderNumber}
              </p>
              {order.isUrgent && (
                <Badge className="bg-red-100 text-red-800 mt-1">
                  Urgent
                </Badge>
              )}
            </div>
            {order.hasUnreadMessages && (
              <Badge className="bg-blue-100 text-blue-800">
                {order.unreadCount} new
              </Badge>
            )}
          </div>

          {/* Customer Info */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-rich-black">
              {order.customerName}
            </p>
            <p className="text-xs text-gray-500">
              {order.customerPhone}
            </p>
          </div>

          {/* Order Details */}
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {order.orderType === 'uploaded-files' ? 'File Upload' : 'Walk-in'}
            </Badge>
            <p className="text-sm text-gray-600 line-clamp-2">
              {order.description}
            </p>
          </div>

          {/* Time */}
          <p className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleString()}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `tel:${order.customerPhone}`}
            >
              <Phone className="w-3 h-3 mr-1" />
              Call
            </Button>
            
            {nextStatus && (
              <Button
                size="sm"
                className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-500"
                onClick={() => onStatusUpdate(nextStatus)}
              >
                <ChevronRight className="w-3 h-3 mr-1" />
                {getNextStatusLabel(order.status)}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}