import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  FileText,
  Calendar,
  Download,
  Printer,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { printFile, printAllFiles, downloadFile, downloadAllFiles } from '@/utils/print-helpers';
import { useToast } from '@/hooks/use-toast';

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
  files: any[];
  walkinTime?: string;
  specifications?: any;
  createdAt: string;
  updatedAt: string;
  isUrgent: boolean;
}

export default function ShopOrderDetails() {
  const { orderId } = useParams();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  const handlePrintFile = async (file: any) => {
    try {
      await printFile(file);
      toast({ title: 'File sent to print' });
    } catch (error) {
      console.error('Error printing file:', error);
      toast({ title: 'Error printing file', variant: 'destructive' });
    }
  };

  const handleDownloadFile = (file: any) => {
    try {
      downloadFile(file);
      toast({ title: 'Download started', description: `Downloading ${file.originalName || file.filename}` });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Download failed', description: 'Unable to download file', variant: 'destructive' });
    }
  };

  const handlePrintAll = async () => {
    if (order?.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        if (files.length > 0) {
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
    }
  };

  const handleDownloadAll = async () => {
    if (order?.files) {
      try {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        if (files.length > 0) {
          toast({ title: `Downloading ${files.length} files...` });
          
          await downloadAllFiles(files, (current, total) => {
            if (current === total) {
              toast({ title: `All ${total} files downloaded` });
            }
          });
        }
      } catch (error) {
        console.error('Error downloading files:', error);
        toast({ title: 'Download failed', description: 'Unable to download files', variant: 'destructive' });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <Link href="/shop-dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const files = order.files ? (typeof order.files === 'string' ? JSON.parse(order.files) : order.files) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/shop-dashboard">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-rich-black">Order Details - #{order.id}</h1>
                {order.isUrgent && (
                  <Badge variant="destructive" className="bg-red-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    URGENT
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-yellow">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-lg">{order.customerName}</p>
                  <p className="text-sm text-gray-500">Customer Name</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-lg">{order.customerPhone}</p>
                  <p className="text-sm text-gray-500">Phone Number</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-yellow">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <p className="font-medium capitalize">
                  {order.type === 'upload' ? 'Uploaded Files' : 'Walk-in Order'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={`${getStatusColor(order.status)} inline-flex items-center`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              {order.walkinTime && (
                <div>
                  <p className="text-sm text-gray-500">Walk-in Time</p>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {format(new Date(order.walkinTime), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="bg-gray-50 p-3 rounded-md">{order.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {order.type === 'upload' && files.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-brand-yellow flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Uploaded Files ({files.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleDownloadAll}
                    className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePrintAll}
                    variant="outline"
                    className="border-brand-yellow text-rich-black hover:bg-brand-yellow/10"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((file: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-10 h-10 text-gray-400" />
                      <div>
                        <p className="font-medium">{file.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {file.mimetype} • {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrintFile(file)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1"
            onClick={() => window.location.href = `tel:${order.customerPhone}`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Customer
          </Button>
          <Link href={`/shop-dashboard/chat/${order.id}`} className="flex-1">
            <Button variant="outline" className="w-full border-rich-black text-rich-black">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}