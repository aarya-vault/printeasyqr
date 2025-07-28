import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { ChatInterface } from './chat-interface';

interface Order {
  id: number;
  title: string;
  status: 'new' | 'processing' | 'ready' | 'completed' | 'cancelled';
  customerId: number;
  shopId: number;
  shop?: {
    id: number;
    name: string;
    phone?: string;
  };
  unreadMessages?: number;
}

interface FloatingChatButtonProps {
  onOpenChat?: (orderId?: number) => void;
}

export function FloatingChatButton({ onOpenChat }: FloatingChatButtonProps) {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch orders to count unread messages
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate total unread messages from active orders
  const totalUnreadMessages = orders
    .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
    .reduce((total, order) => total + (order.unreadMessages || 0), 0);

  const handleChatOpen = () => {
    setIsChatOpen(true);
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  // Don't show button if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={handleChatOpen}
          className="h-12 w-12 rounded-full bg-[#FFBF00] hover:bg-black text-black hover:text-[#FFBF00] shadow-lg hover:shadow-xl transition-all duration-200 relative border-2 border-black"
        >
          <MessageCircle className="w-5 h-5" />
          {totalUnreadMessages > 0 && (
            <div className="absolute -top-2 -right-2 bg-black text-[#FFBF00] text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold border border-[#FFBF00]">
              {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
            </div>
          )}
        </Button>
      </div>

      {/* Chat Interface */}
      <ChatInterface 
        isOpen={isChatOpen}
        onClose={handleChatClose}
      />
    </>
  );
}