import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store, User, Settings, CheckCircle, ArrowRight, XCircle,
  Plus, Clock, Phone, Mail, MapPin, Briefcase, Globe, Lock, CheckCircle2
} from 'lucide-react';

const applicationSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Shop name is required'),
  publicName: z.string().min(1, 'Public name is required'), // Mandatory for customer chat
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().min(1, 'Public contact number is required'), // Mandatory for customer calls
  shopSlug: z.string().min(1, 'Shop slug is required'),
  
  // Contact Details - Internal information and login credentials
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Enter valid email'),
  ownerContactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid owner contact number'), // Renamed from phoneNumber
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(1, 'Pin code is required'),
  
  // Business Details
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  servicesOffered: z.array(z.string()).min(1, 'Select at least one service'),
  customServices: z.array(z.string()).max(10, 'Maximum 10 custom services allowed').optional(),
  equipmentAvailable: z.array(z.string()).min(1, 'Select at least one equipment'),
  customEquipment: z.array(z.string()).max(10, 'Maximum 10 custom equipment allowed').optional(),
  
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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ApplicationForm = z.infer<typeof applicationSchema>;

const serviceOptions = [
  'Color Printing', 'B&W Printing', 'Photocopying', 'Scanning', 'Binding', 'Lamination',
  'ID Card Printing', 'Photo Printing', 'Banner Printing', 'T-Shirt Printing', 'Mug Printing',
];

const equipmentOptions = [
  'HP LaserJet Pro', 'Canon ImageRunner', 'Xerox WorkCentre', 'Epson EcoTank', 'Brother MFC',
  'Binding Machine', 'Lamination Machine', 'Large Format Printer', 'ID Card Printer', 'Heat Press Machine',
];

const defaultWorkingHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '18:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

const dayNames = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface SimpleShopApplicationProps {
  onComplete?: () => void;
}

export default function SimpleShopApplication() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      publicShopName: '',
      publicName: '',
      publicAddress: '',
      publicContactNumber: '',
      shopSlug: '',
      ownerFullName: '',
      email: '',
      ownerContactNumber: '',
      password: '',
      confirmPassword: '',
      city: '',
      state: '',
      pinCode: '',
      yearsOfExperience: '',
      servicesOffered: [],
      customServices: [],
      equipmentAvailable: [],
      customEquipment: [],
      workingHours: defaultWorkingHours,
      acceptsWalkinOrders: true,
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      // Generate unique shop slug
      const baseSlug = data.publicShopName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      let shopSlug = baseSlug;
      let counter = 1;
      
      // Check slug availability
      while (true) {
        const response = await fetch(`/api/shops/check-slug/${shopSlug}`);
        const { available } = await response.json();
        if (available) break;
        shopSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const applicationData = {
        publicShopName: data.publicShopName,
        publicOwnerName: data.publicName,
        publicAddress: data.publicAddress,
        publicContactNumber: data.publicContactNumber,
        internalShopName: data.publicShopName, // Use public name for internal name since removed
        ownerFullName: data.ownerFullName,
        email: data.email,
        phoneNumber: data.ownerContactNumber,
        password: data.password,

        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        yearsOfExperience: data.yearsOfExperience,
        services: [...data.servicesOffered, ...(data.customServices?.filter(Boolean) || [])],
        customServices: data.customServices?.filter(Boolean) || [],
        equipment: [...data.equipmentAvailable, ...(data.customEquipment?.filter(Boolean) || [])],
        customEquipment: data.customEquipment?.filter(Boolean) || [],
        workingHours: data.workingHours,
        acceptsWalkinOrders: data.acceptsWalkinOrders,
        shopSlug,
      };

      const response = await fetch('/api/shop-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted Successfully!',
        description: 'Your shop application has been submitted for review. You will be notified once approved.',
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const onSubmit = (data: ApplicationForm) => {
    submitApplication.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-rich-black" />
          </div>
          <h1 className="text-4xl font-bold text-rich-black mb-2">Apply for Your Print Shop</h1>
          <p className="text-xl text-medium-gray">Join the PrintEasy network and grow your business</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-brand-yellow text-rich-black">
            <CardTitle className="text-2xl text-center">Shop Application Form</CardTitle>
            <p className="text-center text-rich-black/80">Complete all sections to submit your application</p>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Public Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Globe className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-semibold text-rich-black">Public Information</h3>
                    <span className="text-sm text-medium-gray">(Visible to customers)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="publicShopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your shop name" {...field} />
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
                          <FormLabel>Public Name * (for customer chat)</FormLabel>
                          <FormControl>
                            <Input placeholder="Name customers will see (e.g., Mr. Sharma)" {...field} />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="publicContactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Contact Number * (for customer calls)</FormLabel>
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
                          <FormLabel>Shop Slug * (URL identifier)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="e.g., quick-print-solutions" 
                                {...field}
                                onChange={async (e) => {
                                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                  field.onChange(slug);
                                  
                                  if (slug) {
                                    setCheckingSlug(true);
                                    try {
                                      const response = await fetch(`/api/shops/check-slug/${slug}`);
                                      const { available } = await response.json();
                                      setSlugAvailable(available);
                                    } catch (error) {
                                      setSlugAvailable(null);
                                    } finally {
                                      setCheckingSlug(false);
                                    }
                                  } else {
                                    setSlugAvailable(null);
                                  }
                                }}
                              />
                              {checkingSlug && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {!checkingSlug && slugAvailable !== null && field.value && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {slugAvailable ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {slugAvailable === false && (
                            <p className="text-sm text-red-500">This slug is already taken</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Lock className="w-6 h-6 text-red-500" />
                    <h3 className="text-xl font-semibold text-rich-black">Contact Details</h3>
                    <span className="text-sm text-medium-gray">(Internal information and login credentials)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>

                {/* Business Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Briefcase className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-semibold text-rich-black">Business Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select years of experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...Array(30)].map((_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {i + 1} {i === 0 ? 'year' : 'years'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servicesOffered"
                    render={() => (
                      <FormItem>
                        <FormLabel>Services Offered * (Select all that apply)</FormLabel>
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
                            <FormLabel className="text-sm font-medium">Custom Services (up to 10)</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (customServices.length < 10) {
                                  const newServices = [...customServices, ''];
                                  setCustomServices(newServices);
                                  form.setValue('customServices', newServices);
                                }
                              }}
                              disabled={customServices.length >= 10}
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
                                ×
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
                        <FormLabel>Equipment Available * (Select all that apply)</FormLabel>
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
                            <FormLabel className="text-sm font-medium">Custom Equipment (up to 10)</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (customEquipment.length < 10) {
                                  const newEquipment = [...customEquipment, ''];
                                  setCustomEquipment(newEquipment);
                                  form.setValue('customEquipment', newEquipment);
                                }
                              }}
                              disabled={customEquipment.length >= 10}
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
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Working Hours Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Clock className="w-6 h-6 text-purple-500" />
                    <h3 className="text-xl font-semibold text-rich-black">Working Hours</h3>
                  </div>

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
                </div>

                {/* Settings Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <Settings className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-rich-black">Shop Settings</h3>
                  </div>

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
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <Button
                    type="submit"
                    disabled={submitApplication.isPending}
                    className="bg-brand-yellow text-rich-black hover:bg-yellow-500 px-12 py-3 text-lg"
                  >
                    {submitApplication.isPending ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-rich-black border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}