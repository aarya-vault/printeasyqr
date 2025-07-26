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
  Home, ShoppingCart, Bell, User, ArrowRight, MapPin, Phone, Star
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingScreen from '@/components/loading-screen';
import ShopChatModal from '@/components/shop-chat-modal';
import OrderDetailsModal from '@/components/order-details-modal';

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
          <Badge className="bg-red-500 text-white">
            <Bell className="w-3 h-3 mr-1" />
            2
          </Badge>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-rich-black mb-4">Ready to Print?</h2>
          
          {visitedShops.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">No shops visited yet</p>
              <Link href="/">
                <Button className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
                  Browse Print Shops
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose from your previously visited shops</p>
              
              {/* Previously Visited Shops */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {visitedShops.slice(0, 3).map((shop: any) => (
                  <Card key={shop.id} className="border hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-rich-black">{shop.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{shop.city}</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Online</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {orders.filter(o => o.shopId === shop.id).length} orders
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                          onClick={() => navigate(`/shop/${shop.slug}/upload`)}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Upload Files
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/shop/${shop.slug}/walkin`)}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Walk-in Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {visitedShops.length > 3 && (
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Browse More Shops
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Order Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-rich-black">{orderStats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-rich-black">{orderStats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-rich-black">{orderStats.done}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-rich-black">Recent Orders</h2>
          <Link href="/customer-orders">
            <a className="text-sm text-brand-yellow font-medium">View All</a>
          </Link>
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
                      <h3 className="font-medium text-rich-black">{order.shop?.name || 'Print Shop'}</h3>
                      <p className="text-sm text-gray-500 mt-1">{order.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedOrderForChat(order.id)}
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/customer-dashboard">
            <a className="flex flex-col items-center justify-center py-3 text-brand-yellow">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </a>
          </Link>
          <Link href="/customer-orders">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <ShoppingCart className="w-5 h-5 mb-1" />
              <span className="text-xs">Orders</span>
            </a>
          </Link>
          <Link href="/customer-notifications">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500 relative">
              <Bell className="w-5 h-5 mb-1" />
              <span className="text-xs">Notifications</span>
              <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
            </a>
          </Link>
          <Link href="/customer-account-settings">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </a>
          </Link>
        </div>
      </div>

      {/* Chat Modal */}
      {selectedOrderForChat && (
        <ShopChatModal
          orderId={selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}
    </div>
  );
}