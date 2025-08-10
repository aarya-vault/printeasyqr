import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, Package, Info, Tag, ArrowLeft, CheckCircle2, 
  Clock, Store, AlertCircle
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'order' | 'system' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  orderId?: number;
  shopName?: string;
  actionUrl?: string;
}

export default function CustomerNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/notifications/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/user/${user?.id}/read-all`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsReadMutation.mutate(notification.id);
    }

    // Navigate to action URL if present
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.orderId) {
      navigate(`/customer-dashboard?order=${notification.orderId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5" />;
      case 'system':
        return <Info className="w-5 h-5" />;
      case 'promotion':
        return <Tag className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600 bg-blue-50';
      case 'system':
        return 'text-gray-600 bg-gray-50';
      case 'promotion':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-rich-black">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-brand-yellow text-rich-black">
                  {unreadCount} New
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="order">Orders</TabsTrigger>
            <TabsTrigger value="promotion">Promotions</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">
                    No notifications
                  </h3>
                  <p className="text-medium-gray">
                    {activeTab === 'unread' 
                      ? "You're all caught up!"
                      : "No notifications in this category"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification: Notification) => (
                  <Card 
                    key={notification.id}
                    className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-rich-black">
                                {notification.title}
                              </h4>
                              {notification.shopName && (
                                <p className="text-sm text-medium-gray flex items-center mt-1">
                                  <Store className="w-3 h-3 mr-1" />
                                  {notification.shopName}
                                </p>
                              )}
                            </div>
                            {!notification.isRead && (
                              <Badge variant="default" className="bg-blue-600 ml-2">
                                New
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-medium-gray mt-2">
                            {notification.message}
                          </p>
                          
                          <p className="text-xs text-gray-400 mt-2 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}