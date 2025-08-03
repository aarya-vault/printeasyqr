import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import UnifiedChatSystem from './unified-chat-system';

interface Order {
  id: number;
  unreadMessages?: number;
}

export default function UnifiedFloatingChatButton() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 🔄 RE-ENABLED: With proper authentication guards
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner' && user?.email && user?.name && user?.name.trim() && user?.name !== 'Shop Owner'),
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 300000,
    refetchInterval: false,
  });

  // Calculate total unread messages  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: user?.role === 'shop_owner' 
      ? [`/api/orders/shop/${shopData?.shop?.id}`]
      : [`/api/orders/customer/${user?.id}`],
    enabled: user?.role === 'shop_owner' 
      ? !!(shopData?.shop?.id && user?.id && user?.role === 'shop_owner')
      : !!(user?.id && user?.role === 'customer'),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 1;
    },
    select: (data) => {
      return data.filter(order => order.unreadMessages && order.unreadMessages > 0);
    }
  });

  const totalUnreadMessages = orders.reduce((sum, order) => sum + (order.unreadMessages || 0), 0);

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