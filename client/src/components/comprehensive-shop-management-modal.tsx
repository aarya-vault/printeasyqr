import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Settings, Clock, MapPin, Phone, Mail, User, Shield, 
  Save, X, AlertTriangle, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const shopEditSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  slug: z.string().min(1, 'Shop slug is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(6, 'Valid pin code required'),
  description: z.string().optional(),
  isOnline: z.boolean(),
  isApproved: z.boolean(),
  acceptsWalkinOrders: z.boolean(),
});

type ShopEditForm = z.infer<typeof shopEditSchema>;

interface ComprehensiveShopManagementModalProps {
  shop: any;
  onClose: () => void;
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export default function ComprehensiveShopManagementModal({ 
  shop, 
  onClose, 
  onUpdate 
}: ComprehensiveShopManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [workingHours, setWorkingHours] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch complete shop details with all data
  const { data: completeShop, isLoading } = useQuery({
    queryKey: [`/api/admin/shops/${shop.id}/complete`],
    enabled: !!shop.id,
  });

  const form = useForm<ShopEditForm>({
    resolver: zodResolver(shopEditSchema),
    defaultValues: {
      name: shop.name || '',
      slug: shop.slug || '',
      ownerName: shop.ownerName || '',
      contactNumber: shop.contactNumber || '',
      email: shop.email || '',
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      pinCode: shop.pinCode || '',
      description: shop.description || '',
      isOnline: shop.isOnline || false,
      isApproved: shop.isApproved || false,
      acceptsWalkinOrders: shop.acceptsWalkinOrders || false,
    },
  });

  // Initialize working hours from shop data
  useEffect(() => {
    if (completeShop?.workingHours) {
      setWorkingHours(completeShop.workingHours);
    } else {
      // Initialize default working hours
      const defaultHours: Record<string, any> = {};
      DAYS_OF_WEEK.forEach(day => {
        defaultHours[day] = { open: '09:00', close: '18:00', closed: false };
      });
      setWorkingHours(defaultHours);
    }
  }, [completeShop]);

  const updateShop = useMutation({
    mutationFn: async (data: ShopEditForm & { workingHours: any }) => {
      return await apiRequest(`/api/admin/shops/${shop.id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'Shop Updated Successfully!',
        description: 'All shop details have been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setWorkingHours((prev: Record<string, any>) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const onSubmit = (data: ShopEditForm) => {
    updateShop.mutate({ ...data, workingHours });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-4 text-center">Loading complete shop details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="bg-brand-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-rich-black" />
            <h2 className="text-xl font-bold text-rich-black">
              Comprehensive Shop Management: {shop.name}
            </h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-rich-black hover:bg-rich-black/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="business">Business Details</TabsTrigger>
                <TabsTrigger value="hours">Working Hours</TabsTrigger>
                <TabsTrigger value="admin">Admin Controls</TabsTrigger>
              </TabsList>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Store className="w-5 h-5" />
                        <span>Shop Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shop Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter shop name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shop URL Slug *</FormLabel>
                              <FormControl>
                                <Input placeholder="shop-url-slug" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shop Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your printing services..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5" />
                        <span>Location Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complete Address *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter complete shop address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pinCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pin Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="Pin Code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Details Tab */}
                <TabsContent value="business" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Owner Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter owner's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
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

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="owner@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Update Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Leave blank to keep current password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Working Hours Tab */}
                <TabsContent value="hours" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Weekly Schedule</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {DAYS_OF_WEEK.map((day) => {
                        const hours = workingHours[day] || { open: '09:00', close: '18:00', closed: false, is24Hours: false };
                        
                        return (
                          <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="w-24 font-medium capitalize">
                              {day}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={!hours.closed}
                                onCheckedChange={(checked) => 
                                  handleWorkingHoursChange(day, 'closed', !checked)
                                }
                                className="data-[state=checked]:bg-brand-yellow"
                              />
                              <span className="text-sm w-12">
                                {hours.closed ? 'Closed' : 'Open'}
                              </span>
                            </div>

                            {!hours.closed && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={hours.is24Hours || false}
                                    onCheckedChange={(checked) => {
                                      handleWorkingHoursChange(day, 'is24Hours', checked);
                                      if (checked) {
                                        handleWorkingHoursChange(day, 'open', '00:00');
                                        handleWorkingHoursChange(day, 'close', '23:59');
                                      }
                                    }}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                  <span className="text-sm font-medium text-green-600">24/7</span>
                                </div>
                                
                                {hours.is24Hours ? (
                                  <Badge className="bg-green-500 text-white font-bold">
                                    Open 24 Hours
                                  </Badge>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="time"
                                      value={hours.open}
                                      onChange={(e) => 
                                        handleWorkingHoursChange(day, 'open', e.target.value)
                                      }
                                      className="w-32"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <Input
                                      type="time"
                                      value={hours.close}
                                      onChange={(e) => 
                                        handleWorkingHoursChange(day, 'close', e.target.value)
                                      }
                                      className="w-32"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Admin Controls Tab */}
                <TabsContent value="admin" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>Shop Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Shop Online Status</label>
                            <p className="text-sm text-gray-500">Visible to customers</p>
                          </div>
                          <FormField
                            control={form.control}
                            name="isOnline"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Admin Approval</label>
                            <p className="text-sm text-gray-500">Shop is approved</p>
                          </div>
                          <FormField
                            control={form.control}
                            name="isApproved"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium">Walk-in Orders</label>
                            <p className="text-sm text-gray-500">Accept walk-in orders</p>
                          </div>
                          <FormField
                            control={form.control}
                            name="acceptsWalkinOrders"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {completeShop && (
                        <div className="pt-4 space-y-2 text-sm text-gray-600">
                          <p><strong>Shop ID:</strong> {completeShop.id}</p>
                          <p><strong>Created:</strong> {new Date(completeShop.createdAt).toLocaleString()}</p>
                          <p><strong>Last Updated:</strong> {new Date(completeShop.updatedAt).toLocaleString()}</p>
                          <p><strong>Total Orders:</strong> {completeShop.totalOrders || 0}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateShop.isPending}
                    className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                  >
                    {updateShop.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {updateShop.isPending ? 'Saving...' : 'Save All Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}