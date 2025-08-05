import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { 
  Bell, BellOff, Package, MessageSquare, AlertCircle, 
  CheckCircle, Info, ArrowLeft, Trash2, Check
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'order_update' | 'message' | 'system' | 'promotion';
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export default function ShopNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Get notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiClient.patch(`/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiClient.delete(`/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return await apiClient.patch(`/api/notifications/user/${user?.id}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/user/${user?.id}`] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <Package className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'system':
        return <Info className="w-5 h-5" />;
      case 'promotion':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'text-blue-600 bg-blue-50';
      case 'message':
        return 'text-green-600 bg-green-50';
      case 'system':
        return 'text-gray-600 bg-gray-50';
      case 'promotion':
        return 'text-brand-yellow bg-brand-yellow/10';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'order_update' && notification.relatedId) {
      navigate('/shop-dashboard');
    } else if (notification.type === 'message' && notification.relatedId) {
      navigate('/shop-dashboard');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/shop-dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500">
                When you receive new orders or messages, they'll appear here
              </p>
              <Link href="/shop-dashboard">
                <Button className="mt-6 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-brand-yellow' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-rich-black">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge className="bg-brand-yellow text-rich-black text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(notification.id);
                      }}
                      className="ml-2 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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