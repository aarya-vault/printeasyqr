import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation, Link } from 'wouter';
import { 
  Upload, MapPin, FileText, Bell, LogOut, Printer, Package, Clock, CheckCircle2, MessageCircle, Eye, 
  Home, ShoppingCart, User as UserIcon, ArrowRight, Phone, Star, Store, QrCode, Lock, Unlock, X, HelpCircle, Zap, ChevronRight
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
import QRScanner from '@/components/qr-scanner';
import DetailedShopModal from '@/components/detailed-shop-modal';
import UserGuides, { useUserGuides } from '@/components/user-guides';
import { useToast } from '@/hooks/use-toast';
import PrintEasyLogo from '@/components/common/printeasy-logo';
import { useDeleteOrder, canDeleteOrder } from '@/hooks/use-delete-order';
import { Order, Shop, User } from '@shared/types';

export default function UnifiedCustomerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const { showGuides, guideType, showGuide, closeGuides, UserGuidesComponent } = useUserGuides();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteOrderMutation = useDeleteOrder();
  
  // Modal states
  const [showUploadOrder, setShowUploadOrder] = useState(false);
  const [showWalkinOrder, setShowWalkinOrder] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);
  
  // Customer Name Modal for data consistency
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  
  // Chat and order details states
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  
  // Shop details states
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<any>(null);
  const [showShopDetails, setShowShopDetails] = useState(false);

  // Handle shop card click to show details
  const handleShopClick = (shop: any) => {
    setSelectedShopForDetails(shop);
    setShowShopDetails(true);
  };

  // Handle shop order click from detailed modal
  const handleShopOrderClick = (shopSlug: string) => {
    setLocation(`/shop/${shopSlug}`);
  };

  // Customer name consistency check - prompt for name if missing
  useEffect(() => {
    if (user && user.role === 'customer' && (!user.name || user.name.trim() === '')) {
      setShowNameModal(true);
    }
  }, [user]);

  // Redirect if not authenticated or not a customer
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'customer') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Update customer name mutation
  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      // Get JWT token for authentication
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Add JWT token
        },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update name: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      updateUser({ ...user!, name: data.name });
      // Invalidate all user-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
      setShowNameModal(false);
      toast({
        title: "Profile Updated",
        description: "Your name has been saved successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your name. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNameSubmit = () => {
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    updateNameMutation.mutate(customerName.trim());
  };

  // Fetch customer orders - only active orders for dashboard
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch all shops for browsing - always fetch for availability 
  const { data: allShops = [], isLoading: shopsLoading } = useQuery<any[]>({
    queryKey: ['/api/shops'],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch unlocked shops for this customer
  const { data: unlockedShopsData } = useQuery<{ unlockedShopIds: number[] }>({
    queryKey: [`/api/customer/${user?.id}/unlocked-shops`],
    enabled: !!user?.id,
  });

  const unlockedShopIds = unlockedShopsData?.unlockedShopIds || [];

  // Filter to show only active orders (not completed/cancelled/deleted) in dashboard
  const activeOrders = allOrders.filter(order => 
    order.status !== 'completed' && !order.deletedAt
  );

  // Recent orders (all orders, not just active)
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Previously visited shops (shops where customer has placed orders)
  const visitedShops = [...new Map(
    allOrders
      .filter(order => order.shop && order.shop.id)
      .map(order => [order.shop.id, order.shop])
  ).values()];

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
        order={selectedOrderForDetails as any}
        onClose={handleDetailsClose}
      />
    );
  }

  // Loading state component
  const LoadingDashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-brand-yellow px-3 sm:px-6 pt-10 pb-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-rich-black p-1.5 sm:p-2 rounded-lg shadow-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-rich-black">PrintEasy</h1>
                <div className="h-4 bg-rich-black/10 rounded w-32 mt-1"></div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-8 h-8 bg-rich-black/10 rounded-lg"></div>
              <div className="w-8 h-8 bg-rich-black/10 rounded-full"></div>
              <div className="w-8 h-8 bg-rich-black/10 rounded-lg"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-6 mx-3 sm:mx-0">
            <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="px-3 sm:px-6 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );

  if (!user) {
    return <LoadingDashboard />;
  }

  if (ordersLoading) {
    return <LoadingDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Professional PrintEasy QR Header */}
      <div className="bg-brand-yellow px-3 sm:px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Consistent PrintEasy Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PrintEasyLogo size="lg" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-rich-black leading-tight">PrintEasy</h1>
              <p className="text-xs sm:text-sm text-rich-black/80 truncate">Welcome, {user?.name?.split(' ')[0] || 'Customer'}!</p>
            </div>
          </div>
          
          {/* Header Actions with Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-rich-black hover:bg-rich-black/10 p-1.5 sm:p-2"
              onClick={() => showGuide('general')}
              title="Help & Guides"
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="relative text-rich-black hover:bg-rich-black/10 p-1.5 sm:p-2"
              onClick={() => setLocation('/customer-notifications')}
            >
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
              {orderStats.active > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {orderStats.active}
                </span>
              )}
            </Button>
            
            {/* User Avatar with Account Navigation */}
            <Button
              variant="ghost"
              size="sm"
              className="bg-rich-black text-brand-yellow w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm hover:bg-rich-black/90 p-0"
              onClick={() => setLocation('/customer-account')}
            >
              {user?.name?.[0] || 'C'}
            </Button>
            
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
              // Enhanced Fresh Signup Experience
              <div className="text-center py-6 sm:py-8">
                <div className="bg-brand-yellow w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 text-rich-black" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-rich-black mb-2 sm:mb-3">Welcome to PrintEasy!</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed px-2">
                  Your printing journey starts here. Connect with local print shops and get your documents printed with ease.
                </p>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <Button 
                    variant="outline"
                    className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black h-10 sm:h-12 text-sm sm:text-base"
                    onClick={() => setShowAllShops(true)}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Browse All Print Shops
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:border-brand-yellow hover:bg-brand-yellow hover:text-rich-black h-10 sm:h-12 text-sm sm:text-base"
                    onClick={() => showGuide('firstLogin')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Start Guide
                  </Button>
                </div>
              </div>
            ) : (
              // Has Orders State - Mobile-First Layout
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-rich-black">Your Print Status</h2>
                    <p className="text-xs text-gray-600 mt-0.5">Active orders and available shops</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="bg-brand-yellow/20 px-2 py-1 rounded-full">
                      <span className="text-xs font-medium text-rich-black">
                        {unlockedShopIds.length} Shops
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black text-xs h-7"
                      onClick={() => setShowAllShops(true)}
                    >
                      <Store className="w-3 h-3 mr-1" />
                      View All
                    </Button>
                  </div>
                </div>

                {/* Active Orders Section */}
                {activeOrders.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {activeOrders.map((order) => (
                      <div 
                        key={order.id}
                        className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedOrderForDetails(order)}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-yellow rounded-full flex items-center justify-center shadow-sm">
                              {order.status === 'ready' ? (
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black" />
                              ) : order.status === 'processing' ? (
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black animate-pulse" />
                              ) : (
                                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                              <Badge className={`${getStatusColor(order.status)} font-medium text-xs`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                              {order.isUrgent && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-rich-black text-sm sm:text-base leading-tight mb-1">{order.title}</h3>
                            <p className="text-xs text-gray-600 mb-1">
                              at {order.shop?.name || 'Print Shop'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ordered {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Mobile Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="bg-rich-black text-white hover:bg-rich-black/90 text-xs h-8 sm:h-9"
                            onClick={() => setSelectedOrderForDetails(order)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black text-xs h-8 sm:h-9"
                            onClick={() => setSelectedOrderForChat(order.id)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {order.status === 'completed' ? 'Chat History' : 'Chat'}
                          </Button>
                          
                          {/* Delete Button - Only for customers before processing */}
                          {canDeleteOrder(order, user?.role || '', user?.id || 0).canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 sm:h-9"
                              onClick={() => deleteOrderMutation.mutate(order.id)}
                              disabled={deleteOrderMutation.isPending}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No active orders</p>
                    <p className="text-xs text-gray-500">Start by scanning a shop QR code or browsing available shops</p>
                  </div>
                )}

                {/* Enhanced Smart Actions Based on Active Orders */}
                {activeOrders.some(order => order.status === 'processing') && (
                  <div className="mt-3">
                    <Button 
                      className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium text-sm sm:text-base shadow-sm"
                      onClick={() => {
                        const processingOrder = activeOrders.find(order => order.status === 'processing');
                        if (processingOrder) setSelectedOrderForDetails(processingOrder);
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Add More Files to Processing Orders
                    </Button>
                  </div>
                )}

                {activeOrders.some(order => order.status === 'ready') && (
                  <div className="mt-3">
                    <Button 
                      className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 font-medium text-sm sm:text-base shadow-sm"
                      onClick={() => {
                        const readyOrder = activeOrders.find(order => order.status === 'ready');
                        if (readyOrder) setSelectedOrderForDetails(readyOrder);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Ready for Pickup - View Details
                    </Button>
                  </div>
                )}

                {/* Previously Visited Shops Section - REPLACES Active Orders */}
                {visitedShops.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-rich-black">Previously Visited Shops</h3>
                      <span className="text-xs text-gray-500">{visitedShops.length} shops</span>
                    </div>
                    <div className="space-y-2">
                      {visitedShops.slice(0, 3).map((shop) => (
                        <div 
                          key={shop.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setLocation(`/shop/${shop.slug}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                              <Store className="w-4 h-4 text-rich-black" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-rich-black truncate">{shop.name}</h4>
                              <p className="text-xs text-gray-500 truncate">{shop.address}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                      {visitedShops.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full text-xs text-brand-yellow hover:bg-brand-yellow/10"
                          onClick={() => setShowAllShops(true)}
                        >
                          View All {visitedShops.length} Visited Shops
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons - Walk-in Order button removed */}
                <div className="grid grid-cols-1 gap-2 mt-3">
                  </div>

                {/* Status-based Messages */}
                {recentOrders[0] && recentOrders[0].status === 'new' && (
                  // New Order - Show Status Message
                  <div className="mt-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 text-center">
                        Your order is being reviewed by the shop. They'll contact you shortly!
                      </p>
                    </div>
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
                    userId={user?.id}
                    onChatClick={(orderId) => setSelectedOrderForChat(orderId)}
                    onCallClick={(phone) => window.open(`tel:${phone}`)}
                    onViewDetails={(order) => setSelectedOrderForDetails(order as any)}
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
          shops={[]}
          onSubmit={() => {}}
        />
      )}

      {showWalkinOrder && (
        <WalkinOrderModal
          isOpen={showWalkinOrder}
          onClose={() => {
            setShowWalkinOrder(false);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
          }}
          shops={[]}
          onSubmit={() => {}}
        />
      )}



      {/* Shop Browse Modal */}
      {showAllShops && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-[#FFBF00] px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">Browse Print Shops</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllShops(false)}
                className="text-black hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {shopsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {allShops.map((shop) => {
                    const isUnlocked = unlockedShopIds.includes(shop.id);
                    
                    // Calculate shop availability
                    const isShopOnline = () => {
                      if (!shop.acceptingOrders) return false;
                      if (!shop.workingHours) return true; // 24/7 if no hours defined
                      
                      const now = new Date();
                      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                      const currentDay = dayNames[now.getDay()];
                      const currentTime = now.getHours() * 60 + now.getMinutes();
                      
                      const dayHours = shop.workingHours[currentDay];
                      if (!dayHours || dayHours.closed) return false;
                      
                      const [openHour, openMin] = dayHours.open.split(':').map(Number);
                      const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
                      const openTime = openHour * 60 + openMin;
                      const closeTime = closeHour * 60 + closeMin;
                      
                      if (openTime === closeTime) return true; // 24/7
                      if (openTime < closeTime) {
                        return currentTime >= openTime && currentTime <= closeTime;
                      } else {
                        return currentTime >= openTime || currentTime <= closeTime;
                      }
                    };

                    const shopOnline = isShopOnline();
                    
                    return (
                      <div
                        key={shop.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 ${
                          isUnlocked 
                            ? 'border-[#FFBF00] bg-[#FFBF00]/5 shadow-sm' 
                            : 'border-gray-300 bg-gray-100 opacity-75'
                        }`}
                        onClick={() => handleShopClick(shop)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`font-semibold truncate ${isUnlocked ? 'text-black' : 'text-gray-600'}`}>
                                {shop.name}
                              </h3>
                              {isUnlocked ? (
                                <Unlock className="w-4 h-4 text-[#FFBF00] flex-shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                            
                            {/* Shop Details */}
                            <div className="space-y-1 mb-3">
                              <p className={`text-sm truncate ${isUnlocked ? 'text-gray-600' : 'text-gray-500'}`}>
                                📍 {shop.address || shop.city}
                              </p>
                              {(shop.publicContactNumber || shop.phone) && (
                                <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-500'}`}>
                                  📞 {shop.publicContactNumber || shop.phone}
                                </p>
                              )}
                              {shop.services && shop.services.length > 0 && (
                                <p className={`text-xs ${isUnlocked ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                                  🛠️ {shop.services.slice(0, 3).join(', ')}
                                  {shop.services.length > 3 && ` +${shop.services.length - 3} more`}
                                </p>
                              )}
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={shopOnline ? 'default' : 'secondary'} 
                                className={`text-xs ${shopOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {shopOnline ? '🟢 Open' : '🔴 Closed'}
                              </Badge>
                              {isUnlocked ? (
                                <Badge className="bg-[#FFBF00] text-black text-xs font-medium">
                                  ✅ Unlocked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                                  🔒 Scan QR to Unlock
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isUnlocked ? (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  className="bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 w-full"
                                  onClick={() => {
                                    setShowAllShops(false);
                                    setShowUploadOrder(true);
                                  }}
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black w-full"
                                  onClick={() => {
                                    setShowAllShops(false);
                                    setShowWalkinOrder(true);
                                  }}
                                >
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Walk-in
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAllShops(false);
                                  // Could trigger QR scanner here
                                }}
                                className="border-gray-400 text-gray-600 hover:border-[#FFBF00] hover:text-[#FFBF00] w-full"
                                disabled
                              >
                                <QrCode className="w-3 h-3 mr-1" />
                                Scan QR
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {allShops.length === 0 && (
                    <div className="text-center py-8">
                      <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No print shops available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                Scan shop QR codes to unlock ordering capabilities. Visit shops physically or scan QR codes from their promotional materials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Unified Floating Chat Button */}
      <UnifiedFloatingChatButton />

      {/* Chat System */}
      {selectedOrderForChat && (
        <UnifiedChatSystem
          isOpen={true}
          onClose={() => setSelectedOrderForChat(null)}
          initialOrderId={selectedOrderForChat}
          userRole="customer"
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <EnhancedCustomerOrderDetails
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {/* Detailed Shop Modal */}
      <DetailedShopModal
        shop={selectedShopForDetails}
        isOpen={showShopDetails}
        onClose={() => setShowShopDetails(false)}
        onOrderClick={handleShopOrderClick}
      />

      {/* User Guides */}
      <UserGuidesComponent />

      {/* Customer Name Modal for Data Consistency */}
      <Dialog open={showNameModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-brand-yellow">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-center">
              Please provide your full name to enhance your ordering experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-rich-black" />
              </div>
              <p className="text-gray-600 mb-4">
                To ensure the best experience, please provide your full name for order processing and communication.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              />
            </div>
            
            <Button 
              onClick={handleNameSubmit}
              className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              disabled={updateNameMutation.isPending}
            >
              {updateNameMutation.isPending ? 'Saving...' : 'Continue to Dashboard'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}