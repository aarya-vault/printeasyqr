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
  UserCheck,
  Star,
  TrendingUp,
  Activity,
  DollarSign,
  Bell,
  Grid3X3,
  BarChart3,
  PlusCircle,
  ShoppingCart,
  Zap,
  MapPin,
  Timer
} from 'lucide-react';
import { Power } from 'lucide-react';
import RedesignedShopQRModal from '@/components/redesigned-shop-qr-modal';
import ChatFloatingButton from '@/components/chat-floating-button';
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
  isUrgent?: boolean;
}

interface DashboardStats {
  totalOrdersToday: number;
  pendingOrders: number;
  completedToday: number;
  avgProcessingTime: string;
  customerSatisfaction: number;
  todayRevenue: number;
}

export default function BeautifulShopDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch shop data
  const { data: shopData } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
  });

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}`],
    enabled: !!shopData?.shop?.id,
  });

  // Filter orders by search and status
  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = (
      order.customerName?.toLowerCase().includes(search) ||
      order.title?.toLowerCase().includes(search) ||
      order.description?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const uploadOrders = filteredOrders.filter(order => order.type === 'upload');
  const walkinOrders = filteredOrders.filter(order => order.type === 'walkin');

  // Status counts
  const statusCounts = {
    new: orders.filter(o => o.status === 'new').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    urgent: orders.filter(o => o.isUrgent).length,
    total: orders.length,
  };

  // Dashboard stats (calculated from orders)
  const dashboardStats: DashboardStats = {
    totalOrdersToday: orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    pendingOrders: statusCounts.new + statusCounts.processing,
    completedToday: orders.filter(o => 
      o.status === 'completed' && 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    avgProcessingTime: '2.5 hrs',
    customerSatisfaction: 4.8,
    todayRevenue: 0, // Since no revenue tracking as per requirements
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${shopData?.shop?.id}`] });
      toast({ title: 'Order status updated successfully' });
    },
  });

  const toggleShopStatus = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shops/${shopData?.shop?.id}/toggle-status`, {
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
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black border-brand-yellow/40';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
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

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-rich-black">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md relative overflow-hidden">
      {order.isUrgent && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
      )}
      <CardContent className="p-5">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-brand-yellow/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-rich-black">#{order.id}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-rich-black">{order.customerName}</h3>
              <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={`${getStatusColor(order.status)} border font-medium px-3 py-1`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            {order.unreadMessages && order.unreadMessages > 0 && (
              <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                <MessageSquare className="w-3 h-3 mr-1" />
                {order.unreadMessages} new
              </Badge>
            )}
            {order.isUrgent && (
              <Badge variant="destructive" className="bg-red-500 text-white">
                <Zap className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2" />
            <span className="line-clamp-1">{order.title}</span>
          </div>
          {order.type === 'upload' && order.files && (
            <div className="flex items-center text-sm text-gray-600">
              <Upload className="w-4 h-4 mr-2" />
              <span>{Array.isArray(order.files) ? order.files.length : JSON.parse(order.files || '[]').length} files</span>
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
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `tel:${order.customerPhone}`}
            className="border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5"
          >
            <Phone className="w-3 h-3 mr-2" />
            Call
          </Button>
          <Link href={`/shop-dashboard/chat/${order.id}`}>
            <Button size="sm" variant="outline" className="w-full relative border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5">
              <MessageSquare className="w-3 h-3 mr-2" />
              Chat
              {order.unreadMessages && order.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </Button>
          </Link>
        </div>

        {/* File Actions for Upload Orders */}
        {order.type === 'upload' && order.files && order.files.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrintAll(order)}
              className="border-gray-200 hover:border-green-400 hover:bg-green-50"
            >
              <Printer className="w-3 h-3 mr-2" />
              Print All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadAll(order)}
              className="border-gray-200 hover:border-blue-400 hover:bg-blue-50"
            >
              <Download className="w-3 h-3 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* Status Update Button */}
        {order.status !== 'completed' && (
          <Button
            size="sm"
            className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium"
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
            disabled={updateOrderStatus.isPending}
          >
            {updateOrderStatus.isPending ? (
              <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {order.status === 'new' && '▶ Start Processing'}
            {order.status === 'processing' && '✓ Mark as Ready'}
            {order.status === 'ready' && '🎉 Complete Order'}
          </Button>
        )}

        {/* View Details */}
        <Link href={`/shop-dashboard/orders/${order.id}`}>
          <Button variant="ghost" size="sm" className="w-full mt-2 text-gray-600 hover:text-rich-black">
            <Eye className="w-3 h-3 mr-2" />
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  if (!shopData?.shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading your shop dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Beautiful Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-rich-black">
                  {shopData.shop.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">{shopData.shop.name}</h1>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Online
                  </Badge>
                  <span className="text-xs text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {shopData.shop.city}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={shopData.shop.isOnline ? "destructive" : "default"}
                onClick={() => toggleShopStatus.mutate()}
                className={shopData.shop.isOnline ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}
                disabled={toggleShopStatus.isPending}
              >
                <Power className="w-4 h-4 mr-2" />
                {toggleShopStatus.isPending ? "Updating..." : shopData.shop.isOnline ? "Stop Accepting Orders" : "Start Accepting Orders"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRModal(true)}
                className="border-brand-yellow text-rich-black hover:bg-brand-yellow/10"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Shop QR
              </Button>
              <Link href="/shop-order-history">
                <Button variant="outline" className="border-gray-200 hover:border-gray-300">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </Link>
              <Link href="/shop-notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {statusCounts.urgent > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {statusCounts.urgent}
                    </span>
                  )}
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Orders Today"
            value={dashboardStats.totalOrdersToday}
            icon={ShoppingCart}
            color="bg-rich-black"
            subtitle="New orders received"
          />
          <StatCard
            title="Pending Orders"
            value={dashboardStats.pendingOrders}
            icon={Clock}
            color="bg-brand-yellow"
            subtitle="Awaiting processing"
          />
          <StatCard
            title="Completed Today"
            value={dashboardStats.completedToday}
            icon={CheckCircle2}
            color="bg-rich-black"
            subtitle="Successfully delivered"
          />
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon={Package}
            color="bg-brand-yellow"
            subtitle="All time orders"
          />
        </div>



        {/* Search and Filter Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search orders by customer name, order ID, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-gray-200 focus:border-brand-yellow focus:ring-brand-yellow/20"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'new', 'processing', 'ready', 'completed'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedStatus === status ? "default" : "outline"}
                    onClick={() => setSelectedStatus(status)}
                    className={selectedStatus === status ? "bg-brand-yellow text-rich-black hover:bg-brand-yellow/90" : "border-gray-200 hover:border-brand-yellow"}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid - Beautiful 4-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Files - Columns 1 & 2 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-rich-black flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                Upload Orders
              </h2>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                {uploadOrders.length} orders
              </Badge>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {uploadOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {uploadOrders.length === 0 && (
                <div className="xl:col-span-2">
                  <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Upload Orders</h3>
                      <p className="text-gray-500">Upload orders will appear here when customers submit files</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Walk-in Orders - Columns 3 & 4 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-rich-black flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                Walk-in Orders
              </h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                {walkinOrders.length} orders
              </Badge>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {walkinOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
              {walkinOrders.length === 0 && (
                <div className="xl:col-span-2">
                  <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
                    <CardContent className="p-12 text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Walk-in Orders</h3>
                      <p className="text-gray-500">Walk-in orders will appear here when customers visit your shop</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty State for No Orders */}
        {filteredOrders.length === 0 && searchQuery && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No Orders Found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && shopData.shop && (
        <RedesignedShopQRModal
          shop={shopData.shop}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Chat Floating Button */}
      <ChatFloatingButton />
    </div>
  );
}