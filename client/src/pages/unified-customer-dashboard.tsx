import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { 
  Upload, MapPin, FileText, Bell, LogOut, Printer
} from 'lucide-react';
import { UploadOrderModal } from '@/components/order/upload-order-modal';
import { WalkinOrderModal } from '@/components/order/walkin-order-modal';
import UnifiedOrderCard from '@/components/unified-order-card';
import UnifiedChatSystem from '@/components/unified-chat-system';
import EnhancedCustomerOrderDetails from '@/components/enhanced-customer-order-details';
import BottomNavigation from '@/components/common/bottom-navigation';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files?: any;
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
  shop?: {
    id: number;
    name: string;
    phone?: string;
    publicContactNumber?: string;
    publicAddress?: string;
  };
}

export default function UnifiedCustomerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showUploadOrder, setShowUploadOrder] = useState(false);
  const [showWalkinOrder, setShowWalkinOrder] = useState(false);
  
  // Chat and order details states
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Redirect if not authenticated or not a customer
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'customer') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch customer orders - only active orders for dashboard
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Filter to show only active orders (not completed) in dashboard
  const activeOrders = allOrders.filter(order => order.status !== 'completed');

  // Recent active orders (last 3)
  const recentOrders = [...activeOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  // Chat and order details handlers
  const handleChatClose = () => {
    setSelectedOrderForChat(null);
  };

  const handleDetailsClose = () => {
    setSelectedOrderForDetails(null);
  };

  if (selectedOrderForChat) {
    return (
      <UnifiedChatSystem
        isOpen={true}
        onClose={handleChatClose}
        initialOrderId={selectedOrderForChat}
        userRole="customer"
      />
    );
  }

  if (selectedOrderForDetails) {
    return (
      <EnhancedCustomerOrderDetails
        order={selectedOrderForDetails}
        onClose={handleDetailsClose}
      />
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                <Printer className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">PrintEasy</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user.name || 'Customer'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-rich-black">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
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
                  <p className="text-gray-600 text-sm">Submit documents for printing</p>
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
                  <p className="text-gray-600 text-sm">Pre-book for shop visit</p>
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
        
        {/* Recent Active Orders */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-rich-black">Active Orders</h2>
              <Link href="/customer-orders">
                <Button variant="link" className="text-brand-yellow hover:underline">
                  View All Orders
                </Button>
              </Link>
            </div>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active orders. Place your first order!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <UnifiedOrderCard
                    key={order.id}
                    order={order}
                    userRole="customer"
                    onChatClick={(orderId) => setSelectedOrderForChat(orderId)}
                    onCallClick={(phone) => window.open(`tel:${phone}`)}
                    onViewDetails={(order) => setSelectedOrderForDetails(order)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      {showUploadOrder && (
        <UploadOrderModal
          isOpen={showUploadOrder}
          onClose={() => setShowUploadOrder(false)}
          onSuccess={() => {
            setShowUploadOrder(false);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
            toast({ title: 'Order created successfully!' });
          }}
        />
      )}

      {showWalkinOrder && (
        <WalkinOrderModal
          isOpen={showWalkinOrder}
          onClose={() => setShowWalkinOrder(false)}
          onSuccess={() => {
            setShowWalkinOrder(false);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
            toast({ title: 'Walk-in order booked successfully!' });
          }}
        />
      )}

      {/* Navigation */}
      <BottomNavigation />
      <UnifiedFloatingChatButton />
    </div>
  );
}