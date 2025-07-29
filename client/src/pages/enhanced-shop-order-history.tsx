import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, Search, Filter, Download, Calendar,
  FileText, Users, Clock, CheckCircle2, Package
} from 'lucide-react';
import { format } from 'date-fns';
import OrderDetailsModal from '@/components/order-details-modal';
import UnifiedChatSystem from '@/components/unified-chat-system';

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
  isUrgent: boolean;
}

export default function EnhancedShopOrderHistory() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);

  // Fetch shop data
  const { data: shopData } = useQuery<{ shop: any }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
  });

  // Fetch order history
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}/history`],
    enabled: !!shopData?.shop?.id,
  });

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = (
      order.customerName?.toLowerCase().includes(search) ||
      order.title?.toLowerCase().includes(search) ||
      order.description?.toLowerCase().includes(search) ||
      order.id.toString().includes(search) ||
      order.customerPhone.includes(search)
    );

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black border-brand-yellow';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Package className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3" />;
      case 'ready': return <CheckCircle2 className="w-3 h-3" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Phone', 'Type', 'Title', 'Status', 'Date', 'Urgent'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.customerName,
        order.customerPhone,
        order.type,
        `"${order.title}"`,
        order.status,
        format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
        order.isUrgent ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shop-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/shop-dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Order History</h1>
                <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
              </div>
            </div>
            <Button onClick={exportData} variant="outline" className="border-brand-yellow text-rich-black hover:bg-brand-yellow/10">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-brand-yellow" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by customer, order ID, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="upload">Upload Orders</SelectItem>
                  <SelectItem value="walkin">Walk-in Orders</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Orders Found</h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Order history will appear here once you start receiving orders'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-bold text-rich-black">#{order.id}</span>
                        <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        {order.isUrgent && (
                          <Badge variant="destructive" className="bg-red-500 text-white">
                            Urgent
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {order.type === 'upload' ? <FileText className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                          {order.type === 'upload' ? 'Upload' : 'Walk-in'}
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium text-rich-black mb-1">{order.customerName}</h3>
                      <p className="text-sm text-gray-600 mb-2 truncate" title={order.title}>{order.title}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{order.customerPhone}</span>
                        <span>•</span>
                        <span>{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        {order.type === 'upload' && order.files && (
                          <>
                            <span>•</span>
                            <span>{Array.isArray(order.files) ? order.files.length : 0} files</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrderForChat(order.id)}
                      >
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {selectedOrderForChat && (
        <UnifiedChatSystem
          isOpen={!!selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
          initialOrderId={selectedOrderForChat}
          userRole="shop_owner"
        />
      )}
    </div>
  );
}