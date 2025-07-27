import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/professional-layout';
import { ProfessionalLoading } from '@/components/professional-loading';
import MobileOrderQuickActions from '@/components/mobile-order-quick-actions';
import MobileChatPanel from '@/components/mobile-chat-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  Clock,
  MessageCircle,
  MapPin,
  Star,
  FileText,
  Upload,
  Users,
  ShoppingBag,
  Eye,
  Phone,
  History,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  shop: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    services?: string[];
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  services?: string[];
  isOpen: boolean;
  orderCount: number;
  lastVisited: string;
}

export default function ProfessionalCustomerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatOrder, setSelectedChatOrder] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'shops' | 'history'>('orders');

  // Fetch customer orders with real-time updates for mobile rushing behavior
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/customer', user?.id],
    enabled: !!user?.id,
    refetchInterval: 2000, // Very frequent updates for rushing customers
  });

  // Fetch previously visited shops for quick reordering
  const { data: visitedShops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops/customer', user?.id, 'visited'],
    enabled: !!user?.id,
  });

  // Fetch available shops for browsing services
  const { data: availableShops = [], isLoading: availableLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops/available'],
  });

  // Filter for mobile search
  const filteredOrders = orders.filter(order =>
    order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  const filteredShops = [...visitedShops, ...availableShops].filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.services?.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Prioritize urgent orders for rushing customers
  const urgentOrders = orders.filter(o => o.status === 'ready' || o.unreadMessages > 0);
  const recentOrders = orders.filter(o => o.status === 'new' || o.status === 'processing');

  if (ordersLoading) {
    return (
      <DashboardLayout title="My Orders">
        <ProfessionalLoading message="Loading your orders..." size="lg" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="PrintEasy">
      {/* Mobile-First Quick Status Bar - For Rushing Customers */}
      <div className="bg-[#FFBF00] p-4 mb-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-black">Quick Status</h2>
            <p className="text-sm text-black/80">
              {urgentOrders.length > 0 
                ? `${urgentOrders.length} order${urgentOrders.length > 1 ? 's' : ''} need${urgentOrders.length === 1 ? 's' : ''} attention`
                : 'All orders on track'
              }
            </p>
          </div>
          <div className="flex gap-2">
            {urgentOrders.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {urgentOrders.length} urgent
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          className={`flex-1 ${activeTab === 'orders' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          My Orders
          {orders.length > 0 && (
            <Badge variant="secondary" className="ml-2">{orders.length}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'shops' ? 'default' : 'ghost'}
          className={`flex-1 ${activeTab === 'shops' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Shops
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          className={`flex-1 ${activeTab === 'history' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </div>

      {/* Search Bar - For Multitasking Customers */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search orders, shops, services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 py-3 text-base border-2 rounded-full"
        />
      </div>

      {/* Orders Tab - Mobile-First Design */}
      {activeTab === 'orders' && (
        <div>
          {/* Urgent Actions Section */}
          {urgentOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                {urgentOrders.map((order) => (
                  <MobileOrderQuickActions
                    key={order.id}
                    order={order}
                    onChatOpen={() => setSelectedChatOrder(order.id)}
                    className="border-red-200 bg-red-50"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Recent Orders
              </h3>
              <Button
                className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                onClick={() => setLocation('/place-order')}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
            
            {recentOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No active orders</h4>
                <p className="text-gray-600 mb-4">Place your first order to get started</p>
                <Button
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                  onClick={() => setLocation('/shops')}
                >
                  Browse Shops
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders
                  .filter(o => o.status === 'new' || o.status === 'processing')
                  .map((order) => (
                    <MobileOrderQuickActions
                      key={order.id}
                      order={order}
                      onChatOpen={() => setSelectedChatOrder(order.id)}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Completed Orders Preview */}
          {orders.filter(o => o.status === 'completed').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Recent Completed
              </h3>
              <div className="space-y-3">
                {orders
                  .filter(o => o.status === 'completed')
                  .slice(0, 3)
                  .map((order) => (
                    <Card key={order.id} className="border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-black">#{order.id}</h4>
                            <p className="text-sm text-gray-600">{order.shop.name}</p>
                            <p className="text-xs text-gray-500">
                              Completed {format(new Date(order.createdAt), 'MMM dd')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shops Tab - For Service Discovery */}
      {activeTab === 'shops' && (
        <div>
          {/* Previously Visited Shops - Quick Reordering */}
          {visitedShops.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Previously Visited
              </h3>
              <div className="space-y-3">
                {visitedShops.slice(0, 3).map((shop) => (
                  <Card key={shop.id} className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{shop.name}</h4>
                          <p className="text-sm text-gray-600">{shop.address}</p>
                          <p className="text-xs text-gray-500">
                            {shop.orderCount} previous order{shop.orderCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge className={shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {shop.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1 bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                          onClick={() => setLocation(`/shops/${shop.id}/upload`)}
                          disabled={!shop.isOpen}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/shops/${shop.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Shops - Service Discovery */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Available Shops
            </h3>
            
            {availableLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShops.slice(0, 10).map((shop) => (
                  <Card key={shop.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{shop.name}</h4>
                          <p className="text-sm text-gray-600">{shop.address}</p>
                          {shop.services && shop.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {shop.services.slice(0, 3).map((service, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {shop.services.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{shop.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge className={shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {shop.isOpen ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="flex-1 bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                          onClick={() => setLocation(`/shops/${shop.id}/upload`)}
                          disabled={!shop.isOpen}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/shops/${shop.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab - Complete Order History */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Order History
          </h3>
          
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No order history</h4>
              <p className="text-gray-600">Your completed orders will appear here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-black">#{order.id}</h4>
                        <p className="text-sm text-gray-600">{order.shop.name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{order.description}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChatOrder(order.id)}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                        {order.unreadMessages > 0 && (
                          <Badge variant="destructive" className="ml-1 text-xs">
                            {order.unreadMessages}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Chat Panel - Inline Implementation */}
      {selectedChatOrder && (
        <div className="fixed inset-0 z-50 bg-white">
          <MobileChatPanel
            orderId={selectedChatOrder}
            onClose={() => setSelectedChatOrder(null)}
            className="h-full"
          />
        </div>
      )}

      {/* Quick Action Floating Button for New Orders */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black shadow-lg"
          onClick={() => setLocation('/shops')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </DashboardLayout>
  );
}