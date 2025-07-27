import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ProfessionalLayout } from '@/components/professional-layout';
import { DashboardStats, DashboardCard, QuickActions } from '@/components/professional-dashboard';
import { ProfessionalLoading } from '@/components/professional-loading';
import ShopChatModal from '@/components/shop-chat-modal';
import MobileOrderQuickActions from '@/components/mobile-order-quick-actions';
import MobileChatPanel from '@/components/mobile-chat-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Upload,
  Phone,
  MapPin,
  MessageCircle,
  Bell,
  User,
  History,
  Star
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  shop: {
    id: number;
    name: string;
    publicContactNumber: string;
  };
  createdAt: string;
  unreadMessages: number;
}

interface Shop {
  id: number;
  name: string;
  area: string;
  city: string;
  orderCount: number;
  lastOrderDate: string;
}

export default function ProfessionalCustomerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrderForChat, setSelectedOrderForChat] = React.useState<number | null>(null);
  const [showMobileChat, setShowMobileChat] = React.useState(false);

  // Fetch customer data
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/customer', user?.id],
    enabled: !!user?.id
  });

  const { data: visitedShops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops/customer', user?.id, 'visited'],
    enabled: !!user?.id
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<any[]>({
    queryKey: ['/api/notifications/user', user?.id],
    enabled: !!user?.id
  });

  // Calculate stats
  const stats = React.useMemo(() => [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: <ShoppingBag className="h-4 w-4" />,
      change: orders.length > 0 ? `${orders.filter(o => o.createdAt.includes('2025')).length} this year` : undefined
    },
    {
      label: 'Active Orders',
      value: orders.filter(o => ['new', 'processing'].includes(o.status)).length,
      icon: <Clock className="h-4 w-4" />,
      changeType: 'positive' as const
    },
    {
      label: 'Completed Orders',
      value: orders.filter(o => o.status === 'completed').length,
      icon: <CheckCircle className="h-4 w-4" />,
      changeType: 'positive' as const
    },
    {
      label: 'Visited Shops',
      value: visitedShops.length,
      icon: <MapPin className="h-4 w-4" />
    }
  ], [orders, visitedShops]);

  const quickActions = [
    {
      label: 'Upload Files',
      icon: <Upload className="h-4 w-4" />,
      onClick: () => setLocation('/shops'),
      variant: 'primary' as const
    },
    {
      label: 'My Orders',
      icon: <ShoppingBag className="h-4 w-4" />,
      onClick: () => setLocation('/customer-orders'),
      variant: 'secondary' as const
    },
    {
      label: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      onClick: () => setLocation('/customer-notifications'),
      variant: 'outline' as const
    },
    {
      label: 'Account Settings',
      icon: <User className="h-4 w-4" />,
      onClick: () => setLocation('/customer-account-settings'),
      variant: 'outline' as const
    },
    {
      label: 'Order History',
      icon: <History className="h-4 w-4" />,
      onClick: () => setLocation('/customer-visited-shops'),
      variant: 'outline' as const
    },
    {
      label: 'Browse Shops',
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => setLocation('/shops'),
      variant: 'outline' as const
    }
  ];

  if (ordersLoading || shopsLoading) {
    return (
      <ProfessionalLayout title="Customer Dashboard">
        <ProfessionalLoading message="Loading your dashboard..." size="lg" />
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout title="Customer Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          Welcome back, {user?.name || 'Customer'}!
        </h1>
        <p className="text-gray-600">
          Manage your printing orders and track progress with local shops.
        </p>
      </div>

      {/* Stats Overview */}
      <DashboardStats stats={stats} loading={ordersLoading} />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <DashboardCard
          title="Recent Orders"
          description="Your latest printing orders"
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/customer-orders')}
            >
              View All
            </Button>
          }
        >
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Start your first printing order with a local shop.</p>
              <Button 
                className="btn-primary"
                onClick={() => setLocation('/shops')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Place First Order
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="block lg:hidden">
                  <MobileOrderQuickActions
                    order={order}
                    onChatOpen={() => {
                      setSelectedOrderForChat(order.id);
                      setShowMobileChat(true);
                    }}
                  />
                </div>
              ))}
              
              {/* Desktop view for larger screens */}
              <div className="hidden lg:block space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-black">#{order.id}</h4>
                        <Badge className={`status-${order.status}`}>
                          {order.status}
                        </Badge>
                        {order.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {order.unreadMessages} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{order.description}</p>
                      <p className="text-xs text-gray-500">
                        {order.shop.name} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                      >
                        View
                      </Button>
                      {order.unreadMessages > 0 && (
                        <Button
                          size="sm"
                          className="btn-primary"
                          onClick={() => setSelectedOrderForChat(order.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCard>

        {/* Visited Shops */}
        <DashboardCard
          title="Recently Visited Shops"
          description="Shops you've ordered from"
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/customer-visited-shops')}
            >
              View All
            </Button>
          }
        >
          {visitedShops.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shops yet</h3>
              <p className="text-gray-500 mb-4">Browse and connect with local print shops.</p>
              <Button 
                variant="outline"
                onClick={() => setLocation('/shops')}
              >
                Browse Shops
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visitedShops.slice(0, 3).map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-black mb-1">{shop.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {shop.area}, {shop.city}
                    </p>
                    <p className="text-xs text-gray-500">
                      {shop.orderCount} orders • Last: {new Date(shop.lastOrderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation(`/shop/${shop.id}`)}
                  >
                    Order Again
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Notifications Preview */}
      {!notificationsLoading && (notifications as any[]).length > 0 && (
        <Card className="card-professional">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/customer-notifications')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(notifications as any[]).slice(0, 3).map((notification: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-black font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Chat Panel */}
      {showMobileChat && selectedOrderForChat && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileChat(false)} />
          <div className="absolute bottom-0 left-0 right-0 h-[80vh]">
            <MobileChatPanel
              orderId={selectedOrderForChat}
              onClose={() => {
                setShowMobileChat(false);
                setSelectedOrderForChat(null);
              }}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Desktop Chat Modal */}
      {selectedOrderForChat && !showMobileChat && (
        <div className="hidden lg:block">
          <ShopChatModal
            orderId={selectedOrderForChat}
            onClose={() => setSelectedOrderForChat(null)}
          />
        </div>
      )}
    </ProfessionalLayout>
  );
}