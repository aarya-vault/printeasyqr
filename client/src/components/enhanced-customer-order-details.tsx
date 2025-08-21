import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  X, FileText, Download, Printer, Phone, MessageCircle, 
  Calendar, Clock, CheckCircle2, Package, User, Upload,
  Plus, AlertCircle, Zap, Building2, Eye, Paperclip,
  CheckCircle, PlayCircle, Truck, Star
} from 'lucide-react';
import { format } from 'date-fns';
import { formatToIndiaDateTime } from '@/lib/time-utils';
import UnifiedChatSystem from '@/components/unified-chat-system';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { printFile, printAllFiles, downloadFile, downloadAllFiles } from '@/utils/print-helpers';
import { EnhancedFileUpload } from '@/components/enhanced-file-upload';
import { uploadFilesDirectlyToR2, DirectUploadProgress } from '@/utils/direct-upload';

interface Order {
  id: number;
  orderNumber: number;
  publicId?: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  shopName?: string;
  shopPhone?: string;
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
  deletedAt?: string;
  deletedBy?: number;
  deletedByUser?: {
    id: number;
    name: string;
    role: string;
  };

  shop?: {
    id: number;
    name: string;
    phone?: string;
    publicContactNumber?: string;
    publicAddress?: string;
  };
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

interface UploadProgressInfo {
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  currentFileName: string;
  overallProgress: number;
  bytesUploaded: number;
  totalBytes: number;
  uploadSpeed: number;
  estimatedTimeRemaining: number;
}

interface EnhancedCustomerOrderDetailsProps {
  order: Order;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function EnhancedCustomerOrderDetails({ order, onClose, onRefresh }: EnhancedCustomerOrderDetailsProps) {
  const [showChat, setShowChat] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // FIX: Stable order state to prevent data vanishing
  const [stableOrder, setStableOrder] = useState(() => {
    // Deep clone to prevent reference issues
    return order ? JSON.parse(JSON.stringify(order)) : order;
  });

  // Fetch fresh order data for real-time updates (only when component is visible)
  const { data: freshOrder, refetch: refetchOrder } = useQuery({
    queryKey: [`/api/orders/${order.id}`],
    initialData: order,
    refetchInterval: order && order.status !== 'completed' ? 30000 : false, // Reduced to 30 seconds - WebSocket handles real-time updates
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    enabled: !!order?.id, // Only run when we have a valid order
    staleTime: 2000, // Consider data fresh for 2 seconds
  });

  // FIX: Update stable order only when we get valid fresh data
  useEffect(() => {
    if (freshOrder && freshOrder.id) {
      console.log('📝 Customer Order Details: Updating stable order with fresh data', freshOrder.id);
      // Deep clone to prevent reference issues
      const clonedOrder = JSON.parse(JSON.stringify(freshOrder));
      setStableOrder(clonedOrder);
    }
  }, [freshOrder]);

  // Use stable order for rendering to prevent data vanishing
  const currentOrder = stableOrder || order;

  // 🚀 ULTRA-FAST Upload additional files mutation with DIRECT R2 UPLOAD (bypassing server)
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      console.log(`🚀 Add More Files: Starting DIRECT R2 upload for ${files.length} files...`);
      
      try {
        // Try direct R2 upload first (bypasses server for 2x speed)
        const uploadResult = await uploadFilesDirectlyToR2(
          files,
          currentOrder.id,
          (progress: DirectUploadProgress) => {
            setUploadProgress({
              totalFiles: progress.totalFiles,
              completedFiles: progress.completedFiles,
              currentFileIndex: progress.completedFiles,
              currentFileName: progress.currentFile,
              overallProgress: progress.overallProgress,
              bytesUploaded: progress.bytesUploaded,
              totalBytes: progress.totalBytes,
              uploadSpeed: progress.uploadSpeed,
              estimatedTimeRemaining: progress.estimatedTime
            });
          }
        );

        if (uploadResult.success) {
          console.log('✅ Direct R2 upload completed for add more files!');
          console.log(`⚡ Achieved ${(uploadResult.uploadedFiles.reduce((sum, f) => sum + (f.speed || 0), 0) / uploadResult.uploadedFiles.length / (1024 * 1024)).toFixed(2)} MB/s average speed`);
          return { message: 'Files uploaded successfully', newFiles: uploadResult.uploadedFiles };
        } else {
          throw new Error('Direct upload failed, using server fallback');
        }
      } catch (error) {
        console.log('⚠️ Direct upload failed, falling back to server upload...', error);
        
        // Fallback to server upload
        return new Promise<any>((resolve, reject) => {
          const formData = new FormData();
          files.forEach((file) => {
            formData.append('files', file);
          });

          const xhr = new XMLHttpRequest();
          const startTime = Date.now();
          
          xhr.upload.onprogress = (progressEvent: ProgressEvent) => {
            if (progressEvent.lengthComputable) {
              const currentTime = Date.now();
              const elapsedTime = (currentTime - startTime) / 1000;
              const bytesLoaded = progressEvent.loaded;
              const bytesTotal = progressEvent.total;
              
              // Calculate upload speed
              const uploadSpeed = elapsedTime > 0 ? bytesLoaded / elapsedTime : 0;
              const bytesRemaining = bytesTotal - bytesLoaded;
              const estimatedTimeRemaining = uploadSpeed > 0 ? Math.round(bytesRemaining / uploadSpeed) : 0;
              
              setUploadProgress({
                totalFiles: files.length,
                completedFiles: 0,
                currentFileIndex: 0,
                currentFileName: files[0]?.name || '',
                overallProgress: Math.round((bytesLoaded / bytesTotal) * 100),
                bytesUploaded: bytesLoaded,
                totalBytes: bytesTotal,
                uploadSpeed: uploadSpeed,
                estimatedTimeRemaining: estimatedTimeRemaining
              });
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch {
                resolve(xhr.responseText);
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Upload failed'));
          
          // Get JWT token from localStorage and include in request
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.open('POST', `/api/orders/${currentOrder.id}/add-files`);
          xhr.send(formData);
        });
      }
    },
    onSuccess: async (data) => {
      // CRITICAL FIX: Enhanced immediate refresh for "Add more files"
      console.log('✅ Add More Files: Upload successful, forcing immediate refresh...');
      
      // Step 1: Invalidate all related queries first
      await queryClient.invalidateQueries({ queryKey: [`/api/orders/${currentOrder.id}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${order.customerId}`] });
      
      // Step 2: Force immediate refetch with await
      const freshResult = await refetchOrder();
      if (freshResult.data) {
        console.log('🔄 Updating stable order with fresh files:', freshResult.data.files);
        const clonedOrder = JSON.parse(JSON.stringify(freshResult.data));
        setStableOrder(clonedOrder);
      }
      
      // Step 3: If we have new files data from response, update immediately
      if (data?.newFiles && Array.isArray(data.newFiles)) {
        setStableOrder((prev: any) => {
          const existingFiles = parseFiles(prev.files);
          const updatedOrder = {
            ...prev,
            files: [...existingFiles, ...data.newFiles]
          };
          console.log('📁 Immediately added new files to stable order:', data.newFiles.length);
          return updatedOrder;
        });
      }
      
      // Step 4: Force parent refresh
      if (onRefresh) {
        await onRefresh();
      }
      
      toast({ 
        title: 'Files uploaded successfully!',
        description: `${selectedFiles.length} file(s) added to order`
      });
      
      // Reset upload state
      setSelectedFiles([]);
      setUploadProgress(null);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getStatusInfo = (status: string, isDeleted: boolean = false) => {
    if (isDeleted) {
      return {
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        icon: X,
        label: 'Deleted',
        description: 'This order has been deleted and is no longer available'
      };
    }
    
    switch (status) {
      case 'new':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          icon: PlayCircle,
          label: 'Order Placed',
          description: 'Your order has been received and is waiting to be processed'
        };
      case 'pending':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          icon: Clock,
          label: 'Pending Approval',
          description: 'Your order is waiting for shop confirmation'
        };
      case 'processing':
        return {
          color: 'bg-brand-yellow',
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          icon: Package,
          label: 'In Progress',
          description: 'Your order is being prepared by the print shop'
        };
      case 'ready':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
          label: 'Ready for Pickup',
          description: 'Your order is ready! You can collect it from the shop'
        };
      case 'completed':
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          icon: Star,
          label: 'Completed',
          description: 'Order completed successfully'
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          icon: Clock,
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const getProgressPercentage = (status: string, isDeleted: boolean = false) => {
    if (isDeleted) return 0;
    
    switch (status) {
      case 'new': return 25;
      case 'pending': return 25;
      case 'processing': return 50;
      case 'ready': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const parseFiles = (filesData: any) => {
    if (!filesData) return [];
    if (typeof filesData === 'string') {
      try {
        return JSON.parse(filesData);
      } catch {
        return [];
      }
    }
    return Array.isArray(filesData) ? filesData : [];
  };

  const createDetailedStatusHistory = (): StatusHistoryItem[] => {
    const history: StatusHistoryItem[] = [
      {
        status: 'new',
        timestamp: currentOrder.createdAt,
        note: 'Order received and queued for processing'
      }
    ];

    // Add intermediate statuses based on current status
    const createdTime = new Date(currentOrder.createdAt);
    const updatedTime = new Date(currentOrder.updatedAt);
    
    // Validate dates
    if (isNaN(createdTime.getTime()) || isNaN(updatedTime.getTime())) {
      return history; // Return basic history if dates are invalid
    }
    
    if (currentOrder.status === 'processing') {
      history.push({
        status: 'processing',
        timestamp: currentOrder.updatedAt,
        note: 'Shop owner started working on your order'
      });
    } else if (currentOrder.status === 'ready') {
      // Add processing step (estimated time between created and updated)
      const processingTime = new Date(createdTime.getTime() + (updatedTime.getTime() - createdTime.getTime()) * 0.3);
      history.push({
        status: 'processing',
        timestamp: processingTime.toISOString(),
        note: 'Shop owner started working on your order'
      });
      history.push({
        status: 'ready',
        timestamp: currentOrder.updatedAt,
        note: 'Order completed and ready for pickup'
      });
    } else if (currentOrder.status === 'completed') {
      // Add all intermediate steps for completed orders
      const processingTime = new Date(createdTime.getTime() + (updatedTime.getTime() - createdTime.getTime()) * 0.2);
      const readyTime = new Date(createdTime.getTime() + (updatedTime.getTime() - createdTime.getTime()) * 0.7);
      
      history.push({
        status: 'processing',
        timestamp: processingTime.toISOString(),
        note: 'Shop owner started working on your order'
      });
      history.push({
        status: 'ready',
        timestamp: readyTime.toISOString(),
        note: 'Order completed and ready for pickup'
      });
      history.push({
        status: 'completed',
        timestamp: currentOrder.updatedAt,
        note: 'Order successfully collected by customer'
      });
    }

    return history;
  };

  const isDeleted = !!(currentOrder.deletedAt);
  const currentFiles = parseFiles(currentOrder.files);
  const statusHistory = createDetailedStatusHistory();
  const currentStatusInfo = getStatusInfo(currentOrder.status, isDeleted);
  const canAddFiles = currentOrder.status !== 'completed' && !isDeleted; // Don't allow adding files to deleted orders

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // VALIDATION: Check file sizes (1GB limit per file)
    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Files too large',
        description: `${oversizedFiles.length} file(s) exceed the 1GB limit. Please use smaller files or compress them.`,
        variant: 'destructive'
      });
      // Remove oversized files from selection
      const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);
      setSelectedFiles(validFiles);
    } else {
      setSelectedFiles(files);
    }
  };

