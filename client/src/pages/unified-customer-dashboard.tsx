import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { 
  Upload, MapPin, FileText, Bell, LogOut, Printer, Package, Clock, CheckCircle2, MessageCircle, Eye, 
  Home, ShoppingCart, User, ArrowRight, Phone, Star, Store
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
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
    phone: string;
    city: string;
  };
  customerPhone: string;
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

  // Recent orders (all orders, not just active)
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate order statistics
  const orderStats = {
    total: allOrders.length,
    active: allOrders.filter(o => o.status === 'new' || o.status === 'processing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Package className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3 animate-pulse" />;
      case 'ready': return <CheckCircle2 className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Professional PrintEasy QR Header */}
      <div className="bg-brand-yellow px-3 sm:px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Professional PrintEasy QR Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-rich-black p-1.5 sm:p-2 rounded-lg shadow-lg">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-brand-yellow rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-rich-black rounded-xs"></div>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-rich-black leading-tight">PrintEasy QR</h1>
              <p className="text-xs sm:text-sm text-rich-black/80 truncate">Welcome, {user?.name?.split(' ')[0] || 'Customer'}!</p>
            </div>
          </div>
          
          {/* Compact Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative text-rich-black hover:bg-rich-black/10 p-1.5 sm:p-2"
            >
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
              {orderStats.active > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {orderStats.active}
                </span>
              )}
            </Button>
            
            {/* Compact User Avatar */}
            <div className="bg-rich-black text-brand-yellow w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
              {user?.name?.[0] || 'M'}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-rich-black hover:bg-rich-black/10 p-1.5 sm:p-2"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile-First Hero Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 relative overflow-hidden mx-3 sm:mx-0">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-brand-yellow/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-20 h-12 sm:h-20 bg-brand-yellow/3 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10">
            {/* Main Content Based on Order Status */}
            {recentOrders.length === 0 ? (
              // No Orders State - Welcoming and Encouraging
              <div className="text-center py-8">
                <div className="bg-gradient-to-br from-brand-yellow to-brand-yellow/80 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-rich-black mb-3">Welcome to PrintEasy!</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your printing journey starts here. Connect with local print shops and get your documents printed with ease.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    className="bg-rich-black text-white hover:bg-rich-black/90 shadow-lg"
                    onClick={() => setLocation('/')}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Explore Print Shops
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                    onClick={() => setShowUploadOrder(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Print
                  </Button>
                </div>
              </div>
            ) : (
              // Has Orders State - Mobile-First Layout
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-rich-black">Your Print Status</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Track and manage your orders</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-brand-yellow/20 px-2 py-1 rounded-full">
                      <span className="text-xs font-medium text-rich-black">
                        {orderStats.active} Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Order Card - Mobile Optimized */}
                {recentOrders[0] && (
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-200">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-yellow rounded-full flex items-center justify-center shadow-sm">
                          {recentOrders[0].status === 'ready' ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black" />
                          ) : recentOrders[0].status === 'processing' ? (
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black animate-pulse" />
                          ) : (
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                          <Badge className={`${getStatusColor(recentOrders[0].status)} font-medium text-xs`}>
                            {getStatusIcon(recentOrders[0].status)}
                            <span className="ml-1 capitalize">{recentOrders[0].status}</span>
                          </Badge>
                          {recentOrders[0].isUrgent && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-rich-black text-sm sm:text-base leading-tight mb-1">{recentOrders[0].title}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          at {recentOrders[0].shop?.name || 'Print Shop'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ordered {format(new Date(recentOrders[0].createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                      <Button
                        size="sm"
                        className="bg-rich-black text-white hover:bg-rich-black/90 text-xs h-8 sm:h-9"
                        onClick={() => setSelectedOrderForDetails({ ...recentOrders[0], customerPhone: recentOrders[0].customerPhone || user?.phone || '' })}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black text-xs h-8 sm:h-9"
                        onClick={() => setSelectedOrderForChat(recentOrders[0].id)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                      {recentOrders[0].shop?.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${recentOrders[0].shop?.phone}`)}
                          className="col-span-2 sm:col-span-1 text-xs h-8 sm:h-9"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call Shop
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Smart Actions Based on Order Status */}
                {recentOrders[0] && (recentOrders[0].status === 'processing' || recentOrders[0].status === 'new') ? (
                  // Processing Order - Show Add Files Button Only
                  <div className="mt-3">
                    <Button 
                      className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium text-sm sm:text-base shadow-sm"
                      onClick={() => setSelectedOrderForDetails({ ...recentOrders[0], customerPhone: recentOrders[0].customerPhone || user?.phone || '' })}
                    >
                      <Upload className="w-4 h-4" />
                      Add More Files to Order
                    </Button>
                  </div>
                ) : (
                  // Completed Order - Show New Order Options
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button 
                      variant="outline"
                      className="h-10 sm:h-12 flex-col gap-1 border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5 text-xs sm:text-sm"
                      onClick={() => setShowUploadOrder(true)}
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      <span className="text-gray-600">New Upload</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-10 sm:h-12 flex-col gap-1 border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5 text-xs sm:text-sm"
                      onClick={() => setShowWalkinOrder(true)}
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      <span className="text-gray-600">Walk-in Order</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <main className="px-3 sm:px-6 py-4">
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
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active orders. Place your first order!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 3).map((order) => (
                  <UnifiedOrderCard
                    key={order.id}
                    order={order}
                    userRole="customer"
                    onChatClick={(orderId) => setSelectedOrderForChat(orderId)}
                    onCallClick={(phone) => window.open(`tel:${phone}`)}
                    onViewDetails={(order) => setSelectedOrderForDetails({ ...order, customerPhone: order.customerPhone || user?.phone || '' })}
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
          onClose={() => {
            setShowUploadOrder(false);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
          }}
        />
      )}

      {showWalkinOrder && (
        <WalkinOrderModal
          isOpen={showWalkinOrder}
          onClose={() => {
            setShowWalkinOrder(false);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
          }}
        />
      )}

      {/* Navigation */}
      <BottomNavigation />
      <UnifiedFloatingChatButton />
    </div>
  );
}