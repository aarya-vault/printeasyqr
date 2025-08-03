import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Clock, Users, MapPin, Phone, Mail, 
  Save, Eye, EyeOff, Briefcase, CheckCircle, AlertCircle
} from 'lucide-react';

const shopSettingsSchema = z.object({
  // Public Information
  name: z.string().min(1, 'Shop name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  publicOwnerName: z.string().optional(),
  
  // Internal Information
  internalName: z.string().min(1, 'Internal name is required'),
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Valid email is required'),
  ownerPhone: z.string().min(1, 'Owner phone is required'),
  completeAddress: z.string().min(1, 'Complete address is required'),
  
  // Business Details
  yearsOfExperience: z.string().min(1, 'Experience is required'),
  
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
  isPublic: z.boolean(),
  autoAvailability: z.boolean(),
});

type ShopSettingsForm = z.infer<typeof shopSettingsSchema>;

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  publicOwnerName?: string;
  internalName: string;
  ownerFullName: string;
  email: string;
  ownerPhone: string;
  completeAddress: string;
  yearsOfExperience: string;
  workingHours: any;
  acceptsWalkinOrders: boolean;
  isPublic: boolean;
  autoAvailability: boolean;
  isOnline: boolean;
  isApproved: boolean;
}

export default function ShopSettings() {
  const { user, isSessionVerified } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // 🔥 FIXED: Proper authentication guard
  const { data: shopResponse, isLoading } = useQuery({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: Boolean(user?.id && user?.role === 'shop_owner' && isSessionVerified),
  });

  const shop = (shopResponse as any)?.shop; // Extract shop from response

  const form = useForm<ShopSettingsForm>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      publicOwnerName: '',
      internalName: '',
      ownerFullName: '',
      email: '',
      ownerPhone: '',
      completeAddress: '',
      yearsOfExperience: '',
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
      isPublic: true,
      autoAvailability: true,
    },
  });

  // Update form when shop data loads
  React.useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name || '',
        address: shop.address || '',
        phone: shop.phone || '',
        publicOwnerName: shop.publicOwnerName || '',
        internalName: shop.internalName || '',
        ownerFullName: shop.ownerFullName || '',
        email: shop.email || '',
        ownerPhone: shop.ownerPhone || '',
        completeAddress: shop.completeAddress || '',
        yearsOfExperience: shop.yearsOfExperience || '',
        workingHours: shop.workingHours || form.getValues('workingHours'),
        acceptsWalkinOrders: shop.acceptsWalkinOrders ?? true,
        isPublic: shop.isPublic ?? true,
        autoAvailability: shop.autoAvailability ?? true,
      });
    }
  }, [shop, form]);

  // Update shop mutation
  const updateShop = useMutation({
    mutationFn: async (data: ShopSettingsForm) => {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update shop');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops/owner'] });
      setIsEditing(false);
      toast({
        title: 'Settings Updated',
        description: 'Your shop settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ShopSettingsForm) => {
    updateShop.mutate(data);
  };

  const toggleAvailability = async () => {
    if (!shop) return;
    
    try {
      const response = await fetch(`/api/shops/${shop.id}/toggle-availability`, {
        method: 'POST',
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/shops/owner'] });
        toast({
          title: shop.isOnline ? 'Shop is now Offline' : 'Shop is now Online',
          description: shop.isOnline 
            ? 'You will not receive new orders while offline.' 
            : 'You are now accepting new orders.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update availability status.',
      });
    }
  };

  const getAvailabilityStatus = () => {
    if (!shop) return { status: 'Unknown', color: 'bg-gray-500' };
    
    if (!shop.isOnline) {
      return { status: 'Offline', color: 'bg-red-500' };
    }
    
    if (shop.autoAvailability) {
      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;
      
      const dayHours = shop.workingHours?.[dayName];
      
      if (dayHours && !dayHours.closed) {
        const [openHour, openMin] = dayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
        const openTimeInMinutes = openHour * 60 + openMin;
        const closeTimeInMinutes = closeHour * 60 + closeMin;
        
        if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes) {
          return { status: 'Available', color: 'bg-green-500' };
        } else {
          return { status: 'Closed', color: 'bg-yellow-500' };
        }
      } else {
        return { status: 'Closed Today', color: 'bg-yellow-500' };
      }
    }
    
    return { status: 'Online', color: 'bg-blue-500' };
  };

  const availabilityStatus = getAvailabilityStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-rich-black mb-2">No Shop Found</h3>
        <p className="text-medium-gray">You don't have a shop associated with your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${availabilityStatus.color}`}></div>
              <div>
                <h3 className="font-semibold text-rich-black">{shop.name}</h3>
                <p className="text-sm text-medium-gray">Status: {availabilityStatus.status}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2"
              >
                {isEditing ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                <span>{isEditing ? 'Cancel Edit' : 'Edit Settings'}</span>
              </Button>
              <Button
                onClick={toggleAvailability}
                className={`${
                  shop.isOnline 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {shop.isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Working Hours</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* General Settings */}
            <TabsContent value="general">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>General Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Shop Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
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
                          <FormLabel>Public Owner Name (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} className="min-h-[80px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Contact Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
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
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working Hours */}
            <TabsContent value="hours">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Working Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="workingHours"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-4">
                          {Object.entries(field.value).map(([day, hours]) => (
                            <div key={day} className="flex items-center space-x-4 p-4 border rounded-md">
                              <div className="w-24 font-medium capitalize">{day}</div>
                              <Switch
                                checked={!hours.closed}
                                onCheckedChange={(checked) => {
                                  if (isEditing) {
                                    field.onChange({
                                      ...field.value,
                                      [day]: { ...hours, closed: !checked }
                                    });
                                  }
                                }}
                                disabled={!isEditing}
                                className="data-[state=checked]:bg-brand-yellow"
                              />
                              <span className="text-sm w-16">
                                {hours.closed ? 'Closed' : 'Open'}
                              </span>
                              {!hours.closed && (
                                <>
                                  <Input
                                    type="time"
                                    value={hours.open}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        field.onChange({
                                          ...field.value,
                                          [day]: { ...hours, open: e.target.value }
                                        });
                                      }
                                    }}
                                    disabled={!isEditing}
                                    className="w-28"
                                  />
                                  <span className="text-medium-gray">to</span>
                                  <Input
                                    type="time"
                                    value={hours.close}
                                    onChange={(e) => {
                                      if (isEditing) {
                                        field.onChange({
                                          ...field.value,
                                          [day]: { ...hours, close: e.target.value }
                                        });
                                      }
                                    }}
                                    disabled={!isEditing}
                                    className="w-28"
                                  />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Shop Preferences</span>
                  </CardTitle>
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
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-brand-yellow"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <FormLabel className="text-base font-medium">Public Visibility</FormLabel>
                          <p className="text-sm text-medium-gray">Make your shop visible to customers browsing the platform</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditing}
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
                          <p className="text-sm text-medium-gray">Automatically set availability based on working hours</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-brand-yellow"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Advanced Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="internalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Shop Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
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
                          <FormLabel>Owner Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
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
                        <FormLabel>Complete Address (Internal)</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!isEditing} className="min-h-[80px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Shop Information</span>
                    </div>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p><strong>Shop Slug:</strong> {shop.slug}</p>
                      <p><strong>Status:</strong> {shop.isApproved ? 'Approved' : 'Pending Approval'}</p>
                      <p><strong>Created:</strong> {new Date(shop.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button (only show when editing) */}
            {isEditing && (
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                  disabled={updateShop.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateShop.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </Tabs>
    </div>
  );
}