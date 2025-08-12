import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import UnifiedChatSystem from './unified-chat-system';

interface Order {
  id: number;
  unreadCount?: number;
  unreadMessages?: number;
}

export default function UnifiedFloatingChatButton() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ✅ PROPERLY ENABLED: With correct authentication guards
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner'),
    staleTime: 300000,
    retry: 2,
  });

  // Calculate total unread messages  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: user?.role === 'shop_owner' 
      ? [`/api/orders/shop/${shopData?.shop?.id}`]
      : [`/api/orders/customer/${user?.id}`],
    enabled: user?.role === 'shop_owner' 
      ? Boolean(shopData?.shop?.id && user?.id)
      : Boolean(user?.id && user?.role === 'customer'),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 1;
    },
    select: (data) => {
      if (!data) return [];
      return data.filter(order => (order.unreadCount || order.unreadMessages) && (order.unreadCount || order.unreadMessages) > 0);
    }
  });

  const totalUnreadMessages = orders.reduce((sum, order) => sum + (order.unreadCount || order.unreadMessages || 0), 0);

  const handleChatOpen = () => {
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={handleChatOpen}
          className="h-12 w-12 rounded-full bg-[#FFBF00] hover:bg-black text-black hover:text-[#FFBF00] shadow-lg hover:shadow-xl transition-all duration-200 relative"
        >
          <MessageCircle className="w-5 h-5" />
          {totalUnreadMessages > 0 && (
            <div className="absolute -top-2 -right-2 bg-black text-[#FFBF00] text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold border border-[#FFBF00]">
              {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
            </div>
          )}
        </Button>
      </div>

      {/* Unified Chat System */}
      <UnifiedChatSystem 
        isOpen={isChatOpen}
        onClose={handleChatClose}
        userRole={user.role as 'customer' | 'shop_owner' | 'admin'}
      />
    </>
  );
}