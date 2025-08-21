import React, { useState, useEffect, useMemo } from 'react';
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
import { calculateUnifiedShopStatus, canPlaceWalkinOrder as canPlaceWalkinOrderUtil, getShopStatusText, getNextOpeningTime } from '@/utils/shop-timing';
import { uploadFilesDirectlyToR2, DirectUploadProgress } from '@/utils/direct-upload';
import { phoneValidationSchema } from '@/lib/validation';



const orderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactNumber: phoneValidationSchema,
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
    bytesUploaded: number;
    totalBytes: number;
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

  // 🔗 SOCIAL MEDIA SEO: Dynamic meta tags for shop pages
  useEffect(() => {
    if (shop) {
      const siteName = 'PrintEasy QR';
      const title = `${shop.name} - Professional Printing Services | ${siteName}`;
      const description = `Visit ${shop.name} for quality printing services in ${shop.city || 'your area'}. Quick, reliable printing solutions. ${shop.address || 'Contact us for details'}.`;
      const imageUrl = `${window.location.origin}/printeasy-social-logo.png`;
      const url = `${window.location.origin}/shop/${shop.slug}`;

      // Update page title
      document.title = title;

      // Remove existing meta tags
      const existingMeta = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]');
      existingMeta.forEach(tag => tag.remove());

      // Add new meta tags
      const metaTags = [
        { name: 'description', content: description },
        
        // Open Graph for Facebook, LinkedIn, etc.
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: imageUrl },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'business.business' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:locale', content: 'en_IN' },
        
        // Twitter Cards
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: imageUrl },
        
        // Additional SEO
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: siteName },
        { name: 'keywords', content: `printing services, ${shop.city}, ${shop.name}, photocopying, document printing` }
      ];

      metaTags.forEach(({ name, property, content }) => {
        const meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      });

      // Add canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);

      // Add JSON-LD structured data for rich snippets
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': shop.name,
        'description': description,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': shop.address,
          'addressLocality': shop.city,
          'addressCountry': 'IN'
        },
        'telephone': shop.phone,
        'url': url,
        'image': imageUrl,
        'priceRange': '₹'
      };

      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify(structuredData);
    }

    return () => {
      // Cleanup on unmount - restore generic title
      document.title = 'PrintEasy QR - Your Printing Partner';
    };
  }, [shop]);

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

  // REMOVED: Use unified status instead of legacy isShopOpen function

  // Check if walk-in orders are available using centralized utility
  const canPlaceWalkinOrderCheck = (): boolean => {
    return shop ? canPlaceWalkinOrderUtil(shop) : false;
  };

  // REMOVED: Legacy debugging - using unified status now

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Removed: Fallback server upload - using R2 direct upload only

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderForm) => {
      // 🚀 JUST-IN-TIME AUTHENTICATION FLOW
      
      // Step 1: Just-in-Time Authentication
      console.log('🔐 Step 1: Just-in-Time Authentication...');
      const authResponse = await fetch('/api/auth/just-in-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.contactNumber
        })
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.message || 'Authentication failed');
      }
      
      const authData = await authResponse.json();
      console.log(`✅ Authenticated: ${authData.isNewUser ? 'New' : 'Existing'} user ${authData.user.name}`);
      
      // Store JWT token for authenticated requests - use 'authToken' key to match auth context
      localStorage.setItem('authToken', authData.token); // Match auth context key
      localStorage.setItem('token', authData.token); // Keep for backward compatibility
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      // Step 2: Create authenticated order WITHOUT files first (R2 Direct Upload Pattern)
      console.log('📦 Step 2: Creating authenticated order (no files yet)...');
      
      const orderResponse = await fetch('/api/orders/authenticated', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: shop!.id,
          type: data.orderType === 'upload' ? 'file_upload' : 'walkin',
          description: data.description || '',
          specifications: data.isUrgent ? 'URGENT ORDER' : ''
        })
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      const order = await orderResponse.json();
      console.log(`✅ Order created: #${order.publicId || order.id}`);

      // Step 3: Upload files directly to R2 if present (Anonymous R2 Direct Upload)
      if (data.orderType === 'upload' && selectedFiles.length > 0) {
        console.log(`🚀 Step 3: Starting DIRECT R2 upload for ${selectedFiles.length} files...`);
        
        try {
          const uploadResult = await uploadFilesDirectlyToR2(
            selectedFiles,
            order.id,
            (progress: DirectUploadProgress) => {
              setUploadProgress({
                totalFiles: progress.totalFiles,
                filesProcessed: progress.completedFiles,
                currentFile: progress.currentFile,
                progress: progress.overallProgress,
                uploadSpeed: progress.uploadSpeed,
                bytesUploaded: progress.bytesUploaded,
                totalBytes: progress.totalBytes,
                estimatedTime: progress.estimatedTime
              });
            }
          );
          
          console.log(`✅ All ${uploadResult.uploadedFiles.length} files uploaded directly to R2`);
          
          if (!uploadResult.success) {
            console.warn('⚠️  Some files may have failed to upload');
          }
        } catch (uploadError) {
          console.error('R2 Direct Upload failed:', uploadError);
          throw new Error('Failed to upload files to cloud storage');
        }
      }

      return order;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Order Created Successfully!',
        description: `Order placed with Queue #${data.orderNumber} (ID: ${data.publicId || data.id})`,
      });
      
      // Navigate to order confirmation  
      navigate(`/order-confirmation/${data.id}`);
    },
    onError: (error: any) => {
      setUploadProgress(null); // Clear progress on error
      console.error('Order creation error:', error);
      // Don't trigger page refresh - handle error gracefully
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: error?.message || 'Unable to create order. Please try again.',
      });
    },
    onSettled: () => {
      // ⚡ INSTANT CLEANUP: Remove artificial delay for better UX
      setUploadProgress(null);
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

    // Direct order creation with enhanced upload tracking
    createOrderMutation.mutate({ ...data, orderType });
  };



  // Calculate unified shop status - combines working hours AND manual override
  // Move this before early returns to fix hooks order
  const unifiedStatus = useMemo(() => {
    if (!shop) return { isOpen: false, canAcceptOrders: false, statusText: 'CLOSED', reason: 'No shop data' };
    
    // Use unified status from backend if available, otherwise calculate
    if (shop.unifiedStatus) {
      return shop.unifiedStatus;
    }
    
    // Fallback calculation using frontend utility
    return calculateUnifiedShopStatus(shop);
  }, [shop]);

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
  
  console.log('🏪 SHOP ORDER PAGE - Unified Status:', {
    shopName: shop.name,
    isOnline: shop.isOnline, 
    unifiedStatus,
    canAcceptOrders: unifiedStatus.canAcceptOrders
  });

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
              <Badge variant={unifiedStatus.isOpen ? 'default' : 'secondary'} className="bg-white/90 text-rich-black">
                {unifiedStatus.statusText}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-rich-black text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <button
                  onClick={() => window.open(shop.google_maps_link || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`, '_blank')}
                  className="truncate hover:text-blue-600 hover:underline transition-colors duration-200 text-left"
                  data-testid="address-button"
                  title="View on Google Maps"
                >
                  {shop.address}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <button
                  onClick={() => window.location.href = `tel:${shop.phone}`}
                  className="hover:text-blue-600 hover:underline transition-colors duration-200"
                  data-testid="phone-button"
                  title="Call this number"
                >
                  {shop.phone}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="max-w-4xl mx-auto p-6">
        {!unifiedStatus.canAcceptOrders && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-5 h-5" />
                <p>{unifiedStatus.reason}. Orders are currently not being accepted.</p>
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
                          <Input 
                            placeholder="10-digit phone number" 
                            {...field}
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            onInput={(e) => {
                              // Allow only numeric characters and limit to 10 digits
                              const target = e.target as HTMLInputElement;
                              const value = target.value.replace(/[^0-9]/g, '').slice(0, 10);
                              target.value = value;
                              field.onChange(value);
                            }}
                            data-testid="input-contact-number"
                          />
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
                          Walk-in Order {!unifiedStatus.canAcceptOrders && '(Closed)'}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload" className="mt-4">
                        <EnhancedFileUpload
                          files={selectedFiles}
                          onFilesChange={setSelectedFiles}
                          isUploading={createOrderMutation.isPending}
                          disabled={createOrderMutation.isPending}
                          maxFiles={200}
                          acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.ppt', '.pptx', '.xls', '.xlsx']}
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
                          maxFiles={200}
                          acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.ppt', '.pptx', '.xls', '.xlsx']}
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

                {/* Upload Progress Display */}
                {uploadProgress && (
                  <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uploading Files...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-brand-yellow h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Current: {uploadProgress.currentFile}</span>
                      <span className="font-bold text-brand-yellow">
                        🚀 {uploadProgress.uploadSpeed > 0 ? `${(uploadProgress.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s` : 'Starting...'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {(uploadProgress.bytesUploaded / (1024 * 1024)).toFixed(1)} MB / {(uploadProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                      {uploadProgress.estimatedTime > 0 && (
                        <span> • ETA: {uploadProgress.estimatedTime}s</span>
                      )}
                    </div>
                  </div>
                )}

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
                        <span>
                          Uploading: {uploadProgress.progress}%
                        </span>
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