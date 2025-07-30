import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Search, MessageSquare, Phone, 
  Clock, CheckCircle, Download, Printer, QrCode
} from 'lucide-react';
import UnifiedChatSystem from '@/components/common/unified-chat-system';
import UnifiedFloatingChatButton from '@/components/common/unified-floating-chat-button';
import RedesignedShopQRModal from '@/components/common/redesigned-shop-qr-modal';

interface Order {
  id: number;
  title: string;
  type: string;
  status: string;
  customer: {
    name: string;
    phone: string;
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

export default function ShopDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch shop orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders/shop', user?.shopId],
    queryFn: async () => {
      if (!user?.shopId) throw new Error('No shop ID');
      const response = await fetch(`/api/orders/shop/${user.shopId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user?.shopId
  });

  // Fetch shop details
  const { data: shop } = useQuery({
    queryKey: ['/api/shops', user?.shopId],
    queryFn: async () => {
      if (!user?.shopId) throw new Error('No shop ID');
      const response = await fetch(`/api/shops/${user.shopId}`);
      if (!response.ok) throw new Error('Failed to fetch shop');
      return response.json();
    },
    enabled: !!user?.shopId
  });

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const activeOrders = orders.filter((order: Order) => 
    ['new', 'processing', 'ready'].includes(order.status)
  );

  const openChat = (orderId: number) => {
    setSelectedOrderId(orderId);
    setChatOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-[#FFBF00]/20 text-[#FFBF00]';
      case 'processing': return 'bg-[#FFBF00]/40 text-[#FFBF00]';
      case 'ready': return 'bg-[#FFBF00]/60 text-[#FFBF00]';
      case 'completed': return 'bg-[#FFBF00]/80 text-black';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{shop?.name || 'Shop Dashboard'}</h1>
            <p className="text-gray-600 mt-2">Manage your orders and customers</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowQRModal(true)}
              className="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-black"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Shop QR Code
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o: Order) => o.status === 'new').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o: Order) => o.status === 'processing').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o: Order) => 
                  o.status === 'completed' && 
                  new Date(o.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Management</CardTitle>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: Order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{order.title}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {order.unreadMessages} new
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Customer: {order.customer.name} • {order.customer.phone}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChat(order.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${order.customer.phone}`)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {order.files && order.files.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              order.files!.forEach((file: any) => {
                                window.open(`/uploads/${file.filename}`, '_blank');
                              });
                            }}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Print
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat System */}
      <UnifiedChatSystem
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialOrderId={selectedOrderId || undefined}
        userRole="shop_owner"
      />

      {/* Floating Chat Button */}
      <UnifiedFloatingChatButton />

      {/* QR Code Modal */}
      {shop && (
        <RedesignedShopQRModal
          shop={shop}
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}