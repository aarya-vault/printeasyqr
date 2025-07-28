import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

interface FloatingChatButtonProps {
  onOpenChat?: (orderId: number) => void;
}

interface Order {
  id: number;
  title: string;
  status: string;
  shop?: {
    name: string;
  };
  unreadMessages?: number;
}

export default function FloatingChatButton({ onOpenChat }: FloatingChatButtonProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch customer orders with unread message counts
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id,
  });

  // Filter orders that have active conversations (not completed)
  const activeOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );

  // Calculate total unread messages
  const totalUnreadMessages = activeOrders.reduce((total, order) => 
    total + (order.unreadMessages || 0), 0
  );

  if (!user) {
    return null;
  }

  // Show floating chat button if there are active orders, or always show for testing
  const shouldShow = activeOrders.length > 0;

  return (
    <>
      {/* Floating Chat Button - Positioned above bottom navigation */}
      <div className="fixed bottom-20 right-4 z-40">
        {isExpanded ? (
          <Card className="w-80 max-h-96 bg-white shadow-xl border-2 border-brand-yellow mb-2">
            <CardHeader className="pb-3 bg-brand-yellow">
              <div className="flex items-center justify-between">
                <CardTitle className="text-rich-black text-sm font-semibold">
                  Active Chats
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 text-rich-black hover:bg-yellow-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-60 overflow-y-auto">
              {activeOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No active chats available
                </div>
              ) : (
                activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onOpenChat?.(order.id);
                    setIsExpanded(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rich-black truncate">
                        {order.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.shop?.name}
                      </p>
                    </div>
                    {order.unreadMessages && order.unreadMessages > 0 && (
                      <div className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {order.unreadMessages > 9 ? '9+' : order.unreadMessages}
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setIsExpanded(true)}
            className="h-12 w-12 rounded-full bg-brand-yellow hover:bg-yellow-400 text-rich-black shadow-lg hover:shadow-xl transition-all duration-200 relative"
          >
            <MessageCircle className="w-5 h-5" />
            {totalUnreadMessages > 0 && (
              <div className="absolute -top-1 -right-1 bg-rich-black text-brand-yellow text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold border border-brand-yellow">
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </div>
            )}
          </Button>
        )}
      </div>

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}