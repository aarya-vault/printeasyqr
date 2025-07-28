import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/contexts/websocket-context';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NotificationsModal from './notifications-modal';

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
  const [showModal, setShowModal] = useState(false);

  // Fetch user notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds for testing
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

  const handleClick = () => {
    console.log('Notification bell clicked, unread count:', unreadCount);
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div 
        className={`relative cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <Bell className="w-5 h-5 text-gray-600 mb-1" />
        
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </div>
      
      <NotificationsModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}