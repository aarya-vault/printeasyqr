import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/professional-layout';
import { DashboardStats, DashboardCard, QuickActions, DashboardTable } from '@/components/professional-dashboard';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Users,
  Search,
  Phone,
  MessageCircle,
  Eye,
  Settings,
  QrCode,
  Printer,
  FileText,
  Star,
  Upload
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { printFile, printAllFiles } from '@/utils/print-helpers';

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
  workingHours: any;
}

export default function ProfessionalShopDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch shop data
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/shop', shop?.id],
    enabled: !!shop?.id
  });

  // Filter orders based on search
  const filteredOrders = orders.filter(order =>
    order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  // Categorize orders
  const ordersByStatus = React.useMemo(() => ({
    new: orders.filter(o => o.status === 'new'),
    processing: orders.filter(o => o.status === 'processing'),
    ready: orders.filter(o => o.status === 'ready'),
    completed: orders.filter(o => o.status === 'completed')
  }), [orders]);

  // Calculate stats
  const stats = React.useMemo(() => [
    {
      label: 'New Orders',
      value: ordersByStatus.new.length,
      icon: <ShoppingBag className="h-4 w-4" />,
      changeType: 'positive' as const
    },
    {
      label: 'Processing',
      value: ordersByStatus.processing.length,
      icon: <Clock className="h-4 w-4" />,
      changeType: 'neutral' as const
    },
    {
      label: 'Ready for Pickup',
      value: ordersByStatus.ready.length,
      icon: <CheckCircle className="h-4 w-4" />,
      changeType: 'positive' as const
    },
    {
      label: 'Total Customers',
      value: new Set(orders.map(o => o.customer.phone)).size,
      icon: <Users className="h-4 w-4" />
    }
  ], [ordersByStatus, orders]);

  const quickActions = [
    {
      label: 'Shop Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => setLocation('/shop-settings'),
      variant: 'primary' as const
    },
    {
      label: 'QR Code',
      icon: <QrCode className="h-4 w-4" />,
      onClick: () => setLocation('/shop/qr'),
      variant: 'secondary' as const
    },
    {
      label: 'Order History',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => setLocation('/shop-order-history'),
      variant: 'outline' as const
    },
    {
      label: 'Notifications',
      icon: <MessageCircle className="h-4 w-4" />,
      onClick: () => setLocation('/shop-notifications'),
      variant: 'outline' as const
    }
  ];

  const handlePrintFiles = async (order: Order) => {
    if (!order.files || order.files.length === 0) return;
    
    try {
      await printAllFiles(order.files);
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ready: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  if (shopLoading || ordersLoading) {
    return (
      <DashboardLayout title="Shop Dashboard">
        <ProfessionalLoading message="Loading your shop dashboard..." size="lg" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Shop Dashboard"
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation('/shop-settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            className="btn-primary"
            onClick={() => setLocation('/shop/qr')}
          >
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
        </div>
      }
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          {shop?.name} Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            Manage your printing orders and customer communications.
          </p>
          <Badge 
            className={`${shop?.isAcceptingOrders ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border`}
          >
            {shop?.isAcceptingOrders ? 'Accepting Orders' : 'Closed'}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <DashboardStats stats={stats} loading={ordersLoading} />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Orders Management */}
      <div className="space-y-6">
        {/* Search and Filters */}
        <DashboardCard title="Order Management">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search orders by ID, customer name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-professional"
                />
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => setLocation('/shop-order-history')}
            >
              <FileText className="mr-2 h-4 w-4" />
              View History
            </Button>
          </div>

          {/* Orders Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Upload Orders */}
            <div className="space-y-4">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Orders ({filteredOrders.filter(o => o.type === 'upload').length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto optimized-scroll">
                {filteredOrders
                  .filter(order => order.type === 'upload')
                  .slice(0, 10)
                  .map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-black">#{order.id}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {order.unreadMessages}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                      <p className="text-sm font-medium text-black mb-3">
                        {order.customer.name} • {order.customer.phone}
                      </p>
                      
                      {order.files && order.files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {order.files.length} file(s)
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintFiles(order)}
                              className="text-xs"
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Print All
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/shop-dashboard/chat/${order.id}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${order.customer.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {filteredOrders.filter(o => o.type === 'upload').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No upload orders found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Walk-in Orders */}
            <div className="space-y-4">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <Users className="h-4 w-4" />
                Walk-in Orders ({filteredOrders.filter(o => o.type === 'walkin').length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto optimized-scroll">
                {filteredOrders
                  .filter(order => order.type === 'walkin')
                  .slice(0, 10)
                  .map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-black">#{order.id}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {order.unreadMessages}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                      <p className="text-sm font-medium text-black mb-3">
                        {order.customer.name} • {order.customer.phone}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/shop-dashboard/chat/${order.id}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${order.customer.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {filteredOrders.filter(o => o.type === 'walkin').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No walk-in orders found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No orders found for "{searchTerm}"</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}