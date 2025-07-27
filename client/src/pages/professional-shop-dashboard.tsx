import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/professional-layout';
import DesktopShopRealtimePanel from '@/components/desktop-shop-realtime-panel';
import ChatFloatingButton from '@/components/chat-floating-button';
import { ProfessionalLoading } from '@/components/professional-loading';
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

  // Fetch shop data
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/shop', shop?.id],
    enabled: !!shop?.id
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
    <DashboardLayout title={`${shop.name} - Dashboard`}>
      {/* Desktop Realtime Panel */}
      <DesktopShopRealtimePanel
        shopId={shop.id}
        onOrderSelect={setSelectedOrder}
        onChatOpen={setSelectedOrderForChat}
        className="bg-white rounded-lg border"
      />

      {/* Floating Chat Button for Mobile */}
      <ChatFloatingButton />
    </DashboardLayout>
  );
}