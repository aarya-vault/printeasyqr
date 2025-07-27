import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X
} from 'lucide-react';

interface ChatFloatingButtonProps {
  className?: string;
}

export default function ChatFloatingButton({ className = '' }: ChatFloatingButtonProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Get total unread messages count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/messages/unread-count'],
    enabled: !!user,
    refetchInterval: 5000, // Check for new messages every 5 seconds
  });

  if (!isVisible || !user) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 lg:hidden ${className}`}>
      <div className="relative">
        {/* Floating Chat Button */}
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => {
            // This would typically open a chat list or navigate to messages
            // For now, we'll just show that it's interactive
            console.log('Chat button clicked');
          }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Unread Messages Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Quick Access Label */}
      {unreadCount > 0 && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 border animate-bounce">
          <p className="text-xs font-medium text-gray-900">
            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}