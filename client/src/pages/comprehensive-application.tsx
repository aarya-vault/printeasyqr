import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Store, User, Mail, Phone, MapPin, 
  Clock, Briefcase, Settings, CheckCircle, Loader2, Plus, X, AlertCircle, Check
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form validation schema
const applicationSchema = z.object({
  // Public Information
  publicShopName: z.string()
    .min(2, 'Shop name must be at least 2 characters')
    .max(50, 'Shop name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s&.-]+$/, 'Shop name can only contain letters, numbers, spaces, &, ., and -'),
  publicOwnerName: z.string().optional(),
  publicAddress: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  publicContactNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number (starting with 6-9)'),
  
  // Shop URL/Slug
  shopSlug: z.string()
    .min(3, 'Shop URL must be at least 3 characters')
    .max(30, 'Shop URL must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Shop URL can only contain lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Shop URL cannot start or end with hyphens')
    .refine((slug) => !slug.includes('--'), 'Shop URL cannot contain consecutive hyphens'),
  
  // Internal Information
  internalShopName: z.string()
    .min(2, 'Internal shop name must be at least 2 characters')
    .max(50, 'Internal shop name must be less than 50 characters'),
  ownerFullName: z.string()
    .min(2, 'Owner name must be at least 2 characters')
    .max(50, 'Owner name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Owner name can only contain letters and spaces'),
  email: z.string()
    .email('Enter valid email address')
    .max(100, 'Email must be less than 100 characters'),
  phoneNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number (starting with 6-9)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  completeAddress: z.string()
    .min(20, 'Complete address must be at least 20 characters')
    .max(300, 'Complete address must be less than 300 characters'),
  
  // Location
  pinCode: z.string()
    .regex(/^\d{6}$/, 'Enter valid 6-digit PIN code'),
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters'),
  state: z.string()
    .min(2, 'State name must be at least 2 characters')
    .max(50, 'State name cannot exceed 50 characters'),
  
  // Business Details
  services: z.array(z.string()).min(1, 'Select at least one service'),
  customServices: z.array(z.string()).max(10, 'Maximum 10 custom services allowed').optional().default([]),
  equipment: z.array(z.string()).optional().default([]), // Equipment is now optional
  customEquipment: z.array(z.string()).max(10, 'Maximum 10 custom equipment allowed').optional().default([]),
  formationYear: z.string()
    .regex(/^\d{4}$/, 'Enter valid 4-digit year')
    .refine(
      (year) => {
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(year);
        return yearNum >= 1950 && yearNum <= currentYear;
      },
      `Formation year must be between 1950 and ${new Date().getFullYear()}`
    ),
  
  // Working Hours
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean().default(false) }),
  }),
  
  // Settings
  acceptsWalkinOrders: z.boolean(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, title: 'Basic Information', icon: Store },
  { id: 2, title: 'Contact Details', icon: User },
  { id: 3, title: 'Business Details', icon: Briefcase },
  { id: 4, title: 'Working Hours', icon: Clock },
  { id: 5, title: 'Final Settings', icon: Settings },
];

const services = [
  'Document Printing', 'Photo Printing', 'Business Cards', 'Brochures',
  'Banners & Posters', 'Binding & Lamination', 'Scanning', 'Photocopying',
  'ID Card Printing', 'Wedding Cards', 'T-Shirt Printing', 'Book Printing'
];

const equipment = [
  'Color Printer', 'Black & White Printer', 'Large Format Printer',
  'Binding Machine', 'Lamination Machine', 'Scanner', 'Photocopier',
  'Cutting Machine', 'Folding Machine', 'Digital Press'
];

