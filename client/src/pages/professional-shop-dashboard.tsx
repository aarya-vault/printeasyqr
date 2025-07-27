import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/professional-layout';
import DesktopShopRealtimePanel from '@/components/desktop-shop-realtime-panel';
import MobileChatPanel from '@/components/mobile-chat-panel';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  customer: {
    name: string;
    phone: string;
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

interface Shop {
  id: number;
  name: string;
  isAcceptingOrders: boolean;
  workingHours: any;
}

export default function ProfessionalShopDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);

  // Fetch shop data with frequent updates for 24/7 monitoring
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Frequent updates for 24/7 operations
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/shop', shop?.id],
    enabled: !!shop?.id,
    refetchInterval: 3000, // Very frequent for peak hours management
  });

  // Get unread messages count for at-a-glance monitoring
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/messages/shop', shop?.id, 'unread-count'],
    enabled: !!shop?.id,
    refetchInterval: 2000, // Real-time message monitoring
  });

  if (shopLoading || ordersLoading) {
    return (
      <DashboardLayout title="Shop Dashboard">
        <ProfessionalLoading message="Loading your shop dashboard..." size="lg" />
      </DashboardLayout>
    );
  }

  if (!shop) {
    return (
      <DashboardLayout title="Shop Dashboard">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shop Found</h2>
          <p className="text-gray-600">Please contact admin for shop setup.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${shop.name} - 24/7 Operations`}>
      {/* Desktop Real-time Monitoring Panel - Optimized for 24/7 Usage */}
      <DesktopShopRealtimePanel
        shopId={shop.id}
        onOrderSelect={setSelectedOrder}
        onChatOpen={setSelectedOrderForChat}
        className="bg-white rounded-lg border shadow-sm"
      />

      {/* Desktop Chat Modal for Quick Responses */}
      {selectedOrderForChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order #{selectedOrderForChat} Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrderForChat(null)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MobileChatPanel
                orderId={selectedOrderForChat}
                onClose={() => setSelectedOrderForChat(null)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Message Notification Overlay for 24/7 Monitoring */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}