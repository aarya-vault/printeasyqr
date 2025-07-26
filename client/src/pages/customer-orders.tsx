import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, Search, MessageCircle, Eye, Phone,
  FileText, Upload, Users, Clock, CheckCircle2, Package
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

export default function CustomerOrders() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Fetch customer orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(search) ||
      order.description.toLowerCase().includes(search) ||
      order.shop?.name.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
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
    return <LoadingScreen message="Loading your orders..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/customer-dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Your Orders</h1>
                <p className="text-sm text-gray-500">{orders.length} total orders</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders by title, shop name, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6 py-6 pb-24">
        {filteredOrders.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching orders' : 'No orders yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start by placing your first order!'
                }
              </p>
              {!searchQuery && (
                <Link href="/customer-dashboard">
                  <Button className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
                    Place Your First Order
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((order) => (
                <Card key={order.id} className="bg-white hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">ORD{order.id.toString().padStart(3, '0')}</span>
                          {order.isUrgent && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>
                        </div>
                        <h3 className="font-medium text-rich-black">{order.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'dd MMM')}</p>
                        <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'HH:mm')}</p>
                      </div>
                    </div>

                    {/* Shop Info */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">{order.shop?.name || 'Print Shop'}</p>
                      <p className="text-xs text-gray-500">{order.description}</p>
                    </div>

                    {/* Order Type & Files */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        {order.type === 'upload' ? (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>File Upload</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            <span>Walk-in Order</span>
                          </>
                        )}
                      </div>
                      {order.type === 'upload' && order.files && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>
                            {(() => {
                              try {
                                const files = typeof order.files === 'string' 
                                  ? JSON.parse(order.files) 
                                  : order.files;
                                return Array.isArray(files) ? files.length : 0;
                              } catch {
                                return 0;
                              }
                            })()} files
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedOrderForDetails(order)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
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
                        onClick={() => window.location.href = `tel:${order.shop?.phone}`}
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/customer-dashboard">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Package className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </a>
          </Link>
          <Link href="/customer-orders">
            <a className="flex flex-col items-center justify-center py-3 text-brand-yellow">
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Orders</span>
            </a>
          </Link>
          <Link href="/customer-notifications">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Messages</span>
            </a>
          </Link>
          <Link href="/customer-account-settings">
            <a className="flex flex-col items-center justify-center py-3 text-gray-500">
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </a>
          </Link>
        </div>
      </div>

      {/* Modals */}
      {selectedOrderForChat && (
        <ShopChatModal
          orderId={selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
        />
      )}

      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}
    </div>
  );
}