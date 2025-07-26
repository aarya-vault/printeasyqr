import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Package,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowLeft,
  BellOff,
  Eye,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'order_update' | 'system' | 'chat';
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export default function ShopNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/user/${user?.id}/read-all`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.isRead)
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on type and relatedId
    if (notification.type === 'order_update' && notification.relatedId) {
      navigate(`/shop-dashboard/orders/${notification.relatedId}`);
    } else if (notification.type === 'chat' && notification.relatedId) {
      navigate(`/shop-dashboard/chat/${notification.relatedId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update': return <Package className="w-5 h-5" />;
      case 'chat': return <MessageSquare className="w-5 h-5" />;
      case 'system': return <Bell className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order_update': return 'text-brand-yellow';
      case 'chat': return 'text-blue-500';
      case 'system': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/shop-dashboard">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-rich-black">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-brand-yellow text-rich-black">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-brand-yellow text-rich-black hover:bg-brand-yellow/90' : ''}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-brand-yellow text-rich-black hover:bg-brand-yellow/90' : ''}
              >
                Unread
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'You have no unread notifications' 
                  : 'You have no notifications yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-brand-yellow' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        !notification.isRead ? 'bg-brand-yellow/20' : 'bg-gray-100'
                      }`}>
                        <span className={getIconColor(notification.type)}>
                          {getIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-rich-black ${
                          !notification.isRead ? 'font-bold' : ''
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.relatedId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification.mutate(notification.id);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}