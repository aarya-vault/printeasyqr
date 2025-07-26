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

  // Get shop data
  const { data: shopData, isLoading, error } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/slug/${params?.slug}`],
    enabled: !!params?.slug,
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

  // Calculate if shop is open
  const isShopOpen = () => {
    if (!shop || !shop.workingHours || !shop.isOnline) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    if (!todayHours || todayHours.closed) return false;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
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
                      <TabsTrigger value="walkin" disabled={!shop.acceptsWalkinOrders}>
                        <Users className="w-4 h-4 mr-2" />
                        Walk-in Order
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Upload Files (No limit - All formats accepted)
                          </label>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-yellow file:text-rich-black hover:file:bg-yellow-400"
                          />
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Selected Files ({selectedFiles.length}):</p>
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm truncate" title={file.name}>{file.name}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                  className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Creating Order...' : 'Submit Order'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}