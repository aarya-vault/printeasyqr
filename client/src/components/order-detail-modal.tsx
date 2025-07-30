import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  X, Package, User, Phone, FileText, Calendar, Download, Printer, 
  MessageSquare, Clock, CheckCircle2, AlertCircle, Zap, Trash2, 
  ArrowUp, ArrowDown, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import UnifiedChatSystem from './unified-chat-system';

interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
}

interface OrderDetails {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  shopName: string;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files: string;
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
  unreadMessages?: number;
}

export default function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showChat, setShowChat] = useState(false);

  // Get order details
  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${order?.shopId}`] });
      toast({ title: 'Order status updated successfully' });
    },
  });

  // Toggle urgency
  const toggleUrgency = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/urgency`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUrgent: !order?.isUrgent }),
      });
      if (!response.ok) throw new Error('Failed to toggle urgency');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${order?.shopId}`] });
      toast({ 
        title: order?.isUrgent ? 'Urgency removed' : 'Marked as urgent',
        description: order?.isUrgent ? 'Order is no longer urgent' : 'Order marked as urgent priority'
      });
    },
  });

  // Delete order
  const deleteOrder = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${order?.shopId}`] });
      toast({ title: 'Order deleted successfully' });
      onClose();
    },
  });

  const handlePrintFile = (filename: string) => {
    const printWindow = window.open(`/api/files/${filename}`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadFile = (filename: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${filename}`;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAll = () => {
    if (order?.files) {
      try {
        const files = JSON.parse(order.files);
        files.forEach((file: any) => {
          setTimeout(() => {
            handlePrintFile(file.filename);
          }, 100);
        });
      } catch (error) {
        toast({ title: 'Error printing files', variant: 'destructive' });
      }
    }
  };

  const handleDownloadAll = () => {
    if (order?.files) {
      try {
        const files = JSON.parse(order.files);
        files.forEach((file: any, index: number) => {
          setTimeout(() => {
            handleDownloadFile(file.filename, file.originalName);
          }, index * 200);
        });
      } catch (error) {
        toast({ title: 'Error downloading files', variant: 'destructive' });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'processing';
      case 'processing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getPreviousStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'processing': return 'new';
      case 'ready': return 'processing';
      case 'completed': return 'ready';
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={onClose}>Close</Button>
        </Card>
      </div>
    );
  }

  let files = [];
  try {
    files = order.files ? JSON.parse(order.files) : [];
  } catch (error) {
    files = [];
  }

  if (showChat) {
    return <UnifiedChatSystem isOpen={true} onClose={() => setShowChat(false)} initialOrderId={orderId} userRole="shop_owner" />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-rich-black" />
              </div>
              <div>
                <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                <p className="text-gray-500">{order.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor(order.status)} border font-medium px-3 py-1`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
              {order.isUrgent && (
                <Badge variant="destructive" className="bg-red-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{order.customerPhone}</span>
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${order.customerPhone}`}>
                      Call
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <Button size="sm" variant="outline" onClick={() => setShowChat(true)} className="relative">
                      Chat
                      {order.unreadMessages && order.unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="capitalize">{order.type} Order</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {order.walkinTime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Walk-in: {format(new Date(order.walkinTime), 'HH:mm')}</span>
                    </div>
                  )}
                </div>
                {order.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">{order.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files and Actions */}
            <div className="space-y-4">
              {files.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Files ({files.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm truncate" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handlePrintFile(file.filename)}
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownloadFile(file.filename, file.originalName)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" onClick={handlePrintAll}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Order Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Actions</h3>
                <div className="space-y-2">
                  {/* Status Controls */}
                  <div className="flex space-x-2">
                    {getPreviousStatus(order.status) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateOrderStatus.mutate({ status: getPreviousStatus(order.status)! })}
                        disabled={updateOrderStatus.isPending}
                      >
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Reverse Status
                      </Button>
                    )}
                    {getNextStatus(order.status) && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus.mutate({ status: getNextStatus(order.status)! })}
                        disabled={updateOrderStatus.isPending}
                        className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                      >
                        <ArrowUp className="w-4 h-4 mr-2" />
                        {order.status === 'new' && 'Start Processing'}
                        {order.status === 'processing' && 'Mark Ready'}
                        {order.status === 'ready' && 'Complete Order'}
                      </Button>
                    )}
                  </div>

                  {/* Urgency Toggle */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleUrgency.mutate()}
                    disabled={toggleUrgency.isPending}
                    className={order.isUrgent ? "border-red-300 text-red-600" : ""}
                  >
                    {order.isUrgent ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Remove Urgency
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Mark Urgent
                      </>
                    )}
                  </Button>

                  {/* Delete Order */}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
                        deleteOrder.mutate();
                      }
                    }}
                    disabled={deleteOrder.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}