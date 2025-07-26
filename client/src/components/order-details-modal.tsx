import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Edit3, Save, X, Trash2, Phone, MessageCircle, FileText, Users, 
  Clock, Package, AlertTriangle, CheckCircle2, Download, Printer,
  Calendar, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description: string;
  status: string;
  files?: string | any[];
  specifications?: any;
  walkinTime?: string;
  isUrgent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState({
    title: order.title,
    description: order.description || '',
    isUrgent: order.isUrgent,
    notes: order.notes || ''
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: updates
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.id}/history`] });
      toast({ title: 'Order updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update order', variant: 'destructive' });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.id}`] });
      toast({ title: 'Order status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/orders/${order.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.id}/history`] });
      toast({ title: 'Order deleted successfully' });
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to delete order', variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateOrderMutation.mutate(editedOrder);
  };

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

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
      case 'new': return <Package className="w-4 h-4" />;
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

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'new': return 'Start Processing';
      case 'processing': return 'Mark Ready';
      case 'ready': return 'Complete Order';
      default: return null;
    }
  };

  const handlePrintAll = () => {
    if (order.files && Array.isArray(order.files)) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        files.forEach((file: any) => {
          const printWindow = window.open(`/api/files/${file.filename || file}`, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        });
        toast({ title: `Opening ${files.length} print dialogs` });
      } catch (error) {
        toast({ title: 'Error opening print dialogs', variant: 'destructive' });
      }
    }
  };

  const handleDownloadAll = () => {
    if (order.files && Array.isArray(order.files)) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        files.forEach((file: any, index: number) => {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = `/api/files/${file.filename || file}`;
            link.download = file.originalName || `file_${index + 1}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 500);
        });
        toast({ title: `Downloading ${files.length} files` });
      } catch (error) {
        toast({ title: 'Error downloading files', variant: 'destructive' });
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl font-bold text-rich-black">
                Order #{order.id}
              </DialogTitle>
              <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
              {order.isUrgent && (
                <Badge variant="destructive" className="bg-red-500 text-white">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateOrderMutation.isPending}
                    className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-brand-yellow" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Title</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrder.title}
                        onChange={(e) => setEditedOrder({...editedOrder, title: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{order.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <div className="flex items-center mt-1">
                      {order.type === 'upload' ? (
                        <><FileText className="w-4 h-4 mr-2 text-blue-500" /> Upload Order</>
                      ) : (
                        <><Users className="w-4 h-4 mr-2 text-green-500" /> Walk-in Order</>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedOrder.description}
                      onChange={(e) => setEditedOrder({...editedOrder, description: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{order.description || 'No description provided'}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="urgent" className="text-sm font-medium text-gray-600">Urgent Order</Label>
                    <Switch
                      id="urgent"
                      checked={isEditing ? editedOrder.isUrgent : order.isUrgent}
                      onCheckedChange={(checked) => 
                        isEditing && setEditedOrder({...editedOrder, isUrgent: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {order.walkinTime && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Walk-in Time</Label>
                    <div className="flex items-center mt-1 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      {order.walkinTime}
                    </div>
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
                      Files ({Array.isArray(order.files) ? order.files.length : 0})
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
                    {Array.isArray(order.files) && order.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="text-sm font-medium">{file.originalName || `File ${index + 1}`}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => window.open(`/api/files/${file.filename}`, '_blank')}>
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
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
                    value={editedOrder.notes}
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
                {/* Status Progress */}
                {getNextStatus(order.status) && (
                  <Button
                    className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                    onClick={() => handleStatusChange(getNextStatus(order.status)!)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {getNextStatusLabel(order.status)}
                  </Button>
                )}

                <Separator />

                {/* Secondary Actions */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => {/* Open chat */}}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Customer
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this order? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteOrderMutation.mutate()}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}