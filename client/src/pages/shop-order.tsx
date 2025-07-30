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
  FileText, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { EnhancedFileUpload } from '@/components/enhanced-file-upload';

const orderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactNumber: z.string().min(10, 'Valid phone number is required'),
  orderType: z.enum(['upload', 'walkin']),
  files: z.array(z.any()).optional(),
  isUrgent: z.boolean(),
  description: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  publicOwnerName?: string;
  workingHours: any;
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
  autoAvailability: boolean;
}

export default function ShopOrder() {
  const [, params] = useRoute('/shop/:slug');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [orderType, setOrderType] = useState<'upload' | 'walkin'>('upload');

  // Get shop data with auto-refresh for real-time updates
  const { data: shopData, isLoading, error } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/slug/${params?.slug}`],
    enabled: !!params?.slug,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time shop status
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const shop = shopData?.shop;

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      orderType: 'upload',
      isUrgent: false,
      description: '',
    },
  });

  // Calculate if shop is open and accepting orders with 24/7 support
  const isShopOpen = () => {
    if (!shop || !shop.isOnline) return false;
    
    // If no working hours defined, assume 24/7 operation
    if (!shop.workingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    // If day is marked as closed, shop is closed
    if (!todayHours || todayHours.closed) return false;
    
    // Handle 24/7 operation - if open time equals close time
    if (todayHours.open === todayHours.close) return true;
    
    // Handle overnight operations (e.g., 22:00 to 06:00)
    if (todayHours.open > todayHours.close) {
      return currentTime >= todayHours.open || currentTime <= todayHours.close;
    }
    
    // Normal day operation
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  // Check if walk-in orders are available
  const canPlaceWalkinOrder = () => {
    return shop && shop.acceptsWalkinOrders && isShopOpen();
  };

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
      const formData = new FormData();
      formData.append('shopId', shop!.id.toString());
      formData.append('name', data.name);
      formData.append('contactNumber', data.contactNumber);
      formData.append('orderType', data.orderType);
      formData.append('isUrgent', data.isUrgent.toString());
      formData.append('description', data.description || '');
      
      if (data.orderType === 'upload' && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
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
        description: `Order #${data.order.id} has been placed`,
      });
      
      // Navigate to order confirmation
      navigate(`/order-confirmation/${data.order.id}`);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: 'Unable to create order. Please try again.',
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    // Check if shop is accepting orders
    if (!shop || !shop.isOnline) {
      toast({
        variant: 'destructive',
        title: 'Shop Closed',
        description: 'This shop is currently not accepting orders.',
      });
      return;
    }

    // Check walk-in order availability
    if (orderType === 'walkin' && !canPlaceWalkinOrder()) {
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
    
    createOrderMutation.mutate({ ...data, orderType });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
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
      {/* Header */}
      <div className="bg-brand-yellow p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-rich-black mb-2">{shop.name}</h1>
          <div className="flex flex-wrap gap-4 text-rich-black">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{shop.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{shop.phone}</span>
            </div>
            <Badge variant={shopOpen ? 'default' : 'secondary'} className="bg-white">
              {shopOpen ? 'Open Now' : 'Closed'}
            </Badge>
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

                {/* Order Type */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Order Type</h3>
                  <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'upload' | 'walkin')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </TabsTrigger>
                      {shop.acceptsWalkinOrders ? (
                        <TabsTrigger value="walkin" disabled={!canPlaceWalkinOrder()}>
                          <Users className="w-4 h-4 mr-2" />
                          Walk-in Order {!shopOpen && '(Closed)'}
                        </TabsTrigger>
                      ) : (
                        <TabsTrigger value="walkin" disabled className="opacity-50">
                          <Users className="w-4 h-4 mr-2" />
                          Walk-in Order (Not Available)
                        </TabsTrigger>
                      )}
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
                  className="w-full bg-[#FFBF00] text-black hover:bg-black hover:text-[#FFBF00]"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    'Submit Order'
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