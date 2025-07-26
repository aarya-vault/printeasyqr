import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Search,
  Package,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

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
  completedAt?: string;
}

export default function ShopOrderHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // First get shop data
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}/history`],
    enabled: !!shopData?.shop?.id,
  });

  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(search) ||
      order.title?.toLowerCase().includes(search) ||
      order.description?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/shop-dashboard">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-rich-black">Order History</h1>
            </div>
            <Badge variant="secondary" className="bg-brand-yellow/20 text-rich-black">
              {filteredOrders.length} Completed Orders
            </Badge>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by customer name, order title, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms' : 'No completed orders yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-lg text-rich-black">#{order.id}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.type === 'upload' ? 'File Upload' : 'Walk-in Order'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="line-clamp-1">{order.title}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created: {format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {order.completedAt && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Completed: {format(new Date(order.completedAt), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {order.type === 'upload' && order.files && order.files.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintAll(order)}
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Print All ({order.files.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadAll(order)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download All
                      </Button>
                    </div>
                  )}

                  {/* View Details */}
                  <Link href={`/shop-dashboard/orders/${order.id}`}>
                    <Button className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}