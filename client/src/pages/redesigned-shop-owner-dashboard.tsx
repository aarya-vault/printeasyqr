import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { setNoIndexMeta, removeAllSEOMeta } from '@/utils/seo-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DashboardLoading, LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { printFile, printAllFiles, downloadFile, downloadAllFiles } from '@/utils/print-helpers';
import { launchPrintEasyConnect, isPlatformSupported } from '@/utils/protocol-helper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteOrder, canDeleteOrder } from '@/hooks/use-delete-order';
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
  Activity,
  TrendingUp,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Repeat,
  UserCheck,
  PieChart,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  CheckSquare,
  Square,
  Monitor
} from 'lucide-react';
import ProfessionalQRModal from '@/components/professional-qr-modal';
import UnifiedChatSystem from '@/components/unified-chat-system';
import UnifiedFloatingChatButton from '@/components/unified-floating-chat-button';
import OrderDetailsModal from '@/components/order-details-modal';
import { format } from 'date-fns';
import { calculateUnifiedShopStatus } from '@/utils/shop-timing';

// Using the shared Shop type from types
import type { Shop } from '@shared/types';

interface Order {
  id: number;
  orderNumber: number;
  customerId: number;
  shopId: number;
  customerName: string;
  customerPhone: string;
  type: 'upload' | 'walkin' | 'file_upload';
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
  deletedAt?: string | null;
}

interface DashboardStats {
  totalOrdersToday: number;
  pendingOrders: number;
  completedToday: number;
  avgProcessingTime: string;
}

// Analytics interface for integrated analytics
interface ShopAnalytics {
  shop: {
    id: number;
    name: string;
    city: string;
    state: string;
    rating: number;
    totalOrders: number;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    uniqueCustomers: number;
    completionRate: number;
    repeatCustomerRate: number;
    avgOrderValue: number;
    avgCompletionTime: string;
  };
  orderStats: {
    new: number;
    processing: number;
    ready: number;
    completed: number;
    cancelled: number;
    lastWeek: number;
    lastMonth: number;
  };
  customerStats: {
    total: number;
    active30Days: number;
    active7Days: number;
    repeatCustomers: number;
    repeatRate: number;
  };
  performance: {
    urgentOrders: number;
    walkinOrders: number;
    digitalOrders: number;
    avgCompletionTime: number;
    completionRate: number;
  };
  growth: {
    monthlyOrderGrowth: number;
    trending: 'up' | 'down' | 'stable';
  };
  repeatCustomers: Array<{
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    order_count: number;
    total_spent: number;
    last_order_date: string;
    loyaltyLevel: 'VIP' | 'Regular' | 'New';
  }>;
}

