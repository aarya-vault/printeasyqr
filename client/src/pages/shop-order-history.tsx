import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Package, 
  User, 
  MessageSquare,
  Clock,
  CheckCircle2,
  History,
  Phone,
  Download,
  Printer
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { setNoIndexMeta, removeAllSEOMeta } from '@/utils/seo-utils';

interface Order {
  id: number;
  orderNumber: number;
  publicId?: string;
  customerId: number;
  shopId: number;
  customerName: string;
  customerPhone: string;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files: any;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string;
  deletedBy?: number;
  deletedByUser?: {
    id: number;
    name: string;
    role: string;
  };
}

interface Message {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  content: string;
  files?: string;
  createdAt: string;
  isRead: boolean;
}

export default function ShopOrderHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // 🚫 SEO EXCLUSION: Shop order history is private
  useEffect(() => {
    removeAllSEOMeta();
    setNoIndexMeta();
    document.title = 'Order History - Shop Dashboard - PrintEasy QR';
    
    return () => {
      // Cleanup on unmount
      const noIndexMeta = document.querySelector('meta[name="robots"]');
      if (noIndexMeta) noIndexMeta.remove();
    };
  }, []);

  // ✅ PROPERLY ENABLED: With correct authentication guards
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner'),
    staleTime: 300000,
    retry: 2,
  });

  // Fetch completed and deleted orders
  const { data: completedOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/shop/${shopData?.shop?.id}/history`],
    enabled: Boolean(shopData?.shop?.id && user?.role === 'shop_owner' && !authLoading),
    staleTime: 30000, // 30 seconds cache since completed orders don't change often
  });

  // Fetch chat history for selected order
  const { data: chatHistory = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrder?.id}`],
    enabled: !!selectedOrder?.id && showChatModal,
  });

  // Filter orders based on search
  const filteredOrders = completedOrders.filter(order => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(search) ||
      order.customerName?.toLowerCase().includes(search) ||
      order.customerPhone?.includes(search) ||
      order.orderNumber?.toString().includes(search) ||
      order.publicId?.toLowerCase().includes(search)
    );
  });

  const handleViewChatHistory = (order: Order) => {
    setSelectedOrder(order);
    setShowChatModal(true);
  };

  const handleDownloadFiles = (order: Order) => {
    if (order.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        let downloadCount = 0;
        
        files.forEach((file: any, index: number) => {
          setTimeout(() => {
            const fileUrl = file.path ? `/objects/.private/${file.path}` : `/objects/.private/uploads/${file.filename || file}`;
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
        toast({
          title: "Download Error",
          description: "Failed to download files",
          variant: "destructive"
        });
      }
    }
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const hasFiles = order.files && order.files !== 'null' && order.files !== '';
    let fileCount = 0;
    
    if (hasFiles) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        fileCount = Array.isArray(files) ? files.length : 0;
      } catch (error) {
        fileCount = 0;
      }
    }

    const hasConversation = chatHistory.length > 0 || order.type === 'upload';

    const isDeleted = !!(order.deletedAt);
    const borderColor = isDeleted ? 'border-l-red-400' : 'border-l-gray-300';
    const cardBg = isDeleted ? 'bg-red-50/30' : 'bg-white';
    
    return (
      <Card className={`transition-shadow hover:shadow-md border-l-4 ${borderColor} ${cardBg}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Order Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${isDeleted ? 'text-gray-600' : 'text-gray-900'}`}>{order.title}</h3>
                  <Badge className="bg-brand-yellow text-rich-black font-semibold">
                    Queue #{order.orderNumber}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-800">
                    {order.publicId || `ORD-${order.id}`}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-800">
                    {order.type === 'upload' ? 'Upload' : 'Walk-in'}
                  </Badge>
                  {isDeleted && (
                    <Badge variant="destructive" className="text-xs">
                      Deleted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  {order.customerName || (order as any).customer?.name}
                  <Phone className="w-4 h-4 ml-3 mr-1" />
                  {(order as any).customer?.phone || order.customerPhone}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {isDeleted ? (
                  <div>
                    <div className="flex items-center text-red-600">
                      <span className="w-4 h-4 mr-1">🗑️</span>
                      Deleted
                    </div>
                    {order.deletedByUser && (
                      <div className="text-xs text-red-500 mt-1">
                        by {order.deletedByUser.name}
                      </div>
                    )}
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(order.deletedAt!), 'MMM dd, yyyy')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                      Completed
                    </div>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(order.updatedAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {order.description && (
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {order.description}
              </p>
            )}

            {/* File Info */}
            {hasFiles && fileCount > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Package className="w-4 h-4 mr-1" />
                {fileCount} file{fileCount !== 1 ? 's' : ''} processed
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewChatHistory(order)}
                className="text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat History
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`tel:${order.customerPhone}`)}
                className="text-xs"
              >
                <Phone className="w-3 h-3 mr-1" />
                Call
              </Button>

              {hasFiles && fileCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadFiles(order)}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Files
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/shop-dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-rich-black flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Order History
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredOrders.length} completed order{filteredOrders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order ID, customer name, phone, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-medium text-gray-700 mb-1">
                {searchQuery ? 'No matching orders found' : 'No completed orders yet'}
              </h4>
              <p className="text-sm text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Completed orders will appear here once you finish processing them'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Chat History Modal */}
      {showChatModal && selectedOrder && (
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat History - Queue #{selectedOrder.orderNumber} ({selectedOrder.publicId || `ORD-${selectedOrder.id}`})
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Conversation with {selectedOrder.customerName}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4 border rounded-lg bg-gray-50">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No conversation history found</p>
                  <p className="text-sm text-gray-400">
                    This order was completed without any messages
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-brand-yellow text-rich-black'
                            : 'bg-white border'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1 opacity-75">
                          {message.senderName}
                        </div>
                        {message.content && (
                          <div className="text-sm">{message.content}</div>
                        )}
                        {message.files && !message.content && (
                          <div className="text-xs mt-1 opacity-75 italic">
                            [File attachment - not displayed in history]
                          </div>
                        )}
                        <div className="text-xs mt-1 opacity-50">
                          {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              This order is completed. No new messages can be sent.
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}