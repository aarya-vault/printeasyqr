import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { QrCode, Bell, LogOut, Store, Clock, Play, CheckCircle, DollarSign, Upload, Printer, MapPin, Phone, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { QRCodeModal } from '@/components/shop/qr-code-modal';
import UnifiedChatSystem from '@/components/unified-chat-system';
import { Order, Shop } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function ShopDashboard() {
  const [showQRCode, setShowQRCode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not a shop owner
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'shop_owner') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch shop details
  const { data: shops = [] } = useQuery({
    queryKey: ['/api/shops'],
    enabled: !!user,
  });

  const shop = (shops as Shop[]).find((s: Shop) => s.ownerId === user?.id);

  // Fetch shop orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/shop', shop?.id],
    enabled: !!shop,
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: Partial<Order> }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop'] });
      toast({
        title: "Order updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleAcceptOrder = async (orderId: number) => {
    await updateOrderMutation.mutateAsync({
      orderId,
      updates: { status: 'processing' }
    });
  };

  const handleMarkReady = async (orderId: number) => {
    await updateOrderMutation.mutateAsync({
      orderId,
      updates: { status: 'ready' }
    });
  };

  const handleMarkCompleted = async (orderId: number) => {
    await updateOrderMutation.mutateAsync({
      orderId,
      updates: { status: 'completed' }
    });
  };

  const handleOpenChat = (order: Order) => {
    setSelectedOrder(order);
    setShowChat(true);
  };

  if (!user || !shop) {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-medium-gray mx-auto mb-4" />
          <p className="text-medium-gray">Loading shop details...</p>
        </div>
      </div>
    );
  }

  // Filter orders by type and status
  const ordersArray = orders as Order[];
  const uploadOrders = ordersArray.filter((order: Order) => order.type === 'upload');
  const walkinOrders = ordersArray.filter((order: Order) => order.type === 'walkin');

  const newUploadOrders = uploadOrders.filter((order: Order) => order.status === 'new');
  const activeUploadOrders = uploadOrders.filter((order: Order) => ['processing', 'ready'].includes(order.status));
  const newWalkinOrders = walkinOrders.filter((order: Order) => order.status === 'new');
  const activeWalkinOrders = walkinOrders.filter((order: Order) => ['processing', 'ready'].includes(order.status));

  // Calculate stats
  const stats = {
    pending: ordersArray.filter((order: Order) => order.status === 'new').length,
    processing: ordersArray.filter((order: Order) => order.status === 'processing').length,
    ready: ordersArray.filter((order: Order) => order.status === 'ready').length,
    revenue: ordersArray
      .filter((order: Order) => order.status === 'completed')
      .reduce((sum: number, order: Order) => sum + (parseFloat(order.finalAmount || '0')), 0),
  };

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">{shop.name}</h1>
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${shop.isOnline ? 'bg-success-green' : 'bg-gray-400'}`}></span>
                  <span className={`text-sm ${shop.isOnline ? 'text-success-green' : 'text-gray-400'}`}>
                    {shop.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowQRCode(true)}
                className="bg-brand-yellow text-rich-black hover:bg-yellow-400"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-6 h-6 text-medium-gray" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pending}
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-medium-gray" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand-yellow rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-rich-black" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rich-black">{stats.pending}</p>
                  <p className="text-sm text-medium-gray">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-warning-amber rounded-lg flex items-center justify-center mr-3">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rich-black">{stats.processing}</p>
                  <p className="text-sm text-medium-gray">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-success-green rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rich-black">{stats.ready}</p>
                  <p className="text-sm text-medium-gray">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-rich-black rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-brand-yellow" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rich-black">₹{stats.revenue.toLocaleString()}</p>
                  <p className="text-sm text-medium-gray">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Orders Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Upload Orders - New */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-rich-black flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-brand-yellow" />
                  Upload - New
                  <Badge className="ml-auto bg-brand-yellow text-rich-black">
                    {newUploadOrders.length}
                  </Badge>
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {newUploadOrders.length === 0 ? (
                  <p className="text-center text-medium-gray text-sm py-4">No new upload orders</p>
                ) : (
                  newUploadOrders.map((order: Order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-rich-black text-sm">{order.title}</h4>
                        {order.isUrgent && (
                          <Badge className="text-xs text-warning-amber bg-warning-amber bg-opacity-20">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-medium-gray mb-2">Order #{order.id}</p>
                      <p className="text-xs text-medium-gray mb-3">
                        {order.specifications?.copies} copies • {order.specifications?.colorType} • {order.specifications?.paperSize}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="flex-1 bg-success-green text-white hover:bg-green-600 text-xs py-2"
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenChat(order)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Upload Orders - Active */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-rich-black flex items-center">
                  <Printer className="w-5 h-5 mr-2 text-warning-amber" />
                  Upload - Active
                  <Badge className="ml-auto bg-warning-amber text-white">
                    {activeUploadOrders.length}
                  </Badge>
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {activeUploadOrders.length === 0 ? (
                  <p className="text-center text-medium-gray text-sm py-4">No active upload orders</p>
                ) : (
                  activeUploadOrders.map((order: Order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-rich-black text-sm">{order.title}</h4>
                        <Badge className={`text-xs ${
                          order.status === 'processing' 
                            ? 'text-warning-amber bg-warning-amber bg-opacity-20' 
                            : 'text-success-green bg-success-green bg-opacity-20'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-medium-gray mb-2">Order #{order.id}</p>
                      <p className="text-xs text-medium-gray mb-3">
                        {order.specifications?.copies} copies • {order.specifications?.colorType} • {order.specifications?.paperSize}
                      </p>
                      <div className="flex space-x-2">
                        {order.status === 'processing' ? (
                          <Button 
                            size="sm"
                            onClick={() => handleMarkReady(order.id)}
                            className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-400 text-xs py-2"
                          >
                            Mark Ready
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleMarkCompleted(order.id)}
                            className="flex-1 bg-rich-black text-white hover:bg-gray-800 text-xs py-2"
                          >
                            Completed
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenChat(order)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Walk-in Orders - New */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-rich-black flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-rich-black" />
                  Walk-in - New
                  <Badge className="ml-auto bg-rich-black text-white">
                    {newWalkinOrders.length}
                  </Badge>
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {newWalkinOrders.length === 0 ? (
                  <p className="text-center text-medium-gray text-sm py-4">No new walk-in orders</p>
                ) : (
                  newWalkinOrders.map((order: Order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-rich-black text-sm">{order.title}</h4>
                        <Badge className="text-xs text-success-green bg-success-green bg-opacity-20">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </Badge>
                      </div>
                      <p className="text-xs text-medium-gray mb-2">Order #{order.id}</p>
                      <p className="text-xs text-medium-gray mb-3 line-clamp-2">
                        {order.description}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="flex-1 bg-success-green text-white hover:bg-green-600 text-xs py-2"
                        >
                          Confirm
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Walk-in Orders - Active */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-rich-black flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-success-green" />
                  Walk-in - Active
                  <Badge className="ml-auto bg-success-green text-white">
                    {activeWalkinOrders.length}
                  </Badge>
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {activeWalkinOrders.length === 0 ? (
                  <p className="text-center text-medium-gray text-sm py-4">No active walk-in orders</p>
                ) : (
                  activeWalkinOrders.map((order: Order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-rich-black text-sm">{order.title}</h4>
                        <Badge className={`text-xs ${
                          order.status === 'processing' 
                            ? 'text-warning-amber bg-warning-amber bg-opacity-20' 
                            : 'text-success-green bg-success-green bg-opacity-20'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-medium-gray mb-2">Order #{order.id}</p>
                      <p className="text-xs text-medium-gray mb-3 line-clamp-2">
                        {order.description}
                      </p>
                      <div className="flex space-x-2">
                        {order.status === 'processing' ? (
                          <Button 
                            size="sm"
                            onClick={() => handleMarkReady(order.id)}
                            className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-400 text-xs py-2"
                          >
                            Mark Ready
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleMarkCompleted(order.id)}
                            className="flex-1 bg-rich-black text-white hover:bg-gray-800 text-xs py-2"
                          >
                            Completed
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenChat(order)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        shopId={shop.id}
        shopName={shop.name}
      />
      
      <UnifiedChatSystem
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        initialOrderId={selectedOrder?.id}
        userRole="shop_owner"
      />
    </div>
  );
}
