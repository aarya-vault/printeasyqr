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

  // Fetch user notifications with real-time updates
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time feel
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale for real-time updates
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
        className={`relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors ${className}`}
        onClick={handleClick}
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
        
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-white font-bold shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
      
      <NotificationsModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}