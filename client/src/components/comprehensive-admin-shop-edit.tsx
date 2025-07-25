import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, User, Settings, Globe, Lock, Briefcase, Clock, Plus, Trash2, Save
} from 'lucide-react';

const editShopSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Shop name is required'),
  publicName: z.string().min(1, 'Public name is required'),
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().min(1, 'Public contact number is required'),
  shopSlug: z.string().min(1, 'Shop slug is required'),
  
  // Contact Details
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Enter valid email'),
  ownerContactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid contact number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(1, 'Pin code is required'),
  
  // Business Details
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  servicesOffered: z.array(z.string()).min(1, 'Select at least one service'),
  customServices: z.array(z.string()).optional(),
  equipmentAvailable: z.array(z.string()).min(1, 'Select at least one equipment'),
  customEquipment: z.array(z.string()).optional(),
  
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
  adminNotes: z.string().optional(),
});

type EditShopForm = z.infer<typeof editShopSchema>;

const serviceOptions = [
  'Color Printing', 'B&W Printing', 'Photocopying', 'Scanning', 'Binding', 'Lamination',
  'ID Card Printing', 'Photo Printing', 'Banner Printing', 'T-Shirt Printing', 'Mug Printing',
];

const equipmentOptions = [
  'HP LaserJet Pro', 'Canon ImageRunner', 'Xerox WorkCentre', 'Epson EcoTank', 'Brother MFC',
  'Binding Machine', 'Lamination Machine', 'Large Format Printer', 'ID Card Printer', 'Heat Press Machine',
];

const dayNames = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface ComprehensiveAdminShopEditProps {
  application: any;
  onClose: () => void;
  onSave: () => void;
}

