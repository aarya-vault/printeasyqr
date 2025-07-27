import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/professional-layout';
import MobileChatPanel from '@/components/mobile-chat-panel';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  Eye,
  MessageCircle,
  Phone,
  Printer,
  Search,
  Settings,
  QrCode,
  ShoppingBag,
  Upload,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  customer: {
    name: string;
    phone: string;
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

interface Shop {
  id: number;
  name: string;
  isAcceptingOrders: boolean;
  workingHours: any;
}

export default function ProfessionalShopDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);

  // Fetch shop data with frequent updates for 24/7 monitoring
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Frequent updates for 24/7 operations
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/shop', shop?.id],
    enabled: !!shop?.id,
    refetchInterval: 3000, // Very frequent for peak hours management
  });

  // Get unread messages count for at-a-glance monitoring
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/messages/shop', shop?.id, 'unread-count'],
    enabled: !!shop?.id,
    refetchInterval: 2000, // Real-time message monitoring
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop', shop?.id] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter orders based on search and type
  const filteredOrders = orders.filter(order =>
    order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  // Separate upload and walk-in orders as requested
  const uploadOrders = filteredOrders.filter(o => o.type === 'upload');
  const walkinOrders = filteredOrders.filter(o => o.type === 'walkin');

  // Status counts for stats
  const statusCounts = React.useMemo(() => ({
    new: orders.filter(o => o.status === 'new').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length
  }), [orders]);

  const handlePrintFiles = async (order: Order) => {
    if (!order.files || order.files.length === 0) {
      toast({
        title: "No Files",
        description: "This order has no files to print.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Print all files sequentially
      for (let i = 0; i < order.files.length; i++) {
        const file = order.files[i];
        const fileUrl = `/uploads/${file.filename}`;
        
        // Open print window
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Popup blocked');
        }

        // Determine content based on file type
        const fileExtension = file.filename.split('.').pop()?.toLowerCase();
        let content = '';

        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
          content = `
            <html>
              <head><title>Print - ${file.originalName}</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                <img src="${fileUrl}" style="max-width:100%;max-height:100vh;" onload="setTimeout(() => window.print(), 1000)">
              </body>
            </html>
          `;
        } else if (fileExtension === 'pdf') {
          content = `
            <html>
              <head><title>Print - ${file.originalName}</title></head>
              <body style="margin:0;">
                <embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">
                <script>setTimeout(() => window.print(), 2000);</script>
              </body>
            </html>
          `;
        } else {
          content = `
            <html>
              <head><title>Print - ${file.originalName}</title></head>
              <body style="margin:0;">
                <iframe src="${fileUrl}" width="100%" height="100%" onload="setTimeout(() => window.print(), 1000)"></iframe>
              </body>
            </html>
          `;
        }

        printWindow.document.write(content);
        printWindow.document.close();

        // Wait between prints to avoid blocking
        if (i < order.files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      toast({
        title: "Print Started",
        description: `Printing ${order.files.length} file(s) for order #${order.id}`,
      });
    } catch (error) {
      toast({
        title: "Print Failed", 
        description: "Failed to print files. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (shopLoading || ordersLoading) {
    return (
      <DashboardLayout title="Shop Dashboard">
        <ProfessionalLoading message="Loading your shop dashboard..." size="lg" />
      </DashboardLayout>
    );
  }

  if (!shop) {
    return (
      <DashboardLayout title="Shop Dashboard">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shop Found</h2>
          <p className="text-gray-600">Please contact admin for shop setup.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${shop.name} - 24/7 Operations`}>
      {/* Desktop Shop Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black">{shop.name} Dashboard</h1>
            <p className="text-gray-600">2-Column Layout: Upload Files + Walk-in Orders</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setLocation('/shop-settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
              onClick={() => setLocation('/shop/qr')}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: 'New Orders', value: statusCounts.new, color: 'text-blue-600' },
            { label: 'Processing', value: statusCounts.processing, color: 'text-yellow-600' },
            { label: 'Ready', value: statusCounts.ready, color: 'text-green-600' },
            { label: 'Completed Today', value: statusCounts.completed, color: 'text-gray-600' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders by customer, ID, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 2-Column Layout: Upload Files + Walk-in Orders */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Upload Files Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Upload File Orders</h3>
              <Badge variant="secondary">{uploadOrders.length}</Badge>
            </div>
            <ScrollArea className="h-[700px]">
              <div className="space-y-3 pr-4">
                {uploadOrders.map((order) => (
                  <Card key={order.id} className="border-blue-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {order.status}
                          </Badge>
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {order.unreadMessages}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      
                      {order.files && order.files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {order.files.length} file(s) to print
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintFiles(order)}
                            className="w-full text-xs h-7"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print All Files
                          </Button>
                        </div>
                      )}
                      
                      {/* Status Update Buttons */}
                      <div className="space-y-2">
                        {order.status === 'new' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'processing' })}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Start Processing
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'completed' })}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Mark Completed
                          </Button>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                            className="flex-1 text-xs h-7"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderForChat(order.id)}
                            className="flex-1 text-xs h-7"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.customer.phone}`)}
                            className="flex-1 text-xs h-7"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {uploadOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No upload file orders</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Walk-in Orders Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Walk-in Orders</h3>
              <Badge variant="secondary">{walkinOrders.length}</Badge>
            </div>
            <ScrollArea className="h-[700px]">
              <div className="space-y-3 pr-4">
                {walkinOrders.map((order) => (
                  <Card key={order.id} className="border-green-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">#{order.id}</h4>
                          <p className="text-xs text-gray-600">{order.customer.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {order.status}
                          </Badge>
                          {order.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {order.unreadMessages}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{order.description}</p>
                      <p className="text-xs text-gray-500 mb-3">Walk-in customer order</p>
                      
                      {/* Status Update Buttons */}
                      <div className="space-y-2">
                        {order.status === 'new' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'processing' })}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Start Processing
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'completed' })}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs h-7"
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Mark Completed
                          </Button>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/shop-dashboard/orders/${order.id}`)}
                            className="flex-1 text-xs h-7"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderForChat(order.id)}
                            className="flex-1 text-xs h-7"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.customer.phone}`)}
                            className="flex-1 text-xs h-7"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {walkinOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No walk-in orders</p>
                    <p className="text-xs text-gray-400 mt-1">Share your QR code with customers</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Desktop Chat Modal for Quick Responses */}
      {selectedOrderForChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order #{selectedOrderForChat} Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrderForChat(null)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MobileChatPanel
                orderId={selectedOrderForChat}
                onClose={() => setSelectedOrderForChat(null)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Message Notification Overlay for 24/7 Monitoring */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}