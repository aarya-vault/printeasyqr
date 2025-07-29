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
import LoadingScreen from '@/components/loading-screen';
import EnhancedOrderChat from '@/components/enhanced-order-chat';
import UnifiedChatSystem from '@/components/unified-chat-system';
import OrderDetailsModal from '@/components/order-details-modal';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import RealTimeNotificationBell from '@/components/real-time-notification-bell';
import BottomNavigation from '@/components/common/bottom-navigation';

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

  // Get unique shops the customer has ordered from with details
  const { data: visitedShops = [] } = useQuery<any[]>({
    queryKey: [`/api/shops/customer/${user?.id}/visited`],
    enabled: !!user?.id,
  });

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

  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-brand-yellow px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-rich-black">Welcome, {user?.name || 'Customer'}!</h1>
          <div className="flex items-center gap-3">
            <RealTimeNotificationBell />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                navigate('/');
                toast({
                  title: "Logged Out",
                  description: "You have been successfully logged out"
                });
              }}
              className="text-rich-black hover:bg-yellow-200"
            >
              <LogOut className="w-5 h-5" />
            </Button>
        </div>
        </div>
        
        {/* Beautiful Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-yellow/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-yellow/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
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
                    onClick={() => navigate('/')}
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Explore Print Shops
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Print
                  </Button>
                </div>
              </div>
            ) : (
              // Has Orders State - Focus on Current Order
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-rich-black">Your Print Status</h2>
                    <p className="text-sm text-gray-600 mt-1">Track and manage your orders</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-brand-yellow/20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-rich-black">
                        {orderStats.active} Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Featured Current Order */}
                {recentOrders[0] && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 mb-5 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getStatusColor(recentOrders[0].status)} font-medium`}>
                            {getStatusIcon(recentOrders[0].status)}
                            <span className="ml-1 capitalize">{recentOrders[0].status}</span>
                          </Badge>
                          {recentOrders[0].isUrgent && (
                            <Badge variant="destructive" className="text-xs animate-pulse">Urgent</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-rich-black text-lg">{recentOrders[0].title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          at {recentOrders[0].shop?.name || 'Print Shop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Ordered {format(new Date(recentOrders[0].createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center shadow-md">
                          {recentOrders[0].status === 'ready' ? (
                            <CheckCircle2 className="w-8 h-8 text-rich-black" />
                          ) : recentOrders[0].status === 'processing' ? (
                            <Clock className="w-8 h-8 text-rich-black animate-pulse" />
                          ) : (
                            <Package className="w-8 h-8 text-rich-black" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <Button
                        size="sm"
                        className="bg-rich-black text-white hover:bg-rich-black/90 flex-1"
                        onClick={() => setSelectedOrderForDetails(recentOrders[0])}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black flex-1"
                        onClick={() => setShowComprehensiveChat(true)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat Shop
                      </Button>
                      {recentOrders[0].shop?.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${recentOrders[0].shop?.phone}`)}
                          className="px-3"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-14 flex-col gap-1 border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5"
                    onClick={() => navigate('/')}
                  >
                    <Store className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">New Order</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-14 flex-col gap-1 border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5"
                    onClick={() => navigate('/customer-orders')}
                  >
                    <Package className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">All Orders</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-6 mt-6">
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
              <Card key={order.id} className="bg-white hover:shadow-md transition-all">
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

                  <div className="flex items-center space-x-2 mt-3">
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
    </div>
  );
}