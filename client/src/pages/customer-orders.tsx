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
  FileText, Upload, Users, Clock, CheckCircle2, Package,
  Home, ShoppingCart, User, Star
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingScreen from '@/components/common/loading-screen';
import BottomNavigation from '@/components/common/bottom-navigation';
import EnhancedCustomerOrderDetails from '@/components/common/enhanced-customer-order-details';
import UnifiedFloatingChatButton from '@/components/common/unified-floating-chat-button';
import UnifiedChatSystem from '@/components/common/unified-chat-system';
import UnifiedOrderCard from '@/components/common/unified-order-card';
import RealTimeNotificationBell from '@/components/common/real-time-notification-bell';

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
      </div>

      {/* Centralized Bottom Navigation */}
      <BottomNavigation />

      {/* Unified Chat System */}
      {selectedOrderForChat && (
        <UnifiedChatSystem
          isOpen={!!selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
          initialOrderId={selectedOrderForChat}
          userRole="customer"
        />
      )}

      {selectedOrderForDetails && (
        <EnhancedCustomerOrderDetails
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {/* Unified Floating Chat Button */}
      <UnifiedFloatingChatButton />
    </div>
  );
}