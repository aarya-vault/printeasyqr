import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  Eye,
  MessageCircle,
  Phone,
  Printer,
  Search,
  Settings,
  QrCode,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  customer: {
    name: string;
    phone: string;
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

interface Shop {
  id: number;
  name: string;
  isAcceptingOrders: boolean;
}

interface DesktopShopRealtimePanelProps {
  shopId: number;
  onOrderSelect?: (order: Order) => void;
  onChatOpen?: (orderId: number) => void;
  className?: string;
}

export default function DesktopShopRealtimePanel({ 
  shopId, 
  onOrderSelect, 
  onChatOpen, 
  className = '' 
}: DesktopShopRealtimePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch shop data
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ['/api/shops', shopId],
    enabled: !!shopId,
  });

  // Fetch orders with real-time updates
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/shop', shopId],
    enabled: !!shopId,
    refetchInterval: 3000, // Real-time updates every 3 seconds for desktop
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop', shopId] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter orders based on search
  const filteredOrders = orders.filter(order =>
    order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  // Group orders by status
  const ordersByStatus = React.useMemo(() => ({
    new: filteredOrders.filter(o => o.status === 'new'),
    processing: filteredOrders.filter(o => o.status === 'processing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    completed: filteredOrders.filter(o => o.status === 'completed')
  }), [filteredOrders]);

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ready: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const handlePrintFiles = async (order: Order) => {
    if (!order.files || order.files.length === 0) return;
    
    try {
      // Simple print logic - would integrate with actual print system
      console.log('Printing files for order:', order.id);
      toast({
        title: "Print Started",
        description: `Printing ${order.files.length} file(s) for order #${order.id}`,
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Failed to print files. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (shopLoading || ordersLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Loading shop dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Desktop Shop Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black">{shop?.name} Dashboard</h1>
            <p className="text-gray-600">Manage orders and customer communications</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setLocation('/shop-settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
              onClick={() => setLocation('/shop/qr')}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'New Orders', value: ordersByStatus.new.length, color: 'text-blue-600' },
            { label: 'Processing', value: ordersByStatus.processing.length, color: 'text-yellow-600' },
            { label: 'Ready', value: ordersByStatus.ready.length, color: 'text-green-600' },
            { label: 'Completed Today', value: ordersByStatus.completed.length, color: 'text-gray-600' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders by customer, ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* 4-Column Order Management */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {/* New Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">New Orders</h3>
              <Badge variant="secondary">{ordersByStatus.new.length}</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {ordersByStatus.new.map((order) => (
                  <Card key={order.id} className="border-blue-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        {order.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {order.unreadMessages}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      
                      {order.files && order.files.length > 0 && (
                        <p className="text-xs text-gray-500 mb-3">
                          {order.files.length} file(s)
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'processing' })}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          Start Processing
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onChatOpen?.(order.id)}
                            className="flex-1 text-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.customer.phone}`)}
                            className="flex-1 text-xs"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {ordersByStatus.new.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No new orders</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Processing Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Processing</h3>
              <Badge variant="secondary">{ordersByStatus.processing.length}</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {ordersByStatus.processing.map((order) => (
                  <Card key={order.id} className="border-yellow-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        {order.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {order.unreadMessages}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      
                      {order.files && order.files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {order.files.length} file(s)
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintFiles(order)}
                            className="w-full text-xs"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print All
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          Mark Ready
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onChatOpen?.(order.id)}
                            className="flex-1 text-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {ordersByStatus.processing.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No orders processing</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Ready Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Ready for Pickup</h3>
              <Badge variant="secondary">{ordersByStatus.ready.length}</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {ordersByStatus.ready.map((order) => (
                  <Card key={order.id} className="border-green-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        {order.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {order.unreadMessages}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Ready for customer pickup
                      </p>
                      
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'completed' })}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs"
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          Mark Completed
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.customer.phone}`)}
                            className="flex-1 text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onChatOpen?.(order.id)}
                            className="flex-1 text-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {ordersByStatus.ready.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No orders ready</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Completed Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Completed</h3>
              <Badge variant="secondary">{ordersByStatus.completed.length}</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {ordersByStatus.completed.slice(0, 20).map((order) => (
                  <Card key={order.id} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Completed
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onChatOpen?.(order.id)}
                          className="flex-1 text-xs"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {ordersByStatus.completed.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No completed orders</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}