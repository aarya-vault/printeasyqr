import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ComprehensiveReportModal } from '@/components/ui/comprehensive-report-modal';
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
  Printer,
  FileText,
  BarChart3
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
  notes?: string;
  finalAmount?: number;
  estimatedPages?: number;
  estimatedBudget?: number;
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
  customer?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  printJobs?: {
    totalRequests: number;
    successfulPrints: number;
  };
  totalMessages?: number;
  processingTime?: number;
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
  const [showReportModal, setShowReportModal] = useState(false);

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
    let totalPages = 0;
    let fileDetails: any[] = [];
    
    if (hasFiles) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        if (Array.isArray(files)) {
          fileCount = files.length;
          fileDetails = files;
          // Calculate estimated pages
          totalPages = files.reduce((sum, file) => {
            if (file.mimetype === 'application/pdf' && file.size) {
              return sum + Math.max(1, Math.ceil(file.size / 51200)); // ~50KB per page
            } else if (file.mimetype?.startsWith('image/')) {
              return sum + 1; // 1 page per image
            } else if (file.size) {
              return sum + Math.max(1, Math.ceil(file.size / 2048)); // ~2KB per page for docs
            }
            return sum + 1;
          }, 0);
        }
      } catch (error) {
        fileCount = 0;
        totalPages = 0;
      }
    }

    // Use estimated pages from order if available, otherwise use calculated
    const displayPages = order.estimatedPages || totalPages;

    const hasConversation = chatHistory.length > 0 || order.type === 'upload';

    const isDeleted = !!(order.deletedAt);
    const borderColor = isDeleted ? 'border-l-red-400' : 'border-l-green-400';
    const cardBg = isDeleted ? 'bg-red-50/30' : 'bg-white';

    // Calculate processing time
    const processingHours = order.completedAt && order.createdAt ? 
      Math.round((new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)) : 
      order.processingTime || null;

    const formatFileSize = (bytes: number) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
      <Card className={`transition-shadow hover:shadow-md border-l-4 ${borderColor} ${cardBg}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Order Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${isDeleted ? 'text-gray-600 line-through' : 'text-gray-900'}`}>{order.title}</h3>
                  <Badge className="bg-brand-yellow text-rich-black font-semibold">
                    Queue #{order.orderNumber}
                  </Badge>
                  {!isDeleted && (
                    <>
                      <Badge className="bg-gray-100 text-gray-800">
                        {order.publicId || `ORD-${order.id}`}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {order.type === 'upload' ? 'Upload' : 'Walk-in'}
                      </Badge>
                      {processingHours && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Clock className="w-3 h-3 mr-1" />
                          {processingHours}h
                        </Badge>
                      )}
                    </>
                  )}
                  {isDeleted && (
                    <Badge variant="destructive" className="text-xs font-medium">
                      🗑️ Deleted
                    </Badge>
                  )}
                </div>

                {/* Customer Information */}
                <div className="flex items-center text-sm text-gray-600 flex-wrap gap-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {order.customer?.name || order.customerName}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {order.customer?.phone || order.customerPhone}
                  </div>
                  {order.customer?.email && (
                    <div className="flex items-center text-xs">
                      📧 {order.customer.email}
                    </div>
                  )}
                </div>

                {isDeleted && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <span className="font-medium">Deleted by:</span> {order.deletedByUser?.name || 'Unknown'}
                    <span className="text-xs text-gray-500 ml-2">
                      on {format(new Date(order.deletedAt!), 'MMM dd, yyyy')}
                    </span>
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Customer contact & chat history still accessible
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-right text-sm text-gray-500 ml-4">
                {!isDeleted && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-end">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                      Completed
                    </div>
                    <div className="flex items-center justify-end">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(order.completedAt || order.updatedAt), 'MMM dd, yyyy')}
                    </div>
                    {order.finalAmount && (
                      <div className="font-semibold text-green-600">
                        ₹{order.finalAmount}
                      </div>
                    )}
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

            {/* Comprehensive Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {/* File Information */}
              {hasFiles && fileCount > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center text-blue-700 mb-1">
                    <Package className="w-4 h-4 mr-1" />
                    <span className="font-medium">Files</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>{fileCount} file{fileCount !== 1 ? 's' : ''}</div>
                    {displayPages > 0 && (
                      <div className="flex items-center">
                        <span>📄 ~{displayPages} pages</span>
                      </div>
                    )}
                    {fileDetails.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {fileDetails.slice(0, 2).map((file, idx) => (
                          <div key={idx}>
                            • {file.originalName || file.filename} ({formatFileSize(file.size || 0)})
                          </div>
                        ))}
                        {fileDetails.length > 2 && (
                          <div>• ... and {fileDetails.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Print Job Tracking */}
              {order.printJobs && order.printJobs.totalRequests > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center text-green-700 mb-1">
                    <Printer className="w-4 h-4 mr-1" />
                    <span className="font-medium">Print Jobs</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>{order.printJobs.totalRequests} print request{order.printJobs.totalRequests !== 1 ? 's' : ''}</div>
                    <div className="text-green-600">{order.printJobs.successfulPrints} successful</div>
                  </div>
                </div>
              )}

              {/* Communication */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center text-purple-700 mb-1">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="font-medium">Communication</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div>{order.totalMessages || 0} messages</div>
                  <div className="text-green-600">Always accessible</div>
                </div>
              </div>

              {/* Financial Information */}
              {(order.estimatedBudget || order.finalAmount) && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center text-yellow-700 mb-1">
                    <span className="text-sm">💰</span>
                    <span className="font-medium ml-1">Financials</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {order.estimatedBudget && (
                      <div>Est: ₹{order.estimatedBudget}</div>
                    )}
                    {order.finalAmount && (
                      <div className="font-semibold">Final: ₹{order.finalAmount}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Time */}
              {processingHours && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium">Processing</span>
                  </div>
                  <div className="text-xs">
                    {processingHours} hour{processingHours !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                <div className="flex items-center text-amber-700 mb-1">
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="font-medium text-sm">Shop Notes</span>
                </div>
                <p className="text-sm text-amber-900">{order.notes}</p>
              </div>
            )}

            {/* Actions */}
            {!isDeleted && (
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
            )}
            {/* Enhanced Actions for Deleted Orders */}
            {isDeleted && (
              <div className="pt-2 border-t border-red-200">
                <div className="text-xs text-gray-500 italic mb-2">
                  This order was deleted and is no longer available for processing.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewChatHistory(order)}
                    className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    View Chat
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${order.customer?.phone || order.customerPhone}`)}
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call Customer
                  </Button>
                </div>
              </div>
            )}
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
            <div className="flex items-center justify-between w-full">
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
              
              {/* Report Generation Button */}
              <Button 
                onClick={() => setShowReportModal(true)}
                className="bg-[#FFBF00] text-black hover:bg-[#E6AC00] font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
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
      
      {/* Comprehensive Report Modal */}
      {showReportModal && shopData?.shop && (
        <ComprehensiveReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          shopId={shopData.shop.id}
        />
      )}
    </div>
  );
}