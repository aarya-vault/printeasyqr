import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { 
  Upload, MapPin, FileText, Bell, LogOut, Printer, Package, Clock, CheckCircle2, MessageCircle, Eye, 
  Home, ShoppingCart, User, ArrowRight, Phone, Star, Store, QrCode, Lock, Unlock, X
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
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
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
  unreadCount?: number;
}

export default function UnifiedCustomerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showUploadOrder, setShowUploadOrder] = useState(false);
  const [showWalkinOrder, setShowWalkinOrder] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);
  
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

  // Fetch all shops for browsing
  const { data: allShops = [], isLoading: shopsLoading } = useQuery<any[]>({
    queryKey: ['/api/shops'],
    enabled: showAllShops
  });

  // Fetch unlocked shops for this customer
  const { data: unlockedShopsData } = useQuery<{ unlockedShopIds: number[] }>({
    queryKey: [`/api/customer/${user?.id}/unlocked-shops`],
    enabled: !!user?.id,
  });

  const unlockedShopIds = unlockedShopsData?.unlockedShopIds || [];

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
          {/* Consistent PrintEasy Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-rich-black p-1.5 sm:p-2 rounded-lg shadow-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
            </div>
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
                    onClick={() => setShowUploadOrder(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Quick Upload Order
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
                        onClick={() => setSelectedOrderForDetails({ 
                          ...recentOrders[0], 
                          customerPhone: recentOrders[0].customerPhone || user?.phone || '',
                          customerName: recentOrders[0].customerName || user?.name || 'Customer',
                          type: recentOrders[0].type as 'upload' | 'walkin'
                        })}
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
                        {recentOrders[0].status === 'completed' ? 'Chat History' : 'Chat'}
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

                {/* Enhanced Smart Actions Based on Order Status */}
                {recentOrders[0] && recentOrders[0].status === 'processing' && (
                  // Processing Order - Show Add Files Button 
                  <div className="mt-3">
                    <Button 
                      className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium text-sm sm:text-base shadow-sm"
                      onClick={() => setSelectedOrderForDetails({ 
                        ...recentOrders[0], 
                        customerPhone: recentOrders[0].customerPhone || user?.phone || '',
                        customerName: recentOrders[0].customerName || user?.name || 'Customer',
                        type: recentOrders[0].type as 'upload' | 'walkin'
                      })}
                    >
                      <Upload className="w-4 h-4" />
                      Add More Files to Order
                    </Button>
                  </div>
                )}

                {recentOrders[0] && recentOrders[0].status === 'ready' && (
                  // Ready Order - Show Pickup Available
                  <div className="mt-3">
                    <Button 
                      className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 font-medium text-sm sm:text-base shadow-sm"
                      onClick={() => setSelectedOrderForDetails({ 
                        ...recentOrders[0], 
                        customerPhone: recentOrders[0].customerPhone || user?.phone || '',
                        customerName: recentOrders[0].customerName || user?.name || 'Customer',
                        type: recentOrders[0].type as 'upload' | 'walkin'
                      })}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Pickup Available - View Details
                    </Button>
                  </div>
                )}

                {recentOrders[0] && recentOrders[0].status === 'completed' && (
                  // Completed Order - Show New Order Options (No Add Files)
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
                    return (
                      <div
                        key={shop.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                          isUnlocked ? 'border-[#FFBF00] bg-[#FFBF00]/5' : 'border-gray-200 bg-gray-50'
                        }`}
                        onClick={() => handleShopClick(shop)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-black">{shop.name}</h3>
                              {isUnlocked ? (
                                <Unlock className="w-4 h-4 text-[#FFBF00]" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{shop.city}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={shop.isOnline ? 'default' : 'secondary'} className="text-xs">
                                {shop.isOnline ? 'Online' : 'Offline'}
                              </Badge>
                              {isUnlocked ? (
                                <Badge className="bg-[#FFBF00] text-black text-xs">Unlocked</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Scan QR to Unlock</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()}>
                            {isUnlocked ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90"
                                  onClick={() => {
                                    setShowAllShops(false);
                                    setShowUploadOrder(true);
                                  }}
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  Order
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAllShops(false);
                                }}
                                className="border-[#FFBF00] text-[#FFBF00]"
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
      <UnifiedFloatingChatButton 
        activeOrdersCount={activeOrders.length}
        onChatOpen={() => {}}
      />

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
          isOpen={true}
          onClose={() => setSelectedOrderForDetails(null)}
          order={selectedOrderForDetails}
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