import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { 
  Upload, Users, Package, Clock, CheckCircle2, MessageCircle, Eye, 
  Home, ShoppingCart, Bell, User, ArrowRight, MapPin, Phone, Star, Store, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLoading, LoadingSpinner } from '@/components/ui/loading-spinner';
import UnifiedChatSystem from '@/components/unified-chat-system';
import OrderDetailsModal from '@/components/order-details-modal';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import RealTimeNotificationBell from '@/components/real-time-notification-bell';
import BottomNavigation from '@/components/common/bottom-navigation';
import DetailedShopModal from '@/components/detailed-shop-modal';

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
    name: string;
    phone: string;
  };
}

export default function RefinedCustomerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [showComprehensiveChat, setShowComprehensiveChat] = useState(false);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<any>(null);
  const [showShopDetails, setShowShopDetails] = useState(false);

  // Handle shop card click to show details
  const handleShopClick = (shop: any) => {
    setSelectedShopForDetails(shop);
    setShowShopDetails(true);
  };

  // Handle shop order click from detailed modal
  const handleShopOrderClick = (shopSlug: string) => {
    navigate(`/shop/${shopSlug}`);
  };

  // Handle order card click to show details
  const handleOrderClick = (order: Order) => {
    setSelectedOrderForDetails(order);
  };



  // Shop availability checker with 24/7 support
  const isShopOpen = (shop: any) => {
    if (!shop || !shop.isOnline) return false;
    
    // If no working hours defined, assume 24/7 operation
    if (!shop.workingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    // If day is marked as closed, shop is closed
    if (!todayHours || todayHours.closed) return false;
    
    // Handle 24/7 operation - if open time equals close time
    if (todayHours.open === todayHours.close) return true;
    
    // Handle overnight operations (e.g., 22:00 to 06:00)
    if (todayHours.open > todayHours.close) {
      return currentTime >= todayHours.open || currentTime <= todayHours.close;
    }
    
    // Normal day operation
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  // Fetch customer orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'new' || o.status === 'processing').length,
    done: orders.filter(o => o.status === 'completed').length,
  };

  // Get recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get unique shops the customer has ordered from with details - auto-refresh for real-time data
  const { data: visitedShops = [] } = useQuery<any[]>({
    queryKey: [`/api/shops/customer/${user?.id}/visited`],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time shop data
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-brand-yellow/20 text-rich-black';
      case 'processing': return 'bg-brand-yellow/40 text-rich-black';
      case 'ready': return 'bg-brand-yellow/60 text-rich-black';
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

  if (isLoading) {
    return <DashboardLoading title="Loading your dashboard..." subtitle="Getting your orders, shop data, and account information" />;
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
            <RealTimeNotificationBell />
            
            {/* Compact User Avatar */}
            <div className="bg-rich-black text-brand-yellow w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
              {user?.name?.[0] || 'M'}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate('/');
                toast({
                  title: "Logged Out",
                  description: "You have been successfully logged out"
                });
              }}
              className="text-rich-black hover:bg-rich-black/10 p-1.5 sm:p-2"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile-First Hero Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-brand-yellow/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-20 h-12 sm:h-20 bg-brand-yellow/3 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10">
            {/* Main Content Based on Order Status */}
            {recentOrders.length === 0 ? (
              // No Orders State - Welcoming and Encouraging
              <div className="text-center py-6 sm:py-8">
                <div className="bg-brand-yellow w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 text-rich-black" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-rich-black mb-2 sm:mb-3">Welcome to PrintEasy!</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed px-2">
                  Your printing journey starts here. Connect with local print shops and get your documents printed with ease.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-2">
                  <Button 
                    className="bg-rich-black text-white hover:bg-rich-black/90 shadow-lg text-sm sm:text-base py-2 sm:py-3"
                    onClick={() => navigate('/')}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Explore Print Shops
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black text-sm sm:text-base py-2 sm:py-3"
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
                        onClick={() => setSelectedOrderForDetails(recentOrders[0])}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black text-xs h-8 sm:h-9"
                        onClick={() => setShowComprehensiveChat(true)}
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
                      onClick={() => setSelectedOrderForDetails(recentOrders[0])}
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
                      onClick={() => navigate('/')}
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      <span className="text-gray-600">New Upload</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-10 sm:h-12 flex-col gap-1 border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5 text-xs sm:text-sm"
                      onClick={() => navigate('/')}
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

      {/* Recent Orders */}
      <div className="px-4 sm:px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-rich-black">Recent Orders</h2>
          <button 
            onClick={() => navigate('/customer-orders')}
            className="text-sm text-brand-yellow font-medium hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <p className="text-sm text-gray-400 mt-1">Start by placing your first order!</p>
              </CardContent>
            </Card>
          ) : (
            recentOrders.map((order) => (
              <Card 
                key={order.id} 
                className="bg-white hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleOrderClick(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">ORD{order.id.toString().padStart(3, '0')}</span>
                        {order.isUrgent && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      {order.shop?.name && (
                        <h3 className="font-medium text-rich-black">{order.shop.name}</h3>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{order.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Open the floating chat interface directly
                        setShowComprehensiveChat(true);
                      }}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedOrderForDetails(order)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Centralized Bottom Navigation */}
      <BottomNavigation />

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          userRole="customer"
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {/* Unified Floating Chat Button */}
      <UnifiedFloatingChatButton />
      
      {/* Unified Chat Interface triggered by order chat buttons */}
      {showComprehensiveChat && (
        <UnifiedChatSystem
          isOpen={showComprehensiveChat}
          onClose={() => setShowComprehensiveChat(false)}
          userRole="customer"
        />
      )}

      {/* Detailed Shop Modal */}
      <DetailedShopModal
        shop={selectedShopForDetails}
        isOpen={showShopDetails}
        onClose={() => setShowShopDetails(false)}
        onOrderClick={handleShopOrderClick}
      />
    </div>
  );
}