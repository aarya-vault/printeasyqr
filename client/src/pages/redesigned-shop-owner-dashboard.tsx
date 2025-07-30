import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { printFile, printAllFiles } from '@/utils/print-helpers';
import {
  Search,
  Package,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Settings,
  Printer,
  Download,
  QrCode,
  Eye,
  Phone,
  LogOut,
  History,
  Calendar,
  User,
  Upload,
  Timer,
  Power,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';
import RedesignedShopQRModal from '@/components/redesigned-shop-qr-modal';
import UnifiedChatSystem from '@/components/unified-chat-system';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import OrderDetailsModal from '@/components/order-details-modal';
import { format } from 'date-fns';

interface Shop {
  id: number;
  name: string;
  slug: string;
  phone: string;
  address: string;
  city: string;
  publicContactNumber?: string;
  workingHours: any;
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
}

interface Order {
  id: number;
  customerId: number;
  shopId: number;
  customerName: string;
  customerPhone: string;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files: any;
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  unreadMessages?: number;
  isUrgent: boolean;
}

interface DashboardStats {
  totalOrdersToday: number;
  pendingOrders: number;
  completedToday: number;
  avgProcessingTime: string;
}

export default function RedesignedShopOwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUnifiedChat, setShowUnifiedChat] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Enhanced performance with shorter refetch intervals and background updates
  const { data: shopData, isLoading: shopLoading } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 10000, // 10 seconds
    enabled: !!user?.id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
    enabled: !!shopData?.shop?.id,
    refetchInterval: 15000, // 15 seconds for faster updates
    refetchIntervalInBackground: true,
    staleTime: 5000, // 5 seconds for fresh data
  });

  // Calculate order statistics efficiently
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dashboardStats: DashboardStats = {
    totalOrdersToday: orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    pendingOrders: (statusCounts.new || 0) + (statusCounts.processing || 0),
    completedToday: orders.filter(o => 
      o.status === 'completed' && 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    avgProcessingTime: '2.5 hrs'
  };

  // Filter orders with improved performance - exclude completed orders
  const filteredOrders = orders.filter(order => {
    // Exclude completed orders (they go to Order History)
    if (order.status === 'completed') return false;
    
    const matchesSearch = searchQuery === '' || 
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Separate orders by type for better organization
  const uploadOrders = filteredOrders.filter(order => order.type === 'upload');
  const walkinOrders = filteredOrders.filter(order => order.type === 'walkin');

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [`/api/orders/shop/${shopData?.shop?.id}`] });
      
      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>([`/api/orders/shop/${shopData?.shop?.id}`]);
      
      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(
        [`/api/orders/shop/${shopData?.shop?.id}`],
        (old) => {
          if (!old) return old;
          return old.map(order => 
            order.id === orderId 
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order
          );
        }
      );
      
      // Show instant feedback to user
      toast({ 
        title: 'Status Updated!', 
        description: `Order #${orderId} status changed to ${status}` 
      });
      
      // Return a context object with the snapshotted value
      return { previousOrders };
    },
    onError: (err, { orderId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [`/api/orders/shop/${shopData?.shop?.id}`],
        context?.previousOrders
      );
      toast({ 
        title: 'Update Failed', 
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive' 
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${shopData?.shop?.id}`] });
    },
  });

  const toggleShopStatus = useMutation({
    mutationFn: async () => {
      if (!shopData?.shop?.id) {
        throw new Error('Shop ID not found');
      }
      const response = await fetch(`/api/shops/${shopData.shop.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update shop status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/owner/${user?.id}`] });
      toast({ 
        title: shopData?.shop?.isOnline ? 'Shop Closed' : 'Shop Opened',
        description: shopData?.shop?.isOnline ? 'You are no longer accepting orders' : 'You are now accepting orders'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update shop status',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handlePrintAll = async (order: Order) => {
    if (order.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        if (files.length > 0) {
          toast({ title: `Preparing ${files.length} files for printing...` });
          
          await printAllFiles(files, (current, total) => {
            if (current === total) {
              toast({ title: `All ${total} files sent to print` });
            }
          });
        }
      } catch (error) {
        console.error('Error printing files:', error);
        toast({ title: 'Error opening print dialogs', variant: 'destructive' });
      }
    }
  };

  const handleDownloadAll = (order: Order) => {
    if (order.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        let downloadCount = 0;
        
        files.forEach((file: any, index: number) => {
          setTimeout(() => {
            const fileUrl = `/uploads/${file.filename || file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = file.originalName || file.filename || `file_${index + 1}`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadCount++;
            if (downloadCount === files.length) {
              toast({
                title: "Downloads Complete",
                description: `${files.length} files downloaded successfully`
              });
            }
          }, index * 300);
        });
      } catch (error) {
        console.error('Error downloading files:', error);
        toast({
          title: "Download Error",
          description: "Failed to download files",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-brand-yellow/20 text-rich-black border-brand-yellow/40';
      case 'processing': return 'bg-brand-yellow/40 text-rich-black border-brand-yellow/60';
      case 'ready': return 'bg-brand-yellow/60 text-rich-black border-brand-yellow/80';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle }: any) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-rich-black">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="p-2 bg-brand-yellow/20 rounded-lg">
            <Icon className="w-5 h-5 text-brand-yellow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="transition-shadow hover:shadow-md border-l-4 border-l-brand-yellow">
      <CardContent className="p-4">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-rich-black">#{order.id}</span>
            </div>
            <div>
              <h3 className="font-semibold text-rich-black">{order.customerName}</h3>
              <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={`${getStatusColor(order.status)} border font-medium px-2 py-1`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            {order.unreadMessages && order.unreadMessages > 0 && (
              <Badge className="bg-brand-yellow text-rich-black font-medium">
                <MessageSquare className="w-3 h-3 mr-1" />
                {order.unreadMessages} unread
              </Badge>
            )}
            {order.isUrgent && (
              <Badge className="bg-brand-yellow text-rich-black font-medium">
                <Zap className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate" title={order.title}>{order.title}</span>
          </div>
          {order.type === 'upload' && order.files && (
            <div className="flex items-center text-sm text-gray-600">
              <Upload className="w-4 h-4 mr-2" />
              <span>
                {(() => {
                  const fileCount = Array.isArray(order.files) ? order.files.length : JSON.parse(order.files || '[]').length;
                  return fileCount > 0 ? `${fileCount} ${fileCount === 1 ? 'file' : 'files'}` : 'No files';
                })()}
              </span>
            </div>
          )}
          {order.walkinTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Timer className="w-4 h-4 mr-2" />
              <span>Walk-in: {format(new Date(order.walkinTime), 'HH:mm')}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `tel:${order.customerPhone}`}
            className="text-xs"
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs relative"
            onClick={() => {
              setSelectedOrderForChat(order.id);
              setShowUnifiedChat(true);
            }}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            {order.unreadMessages && order.unreadMessages > 0 ? (
              <>Chat ({order.unreadMessages})</>
            ) : (
              'Chat'
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedOrderForDetails(order)}
            className="text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>

        {/* File Actions for Upload Orders */}
        {order.type === 'upload' && order.files && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrintAll(order)}
              className="text-xs"
            >
              <Printer className="w-3 h-3 mr-1" />
              Print All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadAll(order)}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
          </div>
        )}

        {/* Status Update Actions */}
        {order.status !== 'completed' && (
          <div className="grid grid-cols-2 gap-2">
            {order.status === 'new' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'processing' })}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Start Processing
              </Button>
            )}
            {order.status === 'processing' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'ready' })}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'completed' })}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Complete Order
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (shopLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b relative">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-rich-black">
                {shopData?.shop?.name || 'Shop Dashboard'}
              </h1>
              <Badge className={shopData?.shop?.isOnline ? 'bg-brand-yellow text-rich-black' : 'bg-gray-200 text-gray-800'}>
                {shopData?.shop?.isOnline ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/shop-order-history')}
              >
                <History className="w-4 h-4 mr-2" />
                Order History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/shop-settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          
          {/* NEW PROFESSIONAL HEADER CONTROLS */}
          <div className="flex items-center space-x-4">
            {/* Shop Status Toggle - Redesigned */}
            <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
              <span className="text-sm font-medium text-gray-600 mr-3">Status:</span>
              <button
                onClick={() => {
                  if (shopData?.shop?.id) {
                    toggleShopStatus.mutate();
                  }
                }}
                disabled={toggleShopStatus.isPending}
                className={`
                  px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 min-w-[80px]
                  ${shopData?.shop?.isOnline 
                    ? 'bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                  ${toggleShopStatus.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${shopData?.shop?.isOnline ? 'bg-green-600' : 'bg-red-500'}`}></div>
                  {shopData?.shop?.isOnline ? 'OPEN' : 'CLOSED'}
                </div>
              </button>
            </div>

            {/* Logout Button - Redesigned */}
            <button
              onClick={() => {
                // Simple, direct logout
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Today's Orders"
            value={dashboardStats.totalOrdersToday}
            icon={Package}
            subtitle="New orders today"
          />
          <StatCard
            title="Pending Orders"
            value={dashboardStats.pendingOrders}
            icon={Clock}
            subtitle="Awaiting action"
          />
          <StatCard
            title="Completed Today"
            value={dashboardStats.completedToday}
            icon={CheckCircle2}
            subtitle="Orders completed"
          />
          <StatCard
            title="Avg. Processing"
            value={dashboardStats.avgProcessingTime}
            icon={BarChart3}
            subtitle="Average time"
          />
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders by customer name, order ID, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'new', 'processing', 'ready'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedStatus === status ? "default" : "outline"}
                    onClick={() => setSelectedStatus(status)}
                    className={selectedStatus === status ? 'bg-brand-yellow text-rich-black' : ''}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4-Column Orders Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* File Upload Orders - 2 Columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/20">
              <div className="flex items-center">
                <Upload className="w-6 h-6 mr-3 text-brand-yellow" />
                <div>
                  <h2 className="text-lg font-bold text-rich-black">File Upload Orders</h2>
                  <p className="text-sm text-gray-600">Digital file printing orders</p>
                </div>
              </div>
              {uploadOrders.length > 0 && (
                <Badge className="bg-brand-yellow text-rich-black font-semibold px-3 py-1">
                  {uploadOrders.length} {uploadOrders.length === 1 ? 'Order' : 'Orders'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {uploadOrders.length === 0 ? (
                <div className="xl:col-span-2">
                  <Card className="border-dashed border-2 border-brand-yellow/30">
                    <CardContent className="p-8 text-center">
                      <Upload className="w-12 h-12 text-brand-yellow/50 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No upload orders yet</p>
                      <p className="text-sm text-gray-400">File upload orders will appear here</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                uploadOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </div>

          {/* Walk-in Orders - 2 Columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/20">
              <div className="flex items-center">
                <Users className="w-6 h-6 mr-3 text-brand-yellow" />
                <div>
                  <h2 className="text-lg font-bold text-rich-black">Walk-in Orders</h2>
                  <p className="text-sm text-gray-600">Immediate pickup orders</p>
                </div>
              </div>
              {walkinOrders.length > 0 && (
                <Badge className="bg-brand-yellow text-rich-black font-semibold px-3 py-1">
                  {walkinOrders.length} {walkinOrders.length === 1 ? 'Order' : 'Orders'}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {walkinOrders.length === 0 ? (
                <div className="xl:col-span-2">
                  <Card className="border-dashed border-2 border-brand-yellow/30">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-brand-yellow/50 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No walk-in orders yet</p>
                      <p className="text-sm text-gray-400">Walk-in orders will appear here</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                walkinOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQRModal && shopData?.shop && (
        <RedesignedShopQRModal
          shop={shopData.shop}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showUnifiedChat && selectedOrderForChat && (
        <UnifiedChatSystem
          isOpen={showUnifiedChat}
          onClose={() => {
            setShowUnifiedChat(false);
            setSelectedOrderForChat(null);
          }}
          initialOrderId={selectedOrderForChat}
          userRole="shop_owner"
        />
      )}

      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={{
            ...selectedOrderForDetails,
            isUrgent: selectedOrderForDetails.isUrgent || false
          }}
          userRole="shop_owner"
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {/* Floating Chat Button */}
      <UnifiedFloatingChatButton />
    </div>
  );
}