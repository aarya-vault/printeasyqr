import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Store, Clock, Globe, Lock, Settings, Save, User, 
  Phone, Mail, MapPin, Timer, Users, CheckCircle
} from 'lucide-react';

const settingsSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Shop name is required'),
  publicOwnerName: z.string().optional(),
  publicAddress: z.string().min(1, 'Address is required'),
  publicContactNumber: z.string().optional(),
  
  // Internal Information
  internalShopName: z.string().min(1, 'Internal name is required'),
  ownerFullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Valid phone is required'),
  completeAddress: z.string().min(1, 'Complete address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(6, 'Valid pin code is required'),
  
  // Working Hours
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }),
  
  // Settings
  acceptsWalkinOrders: z.boolean(),
  autoAvailability: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const dayNames = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  publicOwnerName?: string;
  internalName: string;
  ownerFullName: string;
  email: string;
  ownerPhone: string;
  completeAddress: string;
  workingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  acceptsWalkinOrders: boolean;
  autoAvailability: boolean;
  isOnline: boolean;
}

export default function ComprehensiveShopSettings() {
  const [currentAvailability, setCurrentAvailability] = useState<string>('Checking...');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get shop data
  const { data: shopData, isLoading } = useQuery<{ shop: Shop }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id,
  });

  const shop = shopData?.shop;

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      publicShopName: '',
      publicOwnerName: '',
      publicAddress: '',
      publicContactNumber: '',
      internalShopName: '',
      ownerFullName: '',
      email: '',
      phoneNumber: '',
      completeAddress: '',
      city: '',
      state: '',
      pinCode: '',
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      },
      acceptsWalkinOrders: true,
      autoAvailability: true,
    },
  });

  // Update form when shop data loads
  useEffect(() => {
    if (shop) {
      form.reset({
        publicShopName: shop.name,
        publicOwnerName: shop.publicOwnerName || '',
        publicAddress: shop.address,
        publicContactNumber: shop.phone,
        internalShopName: shop.internalName,
        ownerFullName: shop.ownerFullName,
        email: shop.email,
        phoneNumber: shop.ownerPhone,
        completeAddress: shop.completeAddress,
        city: shop.city,
        state: shop.state,
        pinCode: shop.pinCode,
        workingHours: shop.workingHours,
        acceptsWalkinOrders: shop.acceptsWalkinOrders,
        autoAvailability: shop.autoAvailability,
      });
    }
  }, [shop, form]);

  // Calculate current availability
  useEffect(() => {
    if (shop && shop.workingHours) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5);
      const todayHours = shop.workingHours[currentDay];

      if (todayHours && !todayHours.closed) {
        const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
        setCurrentAvailability(isOpen ? 'Open Now' : 'Closed Now');
      } else {
        setCurrentAvailability('Closed Today');
      }
    }
  }, [shop]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await fetch('/api/shops/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your shop settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shops/owner/current'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update shop settings. Please try again.',
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-brand-yellow" />
          <h1 className="text-3xl font-bold text-rich-black">Shop Settings</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-brand-yellow" />
          <h1 className="text-3xl font-bold text-rich-black">Shop Settings</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-black mb-2">No shop found</h3>
            <p className="text-medium-gray">Unable to load shop settings</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-brand-yellow" />
          <h1 className="text-3xl font-bold text-rich-black">Shop Settings</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={currentAvailability === 'Open Now' ? 'default' : 'secondary'}>
            {currentAvailability}
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Public Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span>Public Information</span>
              </CardTitle>
              <p className="text-sm text-medium-gray">Information visible to customers</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="publicShopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your shop name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publicOwnerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner name for customers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="publicAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Address customers will see"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publicContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact number for customers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Internal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-500" />
                <span>Internal Information</span>
              </CardTitle>
              <p className="text-sm text-medium-gray">Private business details</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="internalShopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Shop Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Internal reference name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerFullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Complete owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="completeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Full business address"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-500" />
                <span>Working Hours</span>
              </CardTitle>
              <p className="text-sm text-medium-gray">Set your shop operating hours</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {dayNames.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 font-medium">{label}</div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!form.getValues(`workingHours.${key}.closed` as any)}
                        onCheckedChange={(checked) => 
                          form.setValue(`workingHours.${key}.closed` as any, !checked)
                        }
                      />
                      <span className="text-sm">Open</span>
                    </div>
                  </div>
                  
                  {!form.getValues(`workingHours.${key}.closed` as any) && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={form.getValues(`workingHours.${key}.open` as any)}
                        onChange={(e) => form.setValue(`workingHours.${key}.open` as any, e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={form.getValues(`workingHours.${key}.close` as any)}
                        onChange={(e) => form.setValue(`workingHours.${key}.close` as any, e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shop Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <span>Shop Settings</span>
              </CardTitle>
              <p className="text-sm text-medium-gray">Configure your shop preferences</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="acceptsWalkinOrders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <FormLabel className="text-base font-medium">Accept Walk-in Orders</FormLabel>
                      <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-brand-yellow"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoAvailability"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <FormLabel className="text-base font-medium">Auto Availability</FormLabel>
                      <p className="text-sm text-medium-gray">Automatically set shop availability based on working hours</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-brand-yellow"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-brand-yellow text-rich-black hover:bg-yellow-500 flex items-center space-x-2"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-rich-black border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}