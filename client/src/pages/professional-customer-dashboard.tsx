import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/professional-layout';
import { ProfessionalLoading } from '@/components/professional-loading';
import MobileOrderQuickActions from '@/components/mobile-order-quick-actions';
import MobileChatPanel from '@/components/mobile-chat-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  Clock,
  MessageCircle,
  MapPin,
  FileText,
  Upload,
  ShoppingBag,
  Eye,
  Phone,
  History,
  Home
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFBF00] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">PE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">PrintEasy</h1>
              <p className="text-xs text-gray-600">Welcome, {user?.name}</p>
            </div>
          </div>
          
          {/* Urgent notification badge */}
          {urgentOrders.length > 0 && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              {urgentOrders.length} urgent
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders, shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-lg border-gray-200"
          />
        </div>
      </div>

      {/* Main Content - Scrollable with padding for fixed header/footer */}
      <div className="pt-32 pb-20 px-4">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Urgent Orders Section */}
            {urgentOrders.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  Needs Attention ({urgentOrders.length})
                </h3>
                <div className="space-y-3">
                  {urgentOrders.map((order) => (
                    <Card key={order.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-black">#{order.id}</h4>
                            <p className="text-sm text-gray-600">{order.shop.name}</p>
                          </div>
                          <Badge className={
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{order.description}</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedChatOrder(order.id)}
                            className="text-xs h-8"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                            {order.unreadMessages > 0 && (
                              <Badge variant="destructive" className="ml-1 text-xs px-1">
                                {order.unreadMessages}
                              </Badge>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${order.shop.phone}`)}
                            className="text-xs h-8"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Active Orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-black flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Active Orders ({recentOrders.length})
                </h3>
                <Button
                  size="sm"
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black h-8"
                  onClick={() => setLocation('/shops')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              
              {recentOrders.length === 0 ? (
                <Card className="p-6 text-center">
                  <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">No active orders</h4>
                  <p className="text-sm text-gray-600 mb-4">Place your first order to get started</p>
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
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-black">#{order.id}</h4>
                              <p className="text-sm text-gray-600">{order.shop.name}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            </div>
                            <Badge className={
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{order.description}</p>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              size="sm"
                              onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                              className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black text-xs h-8"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedChatOrder(order.id)}
                              className="text-xs h-8"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                              {order.unreadMessages > 0 && (
                                <Badge variant="destructive" className="ml-1 text-xs px-1">
                                  {order.unreadMessages}
                                </Badge>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`tel:${order.shop.phone}`)}
                              className="text-xs h-8"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
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

        {/* Shops Tab */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {/* Previously Visited Shops */}
            {visitedShops.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" />
                  Previously Visited
                </h3>
                <div className="space-y-3">
                  {visitedShops.slice(0, 3).map((shop) => (
                    <Card key={shop.id} className="border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
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
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black text-xs h-8"
                            onClick={() => setLocation(`/shops/${shop.id}/upload`)}
                            disabled={!shop.isOpen}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Files
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setLocation(`/shops/${shop.id}`)}
                            className="text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Shops */}
            <div>
              <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
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
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-black">{shop.name}</h4>
                            <p className="text-sm text-gray-600">{shop.address}</p>
                            {shop.services && shop.services.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {shop.services.slice(0, 2).map((service, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                                {shop.services.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{shop.services.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={shop.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {shop.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black text-xs h-8"
                            onClick={() => setLocation(`/shops/${shop.id}/upload`)}
                            disabled={!shop.isOpen}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Files
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setLocation(`/shops/${shop.id}`)}
                            className="text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
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

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h3 className="text-base font-semibold text-black mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              Order History
            </h3>
            
            {orders.length === 0 ? (
              <Card className="p-6 text-center">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">No order history</h4>
                <p className="text-sm text-gray-600">Your completed orders will appear here</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-black">#{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.shop.name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                          </p>
                        </div>
                        <Badge className={
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{order.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                          className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black text-xs h-8"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedChatOrder(order.id)}
                          className="text-xs h-8"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="ml-1 text-xs px-1">
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
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
        <div className="grid grid-cols-4 px-2 py-2">
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            className={`flex flex-col items-center gap-1 h-auto py-2 px-1 ${
              activeTab === 'orders' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs">Orders</span>
            {orders.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1 h-4 min-w-4">
                {orders.length}
              </Badge>
            )}
          </Button>
          
          <Button
            variant={activeTab === 'shops' ? 'default' : 'ghost'}
            className={`flex flex-col items-center gap-1 h-auto py-2 px-1 ${
              activeTab === 'shops' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('shops')}
          >
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Shops</span>
          </Button>
          
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            className={`flex flex-col items-center gap-1 h-auto py-2 px-1 ${
              activeTab === 'history' ? 'bg-[#FFBF00] text-black hover:bg-[#E6AC00]' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History className="h-4 w-4" />
            <span className="text-xs">History</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-gray-600"
            onClick={() => setLocation('/')}
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">Home</span>
          </Button>
        </div>
      </div>

      {/* Full-Screen Mobile Chat */}
      {selectedChatOrder && (
        <div className="fixed inset-0 z-50 bg-white">
          <MobileChatPanel
            orderId={selectedChatOrder}
            onClose={() => setSelectedChatOrder(null)}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}