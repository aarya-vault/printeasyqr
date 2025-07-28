import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/contexts/websocket-context';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface RealTimeNotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export default function RealTimeNotificationBell({ onClick, className = "" }: RealTimeNotificationBellProps) {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const queryClient = useQueryClient();

  // Fetch user notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time notification updates via WebSocket
  useEffect(() => {
    if (socket && user) {
      const handleNewNotification = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'newNotification' && data.userId === user.id) {
            queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user.id}`] });
          }
        } catch (error) {
          console.error('Error parsing notification WebSocket message:', error);
        }
      };

      socket.addEventListener('message', handleNewNotification);
      return () => socket.removeEventListener('message', handleNewNotification);
    }
  }, [socket, user, queryClient]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
      </div>
      
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}