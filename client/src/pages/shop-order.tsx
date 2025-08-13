import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, Phone, MapPin, Clock, Upload, Users, 
  FileText, AlertCircle, CheckCircle, X, Package, CheckCircle2, Loader2, Send
} from 'lucide-react';
import { EnhancedFileUpload } from '@/components/enhanced-file-upload';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLoading, LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shop, OrderFormInput } from '@shared/types';
import { isShopCurrentlyOpen, canPlaceWalkinOrder as canPlaceWalkinOrderUtil, getShopStatusText, getNextOpeningTime } from '@/utils/shop-timing';



const orderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactNumber: z.string().min(10, 'Valid phone number is required'),
  orderType: z.enum(['upload', 'walkin']),
  files: z.array(z.any()).optional(),
  isUrgent: z.boolean(),
  description: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function ShopOrder() {
  const [, params] = useRoute('/shop/:slug');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [orderType, setOrderType] = useState<'upload' | 'walkin'>('upload');
  const [uploadProgress, setUploadProgress] = useState<{
    progress: number;
    currentFile: string;
    filesProcessed: number;
    totalFiles: number;
    uploadSpeed: number;
    estimatedTime: number;
  } | null>(null);
  const { getPersistentUserData, user } = useAuth();

  // Get shop data with auto-refresh for real-time updates
  const { data: shopData, isLoading, error } = useQuery<Shop>({
    queryKey: [`/api/shops/slug/${params?.slug}`],
    enabled: !!params?.slug,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time shop status
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const shop = shopData;

  // Auto-fill from persistent data
  const persistentData = getPersistentUserData();
  
  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      name: user?.name && user.name !== 'Customer' ? user.name : persistentData?.name || '',
      contactNumber: user?.phone || persistentData?.phone || '',
      orderType: 'upload',
      isUrgent: false,
      description: '',
    },
  });

  // Enhanced auto-population with logged-in user data
  useEffect(() => {
    // Prioritize logged-in user data first, then persistent data
    if (user) {
      if (user.name && user.name !== 'Customer') {
        form.setValue('name', user.name);
      }
      if (user.phone) {
        form.setValue('contactNumber', user.phone);
      }
    } else if (persistentData) {
      if (persistentData.name) form.setValue('name', persistentData.name);
      if (persistentData.phone) form.setValue('contactNumber', persistentData.phone);
    }
  }, [user, persistentData, form]);

  // Real-time shop status tracking with live updates
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute for real-time status checking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Use centralized timing utility for consistent shop availability checking
  const isShopOpen = (): boolean => {
    return shop ? isShopCurrentlyOpen(shop) : false;
  };

  // Check if walk-in orders are available using centralized utility
  const canPlaceWalkinOrderCheck = (): boolean => {
    return shop ? canPlaceWalkinOrderUtil(shop) : false;
  };

  // Add debugging for shop status
  useEffect(() => {
    if (shop) {
      console.log('🔍 SHOP ORDER PAGE - Shop data received:', {
        name: shop.name,
        isOnline: shop.isOnline,
        workingHours: shop.workingHours,
        acceptsWalkinOrders: shop.acceptsWalkinOrders,
        currentTime: currentTime.toLocaleTimeString()
      });
    }
  }, [shop, currentTime]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      const startTime = Date.now();
      let totalBytes = 0;
      
      // Calculate total file size for progress tracking
      selectedFiles.forEach(file => totalBytes += file.size);
      
      const formData = new FormData();
      formData.append('shopId', shop!.id.toString());
      formData.append('customerName', data.name);
      formData.append('customerPhone', data.contactNumber);
      formData.append('type', data.orderType === 'upload' ? 'file_upload' : 'walkin');
      formData.append('title', `Order from ${data.name}`);
      formData.append('description', data.description || '');
      formData.append('specifications', data.isUrgent ? 'URGENT ORDER' : '');
      
      if (data.orderType === 'upload' && selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
          formData.append('files', file);
          
          // Simulate progress tracking for large files
          if (file.size > 10 * 1024 * 1024) { // Files > 10MB
            const elapsedTime = (Date.now() - startTime) / 1000;
            const uploadSpeed = totalBytes / elapsedTime;
            const estimatedTime = Math.max(0, (totalBytes - (index + 1) * file.size / selectedFiles.length) / uploadSpeed);
            
            setUploadProgress({
              progress: ((index + 1) / selectedFiles.length) * 100,
              currentFile: file.name,
              filesProcessed: index + 1,
              totalFiles: selectedFiles.length,
              uploadSpeed,
              estimatedTime
            });
          }
        });
      }

      const response = await fetch('/api/orders/anonymous', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Order Created Successfully!',
        description: `Order #${data.orderNumber || data.id} has been placed`,
      });
      
      // Navigate to order confirmation  
      navigate(`/order-confirmation/${data.id}`);
    },
    onError: () => {
      setUploadProgress(null); // Clear progress on error
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: 'Unable to create order. Please try again.',
      });
    },
    onSettled: () => {
      // Clear progress when mutation is finished (success or error)
      setTimeout(() => setUploadProgress(null), 1000);
    },
  });

  const onSubmit = async (data: OrderForm) => {
    // Allow order submission even if shop is closed
    // The shop owner can handle orders when they open
    if (!shop) {
      toast({
        variant: 'destructive',
        title: 'Shop Not Found',
        description: 'Unable to find shop information.',
      });
      return;
    }

    // Check walk-in order availability
    if (orderType === 'walkin' && !canPlaceWalkinOrderCheck()) {
      toast({
        variant: 'destructive',
        title: 'Walk-in Orders Unavailable',
        description: 'Walk-in orders are not available when the shop is closed.',
      });
      return;
    }

    if (orderType === 'upload' && selectedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Files Selected',
        description: 'Please select at least one file to upload.',
      });
      return;
    }

    // Direct order creation without OTP verification
    createOrderMutation.mutate({ ...data, orderType });
  };



  if (isLoading) {
    return (
      <DashboardLoading 
        title="Loading Information..." 
        subtitle="Getting shop details, working hours, and order settings"
      />
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Shop Not Found</h2>
            <p className="text-gray-600 mb-4">The shop you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} className="bg-brand-yellow text-rich-black">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shopOpen = isShopOpen();

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced PrintEasy Header with Branding */}
      <div className="bg-brand-yellow p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* PrintEasy Brand Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-rich-black p-2 rounded-lg">
                <img 
                  src="/api/public-objects/PrintEasy_The_Harsh_QR (2).png" 
                  alt="PrintEasy Logo" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    // Fallback to Package icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<svg class="w-5 h-5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-rich-black">PrintEasy</h2>
                <p className="text-xs text-rich-black/70">Your Printing Partner</p>
              </div>
            </div>
            <Badge className="bg-rich-black text-brand-yellow border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified Platform
            </Badge>
          </div>
          
          {/* Shop Information */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-rich-black">{shop.name}</h1>
                  <Badge className="bg-green-600 text-white border-0 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified Shop
                  </Badge>
                </div>
              </div>
              <Badge variant={shopOpen ? 'default' : 'secondary'} className="bg-white/90 text-rich-black">
                {shopOpen ? 'Open Now' : 'Closed'}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-rich-black text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{shop.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{shop.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="max-w-4xl mx-auto p-6">
        {!shopOpen && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p>This shop is currently closed. You can still place an order for later.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Place Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Order Type - Fixed Mobile Responsive */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Order Type</h3>
                  {shop.acceptsWalkinOrders ? (
                    // Both options available - show tabs
                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'upload' | 'walkin')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </TabsTrigger>
                        <TabsTrigger value="walkin" disabled={!canPlaceWalkinOrderCheck()}>
                          <Users className="w-4 h-4 mr-2" />
                          Walk-in Order {!shopOpen && '(Closed)'}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload" className="mt-4">
                        <EnhancedFileUpload
                          files={selectedFiles}
                          onFilesChange={setSelectedFiles}
                          isUploading={createOrderMutation.isPending}
                          disabled={createOrderMutation.isPending}
                          maxFiles={10}
                          acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']}
                        />
                      </TabsContent>

                      <TabsContent value="walkin" className="mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Visit our shop with your documents. We'll handle the printing on-site.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    // Only upload available - direct UI without tabs
                    <div className="space-y-4">
                      <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="w-5 h-5 text-brand-yellow" />
                          <h4 className="font-medium text-rich-black">Upload Files</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Upload your documents for printing</p>
                        <EnhancedFileUpload
                          files={selectedFiles}
                          onFilesChange={setSelectedFiles}
                          isUploading={createOrderMutation.isPending}
                          disabled={createOrderMutation.isPending}
                          maxFiles={10}
                          acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']}
                        />
                      </div>
                      
                      {/* Walk-in disabled notice */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <h4 className="font-medium text-gray-500">Walk-in Orders</h4>
                          <Badge variant="outline" className="text-xs">Not Available</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          This shop currently only accepts file upload orders.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Urgent Checkbox */}
                <FormField
                  control={form.control}
                  name="isUrgent"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Is this order really urgent?
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe Print Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 100 copies, color printing, spiral binding..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#FFBF00] text-black hover:bg-black hover:text-[#FFBF00] transition-all duration-300"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadProgress ? (
                        <span>Uploading... {Math.round(uploadProgress.progress)}%</span>
                      ) : (
                        <span>Creating Order...</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Order
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>


      </div>


    </div>
  );
}