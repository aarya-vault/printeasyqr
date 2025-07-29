import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
  Trash2,
  Upload,
  UserCheck
} from 'lucide-react';
import { CanvasQRModal } from '@/components/canvas-qr-modal';
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
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files: string[];
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  unreadMessages?: number;
}

export default function RedesignedShopDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  // WebSocket integration for real-time updates
  useEffect(() => {
    if (!shopData?.shop?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected for shop dashboard');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ORDER_STATUS_UPDATED' && data.shopId === shopData?.shop?.id) {
          // Immediately update the orders query cache
          queryClient.invalidateQueries({ 
            queryKey: [`/api/orders/shop/${shopData.shop.id}`],
            refetchType: 'all'
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [shopData?.shop?.id, queryClient]);

  // Fetch shop data
  const { data: shopData } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
  });

  // Fetch orders with aggressive caching for instant UI updates
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
    enabled: !!shopData?.shop?.id,
    staleTime: 1000, // Very short stale time for faster updates
    refetchInterval: 3000, // Aggressive background refresh
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Filter orders by search and type
  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(search) ||
      order.title?.toLowerCase().includes(search) ||
      order.description?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
  });

  const uploadOrders = filteredOrders.filter(order => order.type === 'upload');
  const walkinOrders = filteredOrders.filter(order => order.type === 'walkin');

  // Status counts
  const statusCounts = {
    new: orders.filter(o => o.status === 'new').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/orders/shop/${shopData?.shop?.id}`] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>([`/api/orders/shop/${shopData?.shop?.id}`]);

      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>([`/api/orders/shop/${shopData?.shop?.id}`], old => 
        old?.map(order => 
          order.id === orderId ? { ...order, status } : order
        ) || []
      );

      // Return a context object with the snapshotted value
      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrders) {
        queryClient.setQueryData([`/api/orders/shop/${shopData?.shop?.id}`], context.previousOrders);
      }
      toast({ 
        title: 'Failed to update status', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    },
    onSuccess: () => {
      toast({ title: 'Order status updated successfully' });
      // Force immediate refetch for instant UI update
      queryClient.refetchQueries({ 
        queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
        type: 'active'
      });
    },
    onSettled: () => {
      // Ensure data is always fresh
      queryClient.invalidateQueries({ 
        queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
        refetchType: 'all'
      });
    },
  });

  const handlePrintAll = (order: Order) => {
    if (order.files && order.files.length > 0) {
      order.files.forEach(file => {
        const printWindow = window.open(`/api/files/${file}`, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      });
    }
  };

  const handleDownloadAll = (order: Order) => {
    if (order.files && order.files.length > 0) {
      order.files.forEach(file => {
        const link = document.createElement('a');
        link.href = `/api/files/${file}`;
        link.download = file;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3" />;
      case 'ready': return <CheckCircle2 className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-lg">#{order.id}</h3>
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1">{order.status}</span>
            </Badge>
            {order.unreadMessages && order.unreadMessages > 0 && (
              <Badge variant="destructive" className="bg-red-500 text-white">
                <MessageSquare className="w-3 h-3 mr-1" />
                {order.unreadMessages}
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {format(new Date(order.createdAt), 'HH:mm')}
          </span>
        </div>

        {/* Customer Info */}
        <div className="space-y-1 mb-3">
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-gray-600 line-clamp-1">{order.title}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `tel:${order.customerPhone}`}
            className="flex-1"
          >
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Link href={`/shop-dashboard/chat/${order.id}`}>
            <Button size="sm" variant="outline" className="relative">
              <MessageSquare className="w-3 h-3 mr-1" />
              Chat
              {order.unreadMessages && order.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </Link>
          <Link href={`/shop-dashboard/orders/${order.id}`}>
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
          </Link>
        </div>

        {/* File Actions for Upload Orders */}
        {order.type === 'upload' && order.files && order.files.length > 0 && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrintAll(order)}
              className="flex-1"
            >
              <Printer className="w-3 h-3 mr-1" />
              Print All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadAll(order)}
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
          </div>
        )}

        {/* Status Update Button */}
        {order.status !== 'completed' && (
          <Button
            size="sm"
            className="w-full mt-2 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
            disabled={updateOrderStatus.isPending}
            onClick={() => {
              const nextStatus = {
                new: 'processing',
                processing: 'ready',
                ready: 'completed'
              }[order.status];
              if (nextStatus) {
                updateOrderStatus.mutate({ orderId: order.id, status: nextStatus });
              }
            }}
          >
            {updateOrderStatus.isPending ? (
              <div className="flex items-center">
                <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                Updating...
              </div>
            ) : (
              <>
                {order.status === 'new' && 'Start Processing'}
                {order.status === 'processing' && 'Mark as Ready'}
                {order.status === 'ready' && 'Mark as Completed'}
              </>
            )}
          </Button>
        )}

        {/* Delete for Walk-in if New */}
        {order.type === 'walkin' && order.status === 'new' && (
          <Button
            size="sm"
            variant="destructive"
            className="w-full mt-2"
            onClick={() => {/* Implement delete */}}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (!shopData?.shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shop data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-rich-black">{shopData.shop.name}</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Online
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowQRModal(true)}
                className="border-brand-yellow text-rich-black hover:bg-brand-yellow/10"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Shop QR Code
              </Button>
              <Link href="/shop-order-history">
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  Order History
                </Button>
              </Link>
              <Link href="/shop-settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{statusCounts.new}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-rich-black">{statusCounts.processing}</p>
                </div>
                <Clock className="w-8 h-8 text-brand-yellow" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready</p>
                  <p className="text-2xl font-bold text-rich-black">{statusCounts.ready}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-rich-black">{statusCounts.completed}</p>
                </div>
                <Package className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search orders by customer name, order ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>

        {/* Orders Grid - 4 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Files - Column 1 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-rich-black flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Uploaded Files
              </h2>
              <Badge variant="secondary">{uploadOrders.length}</Badge>
            </div>
            <div className="space-y-3">
              {uploadOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {uploadOrders.length === 0 && (
                <Card className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No upload orders</p>
                </Card>
              )}
            </div>
          </div>

          {/* Upload Files - Column 2 */}
          <div className="hidden lg:block">
            <div className="h-12 mb-4" /> {/* Spacer for alignment */}
            <div className="space-y-3">
              {/* This column shows overflow from column 1 if needed */}
            </div>
          </div>

          {/* Walk-in Orders - Column 3 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-rich-black flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Walk-in Orders
              </h2>
              <Badge variant="secondary">{walkinOrders.length}</Badge>
            </div>
            <div className="space-y-3">
              {walkinOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {walkinOrders.length === 0 && (
                <Card className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No walk-in orders</p>
                </Card>
              )}
            </div>
          </div>

          {/* Walk-in Orders - Column 4 */}
          <div className="hidden lg:block">
            <div className="h-12 mb-4" /> {/* Spacer for alignment */}
            <div className="space-y-3">
              {/* This column shows overflow from column 3 if needed */}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && shopData.shop && (
        <CanvasQRModal
          isOpen={showQRModal}
          shop={shopData.shop}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}