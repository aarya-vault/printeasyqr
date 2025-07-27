import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, FileText, Download, Printer, Phone, MessageCircle, 
  Calendar, Clock, CheckCircle2, Package, User
} from 'lucide-react';
import { format } from 'date-fns';
import ChatModal from '@/components/chat-modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { printFile, printAllFiles } from '@/utils/print-helpers';

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  status: string;
  files?: any;
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
  notes?: string;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  userRole: 'customer' | 'shop_owner';
}

export default function OrderDetailsModal({ order, onClose, userRole }: OrderDetailsModalProps) {
  const [showChat, setShowChat] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Order updated successfully' });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${order.shopId}`] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Failed to update order', variant: 'destructive' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveChanges = () => {
    updateOrderMutation.mutate({
      status: editedOrder.status,
      notes: editedOrder.notes
    });
  };

  const handlePrintAll = async () => {
    try {
      const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
      if (Array.isArray(files) && files.length > 0) {
        toast({ title: `Preparing ${files.length} files for printing...` });
        
        await printAllFiles(files, (current, total) => {
          if (current === total) {
            toast({ title: `All ${total} files sent to print` });
          }
        });
      }
    } catch (error) {
      console.error('Error printing files:', error);
      toast({ title: 'Error printing files', variant: 'destructive' });
    }
  };

  const handleDownloadAll = () => {
    try {
      const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
      if (Array.isArray(files)) {
        files.forEach((file, index) => {
          setTimeout(() => {
            const filePath = `/uploads/${file.filename || file}`;
            const link = document.createElement('a');
            link.href = filePath;
            link.download = file.originalName || file.filename || `file-${index + 1}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 200); // Stagger by 200ms
        });
        toast({ title: `Downloading ${files.length} files` });
      }
    } catch (error) {
      toast({ title: 'Error downloading files', variant: 'destructive' });
    }
  };

  if (showChat) {
    return <ChatModal orderId={order.id} onClose={() => setShowChat(false)} userRole={userRole} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-rich-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rich-black">Order #{order.id}</h2>
              <p className="text-medium-gray">{order.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {order.isUrgent && (
              <Badge className="bg-red-100 text-red-800">Urgent</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{order.type} Order</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">
                      {isEditing && userRole === 'shop_owner' ? (
                        <select 
                          value={editedOrder.status}
                          onChange={(e) => setEditedOrder({...editedOrder, status: e.target.value})}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="processing">Processing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {order.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm text-gray-900 mt-1">{order.description}</p>
                  </div>
                )}
                {order.walkinTime && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Walk-in Time</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(new Date(order.walkinTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files Section */}
            {order.type === 'upload' && order.files && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-brand-yellow" />
                      Files ({(() => {
                        try {
                          const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
                          return Array.isArray(files) ? files.length : 0;
                        } catch {
                          return 0;
                        }
                      })()})
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={handlePrintAll}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print All
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadAll}>
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
                        if (!Array.isArray(files)) return <p className="text-gray-500">No files available</p>;
                        
                        return files.map((file: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-3 text-gray-500" />
                              <span className="text-sm font-medium">{file.originalName || file.filename || `File ${index + 1}`}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  const filePath = `/uploads/${file.filename || file}`;
                                  const link = document.createElement('a');
                                  link.href = filePath;
                                  link.download = file.originalName || file.filename || `file-${index + 1}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={async () => {
                                  try {
                                    await printFile(file);
                                    toast({ title: 'File sent to print' });
                                  } catch (error) {
                                    toast({ title: 'Error printing file', variant: 'destructive' });
                                  }
                                }}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ));
                      } catch (error) {
                        return <p className="text-gray-500">Unable to display files</p>;
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedOrder.notes || ''}
                    onChange={(e) => setEditedOrder({...editedOrder, notes: e.target.value})}
                    placeholder="Add any notes about this order..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-900">{order.notes || 'No notes added'}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer & Actions */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{order.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-900">{order.customerPhone}</p>
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${order.customerPhone}`)}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-900">{format(new Date(order.updatedAt), 'MMM dd, HH:mm')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowChat(true)}
                  className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with {userRole === 'customer' ? 'Shop' : 'Customer'}
                </Button>
                
                {userRole === 'shop_owner' && (
                  <>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveChanges} className="flex-1">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                        Edit Order
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}