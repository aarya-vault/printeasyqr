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

  // Fetch user notifications with real-time updates (only when authenticated)
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id && user.role !== undefined, // Only when fully authenticated
    refetchInterval: (!!user?.id && user.role !== undefined) ? 30000 : false, // PERFORMANCE FIX: Reduced from 3 seconds to 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    refetchOnWindowFocus: !!user?.id, // Only refetch on focus when authenticated
    staleTime: 10000, // PERFORMANCE FIX: 10 seconds cache to reduce load
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
        className={`relative cursor-pointer hover:bg-yellow-200 p-2 rounded-full transition-colors ${className}`}
        onClick={handleClick}
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-rich-black' : 'text-rich-black/60'}`} />
        
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-rich-black text-brand-yellow text-xs min-w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-brand-yellow font-bold shadow-lg animate-pulse">
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