export default function ComprehensiveApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customEquipmentInput, setCustomEquipmentInput] = useState('');
  const [slugAvailability, setSlugAvailability] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      publicShopName: '',
      publicOwnerName: '',
      publicAddress: '',
      publicContactNumber: '',
      shopSlug: '',
      internalShopName: '',
      ownerFullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      completeAddress: '',
      pinCode: '',
      city: '',
      state: '',
      services: [],
      customServices: [],
      equipment: [],
      customEquipment: [],
      formationYear: '',
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        tuesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        wednesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        thursday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        friday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        saturday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
        sunday: { open: '10:00', close: '16:00', closed: true, is24Hours: false },
      },
      acceptsWalkinOrders: true,
    },
  });

  // Debounced slug availability checker
  const checkSlugAvailability = useCallback(
    debounce(async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugAvailability({ status: 'idle' });
        return;
      }

      setSlugAvailability({ status: 'checking' });
      
      try {
        const response = await fetch(`/api/shops/check-slug/${encodeURIComponent(slug)}`);
        const result = await response.json();
        
        if (result.available) {
          setSlugAvailability({ 
            status: 'available', 
            message: 'This shop URL is available!' 
          });
        } else {
          setSlugAvailability({ 
            status: 'taken', 
            message: 'This shop URL is already taken. Please choose another.' 
          });
        }
      } catch (error) {
        setSlugAvailability({ 
          status: 'error', 
          message: 'Unable to check availability. Please try again.' 
        });
      }
    }, 500),
    []
  );

  // Auto-generate slug from shop name
  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.substring(0, 10);
  };

  // Format PIN code
  const formatPinCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.substring(0, 6);
  };

  // Format formation year
  const formatFormationYear = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.substring(0, 4);
  };

  const onSubmit = async (data: ApplicationForm) => {
    setIsSubmitting(true);
    try {
      // Check final slug availability before submission
      if (slugAvailability.status === 'taken') {
        toast({
          variant: 'destructive',
          title: 'Shop URL Not Available',
          description: 'Please choose a different shop URL.',
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/shop-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      toast({
        title: 'Application Submitted Successfully!',
        description: 'Your shop application has been submitted for review. You will receive an email confirmation shortly.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (service: string) => {
    const currentServices = form.getValues('services');
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    form.setValue('services', updatedServices);
  };

  const handleEquipmentToggle = (equip: string) => {
    const currentEquipment = form.getValues('equipment');
    const updatedEquipment = currentEquipment.includes(equip)
      ? currentEquipment.filter(e => e !== equip)
      : [...currentEquipment, equip];
    form.setValue('equipment', updatedEquipment);
  };

  const addCustomService = () => {
    if (customServiceInput.trim() && form.getValues('customServices')?.length < 10) {
      const currentCustomServices = form.getValues('customServices') || [];
      if (!currentCustomServices.includes(customServiceInput.trim())) {
        form.setValue('customServices', [...currentCustomServices, customServiceInput.trim()]);
        setCustomServiceInput('');
      }
    }
  };

  const removeCustomService = (service: string) => {
    const currentCustomServices = form.getValues('customServices') || [];
    form.setValue('customServices', currentCustomServices.filter(s => s !== service));
  };

  const addCustomEquipment = () => {
    if (customEquipmentInput.trim() && form.getValues('customEquipment')?.length < 10) {
      const currentCustomEquipment = form.getValues('customEquipment') || [];
      if (!currentCustomEquipment.includes(customEquipmentInput.trim())) {
        form.setValue('customEquipment', [...currentCustomEquipment, customEquipmentInput.trim()]);
        setCustomEquipmentInput('');
      }
    }
  };

  const removeCustomEquipment = (equipment: string) => {
    const currentCustomEquipment = form.getValues('customEquipment') || [];
    form.setValue('customEquipment', currentCustomEquipment.filter(e => e !== equipment));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Store className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-rich-black mb-2">Basic Information</h2>
              <p className="text-medium-gray">Tell us about your print shop</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="publicShopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Shop Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="How customers will see your shop" {...field} />
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
                    <FormLabel>Public Owner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Owner name for customers (optional)" {...field} />
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
                      placeholder="Address visible to customers"
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
                  <FormLabel>Public Contact Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="10-digit mobile number (e.g., 9876543210)" 
                      value={field.value}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shop URL/Slug Field */}
            <FormField
              control={form.control}
              name="shopSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop URL (Slug) *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                          printease.com/shop/
                        </span>
                        <Input 
                          placeholder="your-shop-name"
                          className="rounded-l-none"
                          value={field.value}
                          onChange={(e) => {
                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            field.onChange(slug);
                            checkSlugAvailability(slug);
                          }}
                          onBlur={() => {
                            if (!field.value && form.getValues('publicShopName')) {
                              const generatedSlug = generateSlugFromName(form.getValues('publicShopName'));
                              field.onChange(generatedSlug);
                              checkSlugAvailability(generatedSlug);
                            }
                          }}
                        />
                      </div>
                      
                      {/* Slug availability indicator */}
                      {slugAvailability.status !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm ${
                          slugAvailability.status === 'available' ? 'text-green-600' :
                          slugAvailability.status === 'taken' ? 'text-red-600' :
                          slugAvailability.status === 'checking' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {slugAvailability.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                          {slugAvailability.status === 'available' && <Check className="w-4 h-4" />}
                          {slugAvailability.status === 'taken' && <AlertCircle className="w-4 h-4" />}
                          {slugAvailability.status === 'error' && <AlertCircle className="w-4 h-4" />}
                          {slugAvailability.message}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        This will be your shop's unique URL. Only lowercase letters, numbers, and hyphens allowed.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-rich-black mb-2">Contact Details</h2>
              <p className="text-medium-gray">Internal information and login credentials</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Login Credentials</h3>
              <p className="text-sm text-yellow-700">
                These will be your login credentials for the shop owner dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your login email" {...field} />
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
                    <FormLabel>Phone Number * (Login Username)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="10-digit mobile number (e.g., 9876543210)" 
                        value={field.value}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={10}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">This will be your username for login</p>
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
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Minimum 8 characters with uppercase, lowercase & number" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Must contain at least one uppercase letter, one lowercase letter, and one number
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complete Business Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full address with street, area, landmarks, city, state (minimum 20 characters)"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Include all details like building name, street, area, landmarks
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pinCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Code * (Auto-fetches city & state)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="6-digit PIN code (e.g., 560001)" 
                      value={field.value}
                      onChange={async (e) => {
                        const formatted = formatPinCode(e.target.value);
                        field.onChange(formatted);
                        
                        // Auto-fetch city and state when PIN code is complete
                        if (formatted.length === 6) {
                          try {
                            const response = await fetch(`/api/pincode/lookup/${formatted}`);
                            const result = await response.json();
                            
                            if (result.success && result.data) {
                              // Auto-populate city and state
                              form.setValue('city', result.data.city);
                              form.setValue('state', result.data.state);
                              
                              toast({
                                title: "Location Found",
                                description: `${result.data.city}, ${result.data.state}`,
                                duration: 3000,
                              });
                            } else {
                              toast({
                                title: "PIN Code Not Found",
                                description: "Please verify the PIN code",
                                variant: "destructive",
                                duration: 3000,
                              });
                            }
                          } catch (error) {
                            console.error('PIN code lookup failed:', error);
                          }
                        }
                      }}
                      maxLength={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Auto-populated City and State fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City * (Auto-filled from PIN)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City will be auto-filled" 
                        {...field}
                        className="bg-gray-50"
                        readOnly
                      />
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
                    <FormLabel>State * (Auto-filled from PIN)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="State will be auto-filled" 
                        {...field}
                        className="bg-gray-50"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Briefcase className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-rich-black mb-2">Business Details</h2>
              <p className="text-medium-gray">Tell us about your services and experience</p>
            </div>

            <FormField
              control={form.control}
              name="formationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formation Year *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={`4-digit year (e.g., ${new Date().getFullYear() - 10})`}
                      value={field.value}
                      onChange={(e) => {
                        const formatted = formatFormationYear(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={4}
                    />
                  </FormControl>
                  {field.value && field.value.length === 4 && (
                    <p className="text-xs text-green-600">
                      Years of Experience: {new Date().getFullYear() - parseInt(field.value)} years
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services Offered * (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {services.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={field.value.includes(service)}
                          onCheckedChange={() => handleServiceToggle(service)}
                        />
                        <label htmlFor={service} className="text-sm">{service}</label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Custom Services Section */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add custom service (max 10)"
                        value={customServiceInput}
                        onChange={(e) => setCustomServiceInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                        disabled={form.watch('customServices')?.length >= 10}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCustomService}
                        disabled={!customServiceInput.trim() || form.watch('customServices')?.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.watch('customServices')?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.watch('customServices')?.map((service: string) => (
                          <Badge key={service} variant="secondary" className="flex items-center gap-1">
                            {service}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeCustomService(service)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Custom services added: {form.watch('customServices')?.length || 0}/10
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Available (Optional - Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {equipment.map((equip) => (
                      <div key={equip} className="flex items-center space-x-2">
                        <Checkbox
                          id={equip}
                          checked={field.value?.includes(equip) || false}
                          onCheckedChange={() => handleEquipmentToggle(equip)}
                        />
                        <label htmlFor={equip} className="text-sm">{equip}</label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Custom Equipment Section */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add custom equipment (max 10)"
                        value={customEquipmentInput}
                        onChange={(e) => setCustomEquipmentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
                        disabled={form.watch('customEquipment')?.length >= 10}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCustomEquipment}
                        disabled={!customEquipmentInput.trim() || form.watch('customEquipment')?.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.watch('customEquipment')?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.watch('customEquipment')?.map((equipment: string) => (
                          <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                            {equipment}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeCustomEquipment(equipment)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Custom equipment added: {form.watch('customEquipment')?.length || 0}/10
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Clock className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-rich-black mb-2">Working Hours</h2>
              <p className="text-medium-gray">Set your shop operating hours</p>
            </div>

            <div className="space-y-4">
              {Object.entries(form.watch('workingHours')).map(([day, hours]) => (
                <div key={day} className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 font-medium capitalize">{day}</div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={hours.closed}
                            onCheckedChange={(checked) => {
                              form.setValue(`workingHours.${day}.closed` as any, !!checked);
                              if (checked) {
                                form.setValue(`workingHours.${day}.is24Hours` as any, false);
                              }
                            }}
                          />
                          <label className="text-sm">Closed</label>
                        </div>
                        {!hours.closed && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={hours.is24Hours}
                              onCheckedChange={(checked) => {
                                form.setValue(`workingHours.${day}.is24Hours` as any, !!checked);
                                if (checked) {
                                  form.setValue(`workingHours.${day}.open` as any, '00:00');
                                  form.setValue(`workingHours.${day}.close` as any, '23:59');
                                }
                              }}
                            />
                            <label className="text-sm text-brand-yellow font-medium">24/7</label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!hours.closed && !hours.is24Hours && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => {
                            form.setValue(`workingHours.${day}.open` as any, e.target.value);
                          }}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => {
                            form.setValue(`workingHours.${day}.close` as any, e.target.value);
                          }}
                          className="w-32"
                        />
                      </div>
                    )}
                    
                    {!hours.closed && hours.is24Hours && (
                      <div className="flex items-center text-brand-yellow font-medium">
                        <Badge variant="outline" className="border-brand-yellow text-brand-yellow">
                          Open 24 Hours
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-rich-black mb-2">Final Settings</h2>
              <p className="text-medium-gray">Configure your shop preferences</p>
            </div>

            <FormField
              control={form.control}
              name="acceptsWalkinOrders"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-6 border rounded-md">
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

            <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
              <h3 className="font-medium text-blue-800 mb-4">Application Summary</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Public Shop Name:</strong> {form.watch('publicShopName')}</p>
                <p><strong>Owner:</strong> {form.watch('ownerFullName')}</p>
                <p><strong>Email:</strong> {form.watch('email')}</p>
                <p><strong>Pin Code:</strong> {form.watch('pinCode')}</p>
                <p><strong>Formation Year:</strong> {form.watch('formationYear')} ({form.watch('formationYear') ? new Date().getFullYear() - parseInt(form.watch('formationYear')) : 0} years experience)</p>
                <p><strong>Services:</strong> {form.watch('services').length} selected + {form.watch('customServices')?.length || 0} custom</p>
                <p><strong>Equipment:</strong> {form.watch('equipment')?.length || 0} selected + {form.watch('customEquipment')?.length || 0} custom</p>
                <p><strong>Walk-in Orders:</strong> {form.watch('acceptsWalkinOrders') ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Store className="w-6 h-6 text-brand-yellow" />
              <span className="text-xl font-bold text-rich-black">Shop Application</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-brand-yellow text-rich-black' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${isActive ? 'text-rich-black' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-8 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>

                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500 flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500 flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}