export default function RedesignedShopOwnerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  // 🔧 FIX: Remove global delete state - will use per-order in render
  // const deleteOrderMutation = useDeleteOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUnifiedChat, setShowUnifiedChat] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomerInsights, setShowCustomerInsights] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Multiple order selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  // 🚫 SEO EXCLUSION: Shop dashboard is private
  useEffect(() => {
    removeAllSEOMeta();
    setNoIndexMeta();
    document.title = 'Shop Dashboard - PrintEasy QR';
    
    return () => {
      // Cleanup on unmount
      const noIndexMeta = document.querySelector('meta[name="robots"]');
      if (noIndexMeta) noIndexMeta.remove();
    };
  }, []);

  // ✅ PROPERLY ENABLED: With correct authentication guards
  const { data: shopData, isLoading: shopLoading } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner' && !authLoading),
    refetchInterval: 60000, // 1 minute refresh
    refetchIntervalInBackground: false,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: 2,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
    enabled: Boolean(shopData?.shop?.id && user?.id && user?.role === 'shop_owner' && !authLoading),
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false,
    staleTime: 15000, // 15 seconds
    gcTime: 60000, // 1 minute
    retry: 2,
  });

  // Business Analytics Query - Real data for unique customers
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/analytics/business/${shopData?.shop?.id}`],
    queryFn: async () => {
      if (!shopData?.shop?.id) return null;
      
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/analytics/business/${shopData.shop.id}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Business analytics failed: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: Boolean(shopData?.shop?.id && user?.id && user?.role === 'shop_owner' && !authLoading),
    retry: 2,
    staleTime: 300000, // 5 minutes for analytics
  });

  // Calculate order statistics efficiently with real insights
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate real average processing time
  const calculateAvgProcessingTime = () => {
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'ready');
    if (completedOrders.length === 0) return 'N/A';
    
    let totalMinutes = 0;
    let validOrders = 0;
    
    completedOrders.forEach(order => {
      const startTime = new Date(order.createdAt).getTime();
      const endTime = new Date(order.updatedAt).getTime();
      const diffMinutes = (endTime - startTime) / (1000 * 60);
      
      // Only count reasonable processing times (less than 24 hours)
      if (diffMinutes > 0 && diffMinutes < 1440) {
        totalMinutes += diffMinutes;
        validOrders++;
      }
    });
    
    if (validOrders === 0) return 'N/A';
    
    const avgMinutes = Math.round(totalMinutes / validOrders);
    if (avgMinutes < 60) return `${avgMinutes} min`;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hrs`;
  };

  const dashboardStats: DashboardStats = {
    totalOrdersToday: orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    pendingOrders: (statusCounts.new || 0) + (statusCounts.pending || 0) + (statusCounts.processing || 0),
    completedToday: orders.filter(o => 
      o.status === 'completed' && 
      new Date(o.updatedAt).toDateString() === new Date().toDateString()
    ).length,
    avgProcessingTime: calculateAvgProcessingTime()
  };

  // Filter orders with improved performance - exclude completed and deleted orders
  const filteredOrders = orders.filter(order => {
    // Exclude completed orders (they go to Order History)
    if (order.status === 'completed') return false;
    
    // Exclude soft-deleted orders (should already be filtered on server, but double-check)
    if (order.deletedAt) return false;
    
    const matchesSearch = searchQuery === '' || 
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Separate orders by type for better organization
  const uploadOrders = filteredOrders.filter(order => order.type === 'upload' || order.type === 'file_upload');
  const walkinOrders = filteredOrders.filter(order => order.type === 'walkin');

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      // Get JWT token for authentication
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Add JWT token
        },
        credentials: 'include',
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
      
      // Optimistically update to the new value for ALL statuses (including completed)
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
        description: `Queue #${orderId} status changed to ${status}` 
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
    onSuccess: () => {
      // On success, don't invalidate immediately - let the optimistic update stand
      // Data will be refreshed on next natural refresh cycle
    },
    onSettled: (data, error) => {
      // Only invalidate queries on error to fix inconsistent state
      if (error) {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${shopData?.shop?.id}`] });
      }
    },
  });

  const toggleShopStatus = useMutation({
    mutationFn: async () => {
      if (!shopData?.shop?.id) {
        throw new Error('Shop ID not found');
      }
      
      // Get JWT token for authentication
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/shops/${shopData.shop.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Add JWT token
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update shop status');
      return response.json();
    },
    onSuccess: (updatedShop) => {
      queryClient.invalidateQueries({ queryKey: [`/api/shops/owner/${user?.id}`] });
      
      // Use the NEW status from the response, not the old cached status
      const newStatus = updatedShop?.isOnline;
      toast({ 
        title: newStatus ? 'Shop Opened' : 'Shop Closed',
        description: newStatus ? 'You are now accepting orders' : 'You are no longer accepting orders'
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
          }, order.status);
        }
      } catch (error: any) {
        console.error('Error printing files:', error);
        toast({ 
          title: 'Cannot print files', 
          description: error.message || 'Files may no longer be available',
          variant: 'destructive' 
        });
      }
    }
  };

  const handleDownloadAll = (order: Order) => {
    if (order.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        
        downloadAllFiles(files, (current, total) => {
          if (current === total) {
            toast({
              title: "Downloads Complete",
              description: `${files.length} files downloaded successfully`
            });
          }
        }, order.status);
      } catch (error: any) {
        console.error('Error downloading files:', error);
        toast({
          title: "Cannot download files",
          description: error.message || 'Files may no longer be available',
          variant: "destructive"
        });
      }
    }
  };

  // Handle bulk operations for multiple orders
  const handleBulkPrint = async () => {
    if (selectedOrders.size === 0) {
      toast({ title: 'No orders selected', variant: 'destructive' });
      return;
    }

    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
    let totalFiles = 0;
    let processedFiles = 0;

    for (const order of selectedOrdersList) {
      if (order.files) {
        try {
          const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
          totalFiles += files.length;
        } catch (e) {
          console.error('Error parsing files for order', order.id);
        }
      }
    }

    toast({ title: `Preparing ${totalFiles} files from ${selectedOrders.size} orders for printing...` });

    for (const order of selectedOrdersList) {
      if (order.files) {
        try {
          const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
          await printAllFiles(files, (current, total) => {
            processedFiles++;
            if (processedFiles === totalFiles) {
              toast({ title: `All ${totalFiles} files from ${selectedOrders.size} orders sent to print` });
              setSelectedOrders(new Set());
              setIsBulkMode(false);
            }
          }, order.status);
        } catch (error: any) {
          console.error('Error printing files for order', order.id, error);
        }
      }
    }
  };

  const handleBulkDownload = () => {
    if (selectedOrders.size === 0) {
      toast({ title: 'No orders selected', variant: 'destructive' });
      return;
    }

    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
    let totalFiles = 0;

    for (const order of selectedOrdersList) {
      if (order.files) {
        try {
          const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
          totalFiles += files.length;
          downloadAllFiles(files, (current, total) => {
            // Progress callback
          }, order.status);
        } catch (error: any) {
          console.error('Error downloading files for order', order.id, error);
        }
      }
    }

    toast({ 
      title: `Downloading ${totalFiles} files`, 
      description: `From ${selectedOrders.size} orders` 
    });
    setSelectedOrders(new Set());
    setIsBulkMode(false);
  };

  const toggleOrderSelection = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-brand-yellow/20 text-rich-black border-brand-yellow/40';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-brand-yellow/40 text-rich-black border-brand-yellow/60';
      case 'ready': return 'bg-brand-yellow/60 text-rich-black border-brand-yellow/80';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle }: any) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
            <p className="text-base sm:text-lg lg:text-2xl font-bold text-rich-black">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 truncate hidden sm:block">{subtitle}</p>}
          </div>
          <div className="p-1.5 sm:p-2 bg-brand-yellow/20 rounded-lg self-end sm:self-auto sm:ml-2">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => {
    // 🔧 FIX: Per-order delete mutation to prevent global state
    const deleteOrderMutation = useDeleteOrder(order.id);
    
    // Check if files are still uploading
    const hasUploadingFiles = order.files && Array.isArray(order.files) && 
      order.files.some((file: any) => file.status === 'uploading');
    
    return (
    <Card 
      className={`transition-shadow hover:shadow-md border-l-4 border-l-brand-yellow relative ${
        hasUploadingFiles ? 'cursor-wait opacity-75' : 'cursor-pointer'
      }`}
      onClick={(e) => {
        // Don't open details if clicking checkbox or files are uploading
        if ((e.target as HTMLElement).closest('.order-checkbox')) return;
        if (hasUploadingFiles) {
          toast({ 
            title: 'Files uploading...', 
            description: 'Please wait for files to finish uploading before viewing details.',
            variant: 'default'
          });
          return;
        }
        setSelectedOrderForDetails(order);
      }}
    >
      <CardContent className="p-4">
        {/* Bulk Mode Checkbox */}
        {isBulkMode && (
          <div 
            className="order-checkbox absolute top-4 left-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={() => toggleOrderSelection(order.id)}
            >
              {selectedOrders.has(order.id) ? (
                <CheckSquare className="w-5 h-5 text-brand-yellow" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </Button>
          </div>
        )}
        
        {/* Order Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex items-center space-x-3 ${isBulkMode ? 'ml-8' : ''}`}>
            <div className="w-10 h-10 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-rich-black">Queue #{order.orderNumber}</span>
            </div>
            <div>
              <h3 className="font-semibold text-rich-black">{order.customerName || (order as any).customer?.name}</h3>
              <div className="text-xs text-gray-600 flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                {(order as any).customer?.phone || 'No phone'}
              </div>
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
          {/* Only show file info for upload orders, not walk-in orders */}
          {order.type === 'upload' && (
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {(() => {
                  // Check if files are still uploading
                  const hasUploadingFiles = order.files && Array.isArray(order.files) && 
                    order.files.some((file: any) => file.status === 'uploading');
                  
                  if (hasUploadingFiles) {
                    const uploadingCount = order.files.filter((file: any) => file.status === 'uploading').length;
                    return (
                      <span className="flex items-center text-orange-600">
                        <div className="animate-spin rounded-full h-3 w-3 border border-orange-600 border-t-transparent mr-1"></div>
                        Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...
                      </span>
                    );
                  }
                  
                  if (!order.files || (Array.isArray(order.files) && order.files.length === 0)) {
                    return 'No files';
                  }
                  
                  if (Array.isArray(order.files)) {
                    const completedFiles = order.files.filter((file: any) => file.status !== 'uploading');
                    return completedFiles.length > 0 
                      ? `${completedFiles.length} file${completedFiles.length > 1 ? 's' : ''}` 
                      : 'Preparing files...';
                  }
                  
                  if (typeof order.files === 'string' && order.files !== '[]') {
                    try {
                      const parsed = JSON.parse(order.files);
                      return `${parsed.length || 0} files`;
                    } catch {
                      return 'Files processing...';
                    }
                  }
                  
                  return 'No files';
                })()}
              </span>
            </div>
          )}
          
          {/* Walk-in order info */}
          {order.type === 'walkin' && (
            <div className="flex items-center text-sm text-gray-600">
              <Timer className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                Walk-in Order: {order.description || 'Custom printing job'}
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
        <div className="grid grid-cols-3 gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
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
          <div className="grid grid-cols-2 gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={hasUploadingFiles}
                >
                  <Printer className="w-3 h-3 mr-1" />
                  {hasUploadingFiles ? 'Uploading...' : 'Print All'}
                  {!hasUploadingFiles && <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => handlePrintAll(order)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Quick Print (Default)
                </DropdownMenuItem>
                {isPlatformSupported() && (
                  <DropdownMenuItem onClick={async () => {
                    await launchPrintEasyConnect(order.id.toString(), () => {
                      toast({
                        title: "PrintEasy Connect Not Installed",
                        description: "Download the desktop app for enhanced printing features",
                        action: (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://printeasyqr.com/download', '_blank')}
                          >
                            Download
                          </Button>
                        )
                      });
                    });
                  }}>
                    <Monitor className="w-4 h-4 mr-2" />
                    PrintEasy Connect
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadAll(order)}
              className="text-xs"
              disabled={hasUploadingFiles}
            >
              <Download className="w-3 h-3 mr-1" />
              {hasUploadingFiles ? 'Uploading...' : 'Download All'}
            </Button>
          </div>
        )}

        {/* Status Update Actions */}
        {order.status !== 'completed' && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {(order.status === 'new' || order.status === 'pending') && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'processing' })}
                className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Start Processing
              </Button>
            )}
            {order.status === 'processing' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'ready' })}
                className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'completed' })}
                className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 text-xs"
              >
                Complete Order
              </Button>
            )}
            
            {/* Delete Button - Only for shop owners after processing */}
            {canDeleteOrder(order, 'shop_owner', user?.id || 0).canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
                    deleteOrderMutation.mutate(order.id);
                  }
                }}
                disabled={deleteOrderMutation.isPending}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
              >
                {deleteOrderMutation.isPending ? 'Deleting...' : 'Delete Order'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    );
  };

  if (shopLoading || ordersLoading) {
    return (
      <DashboardLoading 
        title="Loading Dashboard..." 
        subtitle="Fetching orders, chat messages, and shop data"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Responsive Header */}
      <div className="bg-white shadow-sm border-b relative">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Title Section - Always Visible */}
            <div className="flex items-center flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-rich-black truncate">
                {shopData?.shop?.name || 'Shop Dashboard'}
              </h1>
            </div>
            
            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalytics(true)}
                  className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                  {analyticsLoading && <div className="ml-2 w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRModal(true)}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/shop-order-history')}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/shop-settings')}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>

              {/* Shop Status Toggle - Desktop */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    if (shopData?.shop?.id) {
                      toggleShopStatus.mutate();
                    }
                  }}
                  disabled={toggleShopStatus.isPending}
                  className={`
                    flex items-center px-3 py-2 rounded-md font-semibold text-sm transition-all duration-200
                    ${shopData?.shop?.unifiedStatus?.isOpen 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                    }
                    ${toggleShopStatus.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={`Manual Override: ${shopData?.shop?.isOnline ? 'Shop is manually opened' : 'Shop is manually closed'} - Click to toggle`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${(() => {
                    if (!shopData?.shop) return 'bg-red-500';
                    const status = calculateUnifiedShopStatus(shopData.shop);
                    return status.isOpen ? 'bg-green-600' : 'bg-red-500';
                  })()}`}></div>
                  {(() => {
                    if (!shopData?.shop) return 'CLOSED';
                    const status = calculateUnifiedShopStatus(shopData.shop);
                    return status.statusText;
                  })()}
                </button>
              </div>

              {/* Logout Button */}
              <button 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    await fetch('/api/auth/logout', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  } catch (error) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }
                }}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile Actions - Compact Layout */}
            <div className="flex lg:hidden items-center space-x-2">
              {/* Shop Status - Mobile Compact */}
              <button
                onClick={() => {
                  if (shopData?.shop?.id) {
                    toggleShopStatus.mutate();
                  }
                }}
                disabled={toggleShopStatus.isPending}
                className={`
                  flex items-center px-2 py-1.5 rounded-md font-semibold text-xs transition-all duration-200
                  ${(() => {
                    if (!shopData?.shop) return 'bg-red-500 text-white';
                    const status = calculateUnifiedShopStatus(shopData.shop);
                    return status.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
                  })()}
                  ${toggleShopStatus.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${(() => {
                  if (!shopData?.shop) return 'bg-red-500';
                  const status = calculateUnifiedShopStatus(shopData.shop);
                  return status.isOpen ? 'bg-green-600' : 'bg-red-500';
                })()}`}></div>
                {(() => {
                  if (!shopData?.shop) return 'CLOSED';
                  const status = calculateUnifiedShopStatus(shopData.shop);
                  return status.statusText;
                })()}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {showMobileMenu && (
            <div className="lg:hidden mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAnalytics(true);
                    setShowMobileMenu(false);
                  }}
                  className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black text-xs"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQRModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00] text-xs"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/shop-order-history');
                    setShowMobileMenu(false);
                  }}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00] text-xs"
                >
                  <History className="w-4 h-4 mr-1" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/shop-settings');
                    setShowMobileMenu(false);
                  }}
                  className="border-gray-300 hover:border-[#FFBF00] hover:text-[#FFBF00] text-xs"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
              
              {/* Mobile Logout */}
              <button 
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    await fetch('/api/auth/logout', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  } catch (error) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content - Mobile Responsive */}
      <div className="p-3 sm:p-6">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
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



        {/* Business Analytics Modal */}
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#FFBF00]" />
                Business Analytics
              </DialogTitle>
              <DialogDescription>
                Customer insights and business metrics for your shop
              </DialogDescription>
            </DialogHeader>
            
            {analyticsLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4">Loading business insights...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Key Customer Metrics - No Revenue */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Customers First Shop</p>
                        <p className="text-2xl font-bold text-black">{analytics?.uniqueCustomersFirstShop || 0}</p>
                        <p className="text-xs text-gray-500">Their first shop was yours</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-[#FFBF00]" />
                    </div>
                  </div>
                  
                  <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Total Unlocked</p>
                        <p className="text-2xl font-bold text-black">{analytics?.totalCustomersUnlocked || 0}</p>
                        <p className="text-xs text-gray-500">Total users who unlocked</p>
                      </div>
                      <Users className="w-8 h-8 text-[#FFBF00]" />
                    </div>
                  </div>
                  
                  <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Conversion Rate</p>
                        <p className="text-2xl font-bold text-black">{analytics?.conversionRate || 0}%</p>
                        <p className="text-xs text-gray-500">First shop → orders</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-[#FFBF00]" />
                    </div>
                  </div>
                </div>

                
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Analytics Data</p>
                <p className="text-sm">Start receiving orders to see business insights</p>
              </div>
            )}
          </DialogContent>
        </Dialog>



        {/* Search and Filters - Mobile Responsive */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Input and Bulk Mode Toggle */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Button
                  variant={isBulkMode ? "default" : "outline"}
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setSelectedOrders(new Set());
                  }}
                  className={isBulkMode ? "bg-brand-yellow text-rich-black hover:bg-brand-yellow/90" : ""}
                >
                  {isBulkMode ? <X className="w-4 h-4 mr-1" /> : <CheckSquare className="w-4 h-4 mr-1" />}
                  {isBulkMode ? "Cancel" : "Select"}
                </Button>
              </div>
              
              {/* Bulk Actions Bar */}
              {isBulkMode && selectedOrders.size > 0 && (
                <div className="flex items-center justify-between bg-brand-yellow/10 p-2 rounded-lg border border-brand-yellow/20">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllOrders}
                      className="text-xs"
                    >
                      {selectedOrders.size === filteredOrders.length ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                    <span className="text-sm font-medium text-rich-black">
                      {selectedOrders.size} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print All
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleBulkPrint}>
                          <Printer className="w-4 h-4 mr-2" />
                          Quick Print (Default)
                        </DropdownMenuItem>
                        {isPlatformSupported() && (
                          <DropdownMenuItem onClick={async () => {
                            const orderIds = Array.from(selectedOrders);
                            await launchPrintEasyConnect(orderIds, () => {
                              toast({
                                title: "PrintEasy Connect Not Installed",
                                description: "Download the desktop app for batch printing",
                                action: (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open('https://printeasyqr.com/download', '_blank')}
                                  >
                                    Download
                                  </Button>
                                )
                              });
                            });
                          }}>
                            <Monitor className="w-4 h-4 mr-2" />
                            PrintEasy Connect
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      onClick={handleBulkDownload}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download All
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Status Filters - Mobile Grid */}
              <div className="grid grid-cols-2 sm:flex gap-2">
                {['all', 'new', 'processing', 'ready'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedStatus === status ? "default" : "outline"}
                    onClick={() => setSelectedStatus(status)}
                    className={`text-xs sm:text-sm ${selectedStatus === status ? 'bg-brand-yellow text-rich-black' : ''}`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First Orders Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* File Upload Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/20">
              <div className="flex items-center flex-1 min-w-0">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-brand-yellow flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-lg font-bold text-rich-black truncate">File Upload Orders</h2>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Digital file printing orders</p>
                </div>
              </div>
              {uploadOrders.length > 0 && (
                <Badge className="bg-brand-yellow text-rich-black font-semibold px-2 py-1 text-xs sm:text-sm">
                  {uploadOrders.length}
                </Badge>
              )}
            </div>
            
            {/* Orders Grid - Mobile: 1 column, Desktop: 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              {uploadOrders.length === 0 ? (
                <div className="xl:col-span-2">
                  <Card className="border-dashed border-2 border-brand-yellow/30">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-brand-yellow/50 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm sm:text-base text-gray-500 font-medium">No upload orders yet</p>
                      <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">File upload orders will appear here</p>
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

          {/* Walk-in Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-brand-yellow/10 rounded-lg border border-brand-yellow/20">
              <div className="flex items-center flex-1 min-w-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-brand-yellow flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-lg font-bold text-rich-black truncate">Walk-in Orders</h2>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Immediate pickup orders</p>
                </div>
              </div>
              {walkinOrders.length > 0 && (
                <Badge className="bg-brand-yellow text-rich-black font-semibold px-2 py-1 text-xs sm:text-sm">
                  {walkinOrders.length}
                </Badge>
              )}
            </div>
            
            {/* Orders Grid - Mobile: 1 column, Desktop: 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
              {walkinOrders.length === 0 ? (
                <div className="xl:col-span-2">
                  <Card className="border-dashed border-2 border-brand-yellow/30">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Users className="w-8 h-8 sm:w-12 sm:h-12 text-brand-yellow/50 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm sm:text-base text-gray-500 font-medium">No walk-in orders yet</p>
                      <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Walk-in orders will appear here</p>
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
        <ProfessionalQRModal
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