export default function ComprehensiveAdminShopEdit({ application, onClose, onSave }: ComprehensiveAdminShopEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customServices, setCustomServices] = useState<string[]>(application.customServices || []);
  const [customEquipment, setCustomEquipment] = useState<string[]>(application.customEquipment || []);

  const form = useForm<EditShopForm>({
    resolver: zodResolver(editShopSchema),
    defaultValues: {
      publicShopName: application.publicShopName || '',
      publicName: application.publicOwnerName || '',
      publicAddress: application.publicAddress || '',
      publicContactNumber: application.publicContactNumber || '',
      shopSlug: application.shopSlug || '',
      ownerFullName: application.ownerFullName || '',
      email: application.email || '',
      ownerContactNumber: application.phoneNumber || '',
      password: application.password || '',
      city: application.city || '',
      state: application.state || '',
      pinCode: application.pinCode || '',
      yearsOfExperience: application.yearsOfExperience || '',
      servicesOffered: application.services || [],
      customServices: application.customServices || [],
      equipmentAvailable: application.equipment || [],
      customEquipment: application.customEquipment || [],
      workingHours: application.workingHours || {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '18:00', closed: true },
      },
      acceptsWalkinOrders: application.acceptsWalkinOrders || true,
      adminNotes: application.adminNotes || '',
    },
  });

  const updateShopApplication = useMutation({
    mutationFn: async (data: EditShopForm) => {
      const updateData = {
        ...data,
        services: [...data.servicesOffered, ...(data.customServices?.filter(Boolean) || [])],
        customServices: data.customServices?.filter(Boolean) || [],
        equipment: [...data.equipmentAvailable, ...(data.customEquipment?.filter(Boolean) || [])],
        customEquipment: data.customEquipment?.filter(Boolean) || [],
      };

      const response = await fetch(`/api/admin/shop-applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Shop Application Updated Successfully!',
        description: 'All changes have been saved to the application.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const onSubmit = (data: EditShopForm) => {
    updateShopApplication.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-brand-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-rich-black" />
            <h2 className="text-xl font-bold text-rich-black">Complete Shop Application Edit</h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-rich-black hover:bg-rich-black/10">
            ×
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="public" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="public">Public Info</TabsTrigger>
                  <TabsTrigger value="internal">Internal Info</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="hours">Working Hours</TabsTrigger>
                  <TabsTrigger value="admin">Admin Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="public" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <span>Public Information</span>
                      </CardTitle>
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
                                <Input placeholder="Enter shop name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="publicName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Public Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Name customers will see" {...field} />
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
                              <Textarea placeholder="Address customers will see" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="publicContactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Public Contact Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone number customers can call" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shopSlug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shop Slug *</FormLabel>
                              <FormControl>
                                <Input placeholder="URL identifier" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="internal" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-green-500" />
                        <span>Internal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <FormField
                          control={form.control}
                          name="ownerContactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner Contact Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="10-digit phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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
                </TabsContent>

                <TabsContent value="credentials" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        <span>Login Credentials</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Login email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Login password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="business" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                        <span>Business Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="yearsOfExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 5 years" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="servicesOffered"
                        render={() => (
                          <FormItem>
                            <FormLabel>Services Offered *</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {serviceOptions.map((service) => (
                                <FormField
                                  key={service}
                                  control={form.control}
                                  name="servicesOffered"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(service)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, service])
                                              : field.onChange(
                                                  field.value?.filter((value) => value !== service)
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {service}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">Custom Services (up to 5)</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (customServices.length < 5) {
                                      const newServices = [...customServices, ''];
                                      setCustomServices(newServices);
                                      form.setValue('customServices', newServices);
                                    }
                                  }}
                                  disabled={customServices.length >= 5}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Custom Service
                                </Button>
                              </div>
                              {customServices.map((service, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input
                                    placeholder={`Custom service ${index + 1}`}
                                    value={service}
                                    onChange={(e) => {
                                      const newServices = [...customServices];
                                      newServices[index] = e.target.value;
                                      setCustomServices(newServices);
                                      form.setValue('customServices', newServices);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newServices = customServices.filter((_, i) => i !== index);
                                      setCustomServices(newServices);
                                      form.setValue('customServices', newServices);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="equipmentAvailable"
                        render={() => (
                          <FormItem>
                            <FormLabel>Equipment Available *</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {equipmentOptions.map((equipment) => (
                                <FormField
                                  key={equipment}
                                  control={form.control}
                                  name="equipmentAvailable"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(equipment)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, equipment])
                                              : field.onChange(
                                                  field.value?.filter((value) => value !== equipment)
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {equipment}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">Custom Equipment (up to 6)</FormLabel>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (customEquipment.length < 6) {
                                      const newEquipment = [...customEquipment, ''];
                                      setCustomEquipment(newEquipment);
                                      form.setValue('customEquipment', newEquipment);
                                    }
                                  }}
                                  disabled={customEquipment.length >= 6}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Custom Equipment
                                </Button>
                              </div>
                              {customEquipment.map((equipment, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input
                                    placeholder={`Custom equipment ${index + 1}`}
                                    value={equipment}
                                    onChange={(e) => {
                                      const newEquipment = [...customEquipment];
                                      newEquipment[index] = e.target.value;
                                      setCustomEquipment(newEquipment);
                                      form.setValue('customEquipment', newEquipment);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newEquipment = customEquipment.filter((_, i) => i !== index);
                                      setCustomEquipment(newEquipment);
                                      form.setValue('customEquipment', newEquipment);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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

                <TabsContent value="hours" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span>Working Hours</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dayNames.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex items-center space-x-4">
                            <div className="w-24 font-medium">{label}</div>
                            <FormField
                              control={form.control}
                              name={`workingHours.${key}.closed` as any}
                              render={({ field }) => (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={!field.value}
                                    onCheckedChange={(checked) => field.onChange(!checked)}
                                  />
                                  <span className="text-sm">Open</span>
                                </div>
                              )}
                            />
                          </div>
                          
                          {!form.watch(`workingHours.${key}.closed` as any) && (
                            <div className="flex items-center space-x-2">
                              <FormField
                                control={form.control}
                                name={`workingHours.${key}.open` as any}
                                render={({ field }) => (
                                  <Input type="time" className="w-32" {...field} />
                                )}
                              />
                              <span>to</span>
                              <FormField
                                control={form.control}
                                name={`workingHours.${key}.close` as any}
                                render={({ field }) => (
                                  <Input type="time" className="w-32" {...field} />
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <FormField
                        control={form.control}
                        name="acceptsWalkinOrders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Accept Walk-in Orders</FormLabel>
                              <div className="text-sm text-medium-gray">
                                Allow customers to place orders for immediate pickup
                              </div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="admin" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span>Admin Notes & Control</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="adminNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Internal notes about this application..."
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateShopApplication.isPending}
                  className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                >
                  {updateShopApplication.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}