  const handleUploadFiles = () => {
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      
      // PERFORMANCE: Show upload progress for large files
      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      toast({
        title: 'Uploading files...',
        description: `Uploading ${selectedFiles.length} file(s) (${totalSizeMB} MB total)`,
      });
      
      uploadFilesMutation.mutate(selectedFiles);
    } else {
      toast({ title: 'Please select files to upload', variant: 'destructive' });
    }
  };

  const handlePrintFile = async (file: any) => {
    try {
      await printFile(file, currentOrder.status);
      toast({ title: `${file.originalName || file.filename} sent to print` });
    } catch (error: any) {
      toast({ 
        title: 'Cannot print file', 
        description: error.message || 'File may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadFile = (file: any) => {
    try {
      downloadFile(file, currentOrder.status);
      toast({ title: `${file.originalName || file.filename} downloaded` });
    } catch (error: any) {
      toast({ 
        title: 'Cannot download file', 
        description: error.message || 'File may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  const handlePrintAll = async () => {
    try {
      if (currentFiles.length > 0) {
        toast({ title: `Preparing ${currentFiles.length} files for printing...` });
        await printAllFiles(currentFiles, (current, total) => {
          if (current === total) {
            toast({ title: `All ${total} files sent to print` });
          }
        }, currentOrder.status);
      }
    } catch (error: any) {
      toast({ 
        title: 'Cannot print files', 
        description: error.message || 'Files may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (currentFiles.length > 0) {
        toast({ title: `Downloading ${currentFiles.length} files...` });
        downloadAllFiles(currentFiles, (current, total) => {
          if (current === total) {
            toast({ title: `All ${total} files downloaded` });
          }
        }, currentOrder.status);
      }
    } catch (error: any) {
      toast({ 
        title: 'Cannot download files', 
        description: error.message || 'Files may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  const handlePrintSelected = async () => {
    if (selectedFileIndices.size === 0) {
      toast({ title: 'No files selected', description: 'Please select files to print', variant: 'destructive' });
      return;
    }

    try {
      const selectedFiles = Array.from(selectedFileIndices).map(index => currentFiles[index]).filter(Boolean);
      
      if (selectedFiles.length > 0) {
        toast({ title: `Preparing ${selectedFiles.length} selected files for printing...` });
        await printAllFiles(selectedFiles, (current, total) => {
          if (current === total) {
            toast({ title: `${total} selected files sent to print` });
          }
        }, currentOrder.status);
      }
    } catch (error: any) {
      toast({ 
        title: 'Cannot print selected files', 
        description: error.message || 'Files may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedFileIndices.size === 0) {
      toast({ title: 'No files selected', description: 'Please select files to download', variant: 'destructive' });
      return;
    }

    try {
      const selectedFiles = Array.from(selectedFileIndices).map(index => currentFiles[index]).filter(Boolean);
      
      if (selectedFiles.length > 0) {
        toast({ title: `Downloading ${selectedFiles.length} selected files...` });
        downloadAllFiles(selectedFiles, (current, total) => {
          if (current === total) {
            toast({ title: `${total} selected files downloaded` });
          }
        }, currentOrder.status);
      }
    } catch (error: any) {
      toast({ 
        title: 'Cannot download selected files', 
        description: error.message || 'Files may no longer be available',
        variant: 'destructive' 
      });
    }
  };

  if (showChat) {
    return (
      <UnifiedChatSystem
        isOpen={true}
        onClose={() => setShowChat(false)}
        initialOrderId={order.id}
        userRole="customer"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${isDeleted ? 'text-red-600 line-through' : 'text-rich-black'}`}>
              Queue #{currentOrder.orderNumber || currentOrder.id}
              <span className="text-sm text-gray-500 ml-2 font-normal">
                ({currentOrder.publicId || `ORD-${currentOrder.id}`})
              </span>
              {isDeleted && (
                <Badge variant="destructive" className="ml-3 text-xs">
                  🗑️ Deleted
                </Badge>
              )}
            </h2>
            <p className={`${isDeleted ? 'text-gray-500 line-through' : 'text-gray-600'}`}>{currentOrder.title}</p>
            {isDeleted && currentOrder.deletedByUser && (
              <p className="text-sm text-red-600 mt-1">
                Deleted by: {currentOrder.deletedByUser.name} on {format(new Date(currentOrder.deletedAt!), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentStatusInfo.icon className="w-5 h-5 text-brand-yellow" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge className={`${currentStatusInfo.bgColor} ${currentStatusInfo.textColor} px-3 py-1`}>
                  {currentStatusInfo.label}
                </Badge>
                {currentOrder.isUrgent && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Urgent
                  </Badge>
                )}
              </div>
              
              <div className="w-full overflow-hidden">
                <Progress value={getProgressPercentage(currentOrder.status, isDeleted)} className={`h-2 w-full ${isDeleted ? 'opacity-50' : ''}`} />
              </div>
              
              <p className="text-sm text-gray-600">{currentStatusInfo.description}</p>
              
              <div className="text-xs text-gray-500">
                {isDeleted
                  ? `Deleted: ${formatToIndiaDateTime(currentOrder.deletedAt!)}`
                  : currentOrder.status === 'completed' 
                    ? `Completed: ${formatToIndiaDateTime(currentOrder.updatedAt)}`
                    : `Last updated: ${formatToIndiaDateTime(currentOrder.updatedAt)}`
                }
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Order Details */}
            <div className="space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-yellow" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {currentOrder.type === 'upload' ? 'File Upload' : 'Walk-in Order'}
                    </Badge>
                  </div>
                  
                  {currentOrder.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm mt-1">{currentOrder.description}</p>
                    </div>
                  )}

                  {currentOrder.walkinTime && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Appointment Time</p>
                      <p className="text-sm mt-1">{currentOrder.walkinTime}</p>
                    </div>
                  )}

                  {currentOrder.specifications && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Specifications</p>
                      <div className="text-sm mt-1 bg-gray-50 p-3 rounded">
                        {(() => {
                          if (typeof currentOrder.specifications === 'string') {
                            return currentOrder.specifications;
                          }
                          if (typeof currentOrder.specifications === 'object') {
                            const specs = currentOrder.specifications;
                            return (
                              <div className="space-y-1">
                                {specs.urgent && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600 font-medium">• Urgent Order</span>
                                  </div>
                                )}
                                {specs.copies && (
                                  <div>• Copies: {specs.copies}</div>
                                )}
                                {specs.color && (
                                  <div>• Color: {specs.color}</div>
                                )}
                                {specs.size && (
                                  <div>• Size: {specs.size}</div>
                                )}
                                {specs.binding && (
                                  <div>• Binding: {specs.binding}</div>
                                )}
                                {Object.keys(specs).length === 0 && (
                                  <span className="text-gray-500">No special specifications</span>
                                )}
                              </div>
                            );
                          }
                          return 'No specifications';
                        })()}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-sm mt-1">
                      {formatToIndiaDateTime(currentOrder.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Shop Information */}
              {currentOrder.shop && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-brand-yellow" />
                      Print Shop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">{currentOrder.shop.name}</p>
                      {currentOrder.shop.publicAddress && (
                        <p className="text-sm text-gray-600 mt-1">{currentOrder.shop.publicAddress}</p>
                      )}
                    </div>
                    
                    {currentOrder.shop.publicContactNumber && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{currentOrder.shop.publicContactNumber}</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${currentOrder.shop?.publicContactNumber}`)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-yellow" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((item, index) => {
                      const statusInfo = getStatusInfo(item.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`${statusInfo.color} p-2 rounded-full`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{statusInfo.label}</p>
                              <span className="text-xs text-gray-500">
                                {formatToIndiaDateTime(item.timestamp)}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-xs text-gray-600 mt-1">{item.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Files & Actions */}
            <div className="space-y-6">
              {/* Files Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-yellow" />
                      Files ({currentFiles.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No files uploaded yet</p>
                    </div>
                  ) : (
                    currentFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-brand-yellow" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {file.originalName || file.filename || `File ${index + 1}`}
                          </p>
                          {file.size && (
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                          {currentOrder.status === 'completed' && (
                            <p className="text-xs text-red-500 mt-1">
                              ⚠ File deleted after completion
                            </p>
                          )}
                        </div>
                        {currentOrder.status === 'completed' && (
                          <div className="text-xs text-gray-400 px-3">
                            Files removed
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* 🚀 ULTRA-FAST Add Files Section */}
                  {canAddFiles && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-brand-yellow" />
                          <span className="font-medium text-sm">Add More Files</span>
                          <Badge variant="outline" className="text-xs bg-[#FFBF00]/10 text-[#FFBF00] border-[#FFBF00]/30">
                            Ultra-Fast Upload
                          </Badge>
                        </div>
                        
                        {/* Enhanced File Upload Component */}
                        <EnhancedFileUpload
                          files={selectedFiles}
                          onFilesChange={setSelectedFiles}
                          isUploading={isUploading || uploadFilesMutation.isPending}
                          disabled={isUploading || uploadFilesMutation.isPending}
                          maxFiles={200}
                          acceptedFileTypes={['*']}
                          uploadProgress={uploadProgress || undefined}
                        />
                        
                        {/* Upload Button */}
                        {selectedFiles.length > 0 && (
                          <Button
                            onClick={handleUploadFiles}
                            disabled={isUploading || uploadFilesMutation.isPending}
                            className="w-full bg-brand-yellow hover:bg-yellow-500 text-rich-black font-semibold"
                          >
                            {(isUploading || uploadFilesMutation.isPending) ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
                                {uploadProgress ? (
                                  `Uploading... ${Math.round(uploadProgress.overallProgress)}%`
                                ) : (
                                  'Processing Files...'
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} to Order
                              </div>
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {!canAddFiles && !isDeleted && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Order completed - Files have been processed and removed from storage
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isDeleted && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-700 font-medium">
                          Order Deleted - Files no longer available
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isDeleted ? (
                    <>
                      <Button
                        onClick={() => setShowChat(true)}
                        className="w-full bg-brand-yellow hover:bg-yellow-500 text-rich-black"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat with Shop
                      </Button>

                      {order.shop?.publicContactNumber && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(`tel:${order.shop?.publicContactNumber}`)}
                          className="w-full"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Shop
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <X className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <p className="text-sm font-medium">Order Deleted</p>
                      <p className="text-xs">No actions available for deleted orders</p>
                      {currentOrder.deletedByUser && (
                        <p className="text-xs text-red-600 mt-2">
                          Deleted by {currentOrder.deletedByUser.name}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}