import React, { useState } from 'react';
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
import { 
  Store, User, Settings, CheckCircle, ArrowLeft, ArrowRight, 
  Plus, Clock, Phone, Mail, MapPin, Briefcase
} from 'lucide-react';

// Multi-step form schemas
const shopInfoSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  shopAddress: z.string().min(1, 'Shop address is required'),
  shopPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone number'),
});

const ownerInfoSchema = z.object({
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  ownerPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone number'),
  email: z.string().email('Enter valid email address'),
  experience: z.string().min(1, 'Experience description is required'),
});

const servicesSchema = z.object({
  services: z.array(z.string()).min(1, 'Select at least one service'),
  equipment: z.array(z.string()).min(1, 'Select at least one equipment'),
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }),
});

const finalApplicationSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Public shop name is required'),
  publicOwnerName: z.string().optional(),
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().optional(),
  
  // Internal Details
  internalShopName: z.string().min(1, 'Internal shop name is required'),
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Enter valid email'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  completeAddress: z.string().min(1, 'Complete address is required'),
  
  // Additional Info
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  servicesOffered: z.string().min(1, 'Services offered description is required'),
  equipmentAvailable: z.string().min(1, 'Equipment available description is required'),
  
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

type ShopInfoForm = z.infer<typeof shopInfoSchema>;
type OwnerInfoForm = z.infer<typeof ownerInfoSchema>;
type ServicesForm = z.infer<typeof servicesSchema>;
type FinalApplicationForm = z.infer<typeof finalApplicationSchema>;

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

interface ComprehensiveShopApplicationProps {
  onComplete?: () => void;
}

export default function ComprehensiveShopApplication({ onComplete }: ComprehensiveShopApplicationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [shopInfoData, setShopInfoData] = useState<ShopInfoForm | null>(null);
  const [ownerInfoData, setOwnerInfoData] = useState<OwnerInfoForm | null>(null);
  const [servicesData, setServicesData] = useState<ServicesForm | null>(null);
  const [customService, setCustomService] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const steps = [
    { title: 'Shop Information', icon: Store },
    { title: 'Owner Information', icon: User },
    { title: 'Services & Equipment', icon: Settings },
    { title: 'Application Form', icon: CheckCircle },
  ];

  // Step 1: Shop Information Form
  const shopForm = useForm<ShopInfoForm>({
    resolver: zodResolver(shopInfoSchema),
    defaultValues: {
      shopName: '',
      shopAddress: '',
      shopPhone: '',
    },
  });

  // Step 2: Owner Information Form
  const ownerForm = useForm<OwnerInfoForm>({
    resolver: zodResolver(ownerInfoSchema),
    defaultValues: {
      ownerFullName: '',
      ownerPhone: '',
      email: '',
      experience: '',
    },
  });

  // Step 3: Services & Equipment Form
  const servicesForm = useForm<ServicesForm>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      services: [],
      equipment: [],
      workingHours: defaultWorkingHours,
    },
  });

  // Step 4: Final Application Form
  const finalForm = useForm<FinalApplicationForm>({
    resolver: zodResolver(finalApplicationSchema),
    defaultValues: {
      publicShopName: '',
      publicOwnerName: '',
      publicAddress: '',
      publicContactNumber: '',
      internalShopName: '',
      ownerFullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      completeAddress: '',
      yearsOfExperience: '',
      servicesOffered: '',
      equipmentAvailable: '',
      workingHours: defaultWorkingHours,
      acceptsWalkinOrders: true,
    },
  });

  // Submit application mutation
  const submitApplication = useMutation({
    mutationFn: async (data: FinalApplicationForm) => {
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
        // Map form data to database schema
        publicShopName: data.publicShopName,
        publicOwnerName: data.publicOwnerName || '',
        publicAddress: data.publicAddress,
        publicContactNumber: data.publicContactNumber || '',
        internalShopName: data.internalShopName,
        ownerFullName: data.ownerFullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        completeAddress: data.completeAddress,
        city: 'Ahmedabad', // Default city from screenshots
        state: 'Gujarat', // Default state
        pinCode: '380001', // Default pin code
        services: servicesData?.services || [],
        equipment: servicesData?.equipment || [],
        yearsOfExperience: data.yearsOfExperience,
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
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    },
  });

  const onShopInfoNext = (data: ShopInfoForm) => {
    setShopInfoData(data);
    setCurrentStep(1);
  };

  const onOwnerInfoNext = (data: OwnerInfoForm) => {
    setOwnerInfoData(data);
    setCurrentStep(2);
  };

  const onServicesNext = (data: ServicesForm) => {
    setServicesData(data);
    // Pre-fill final form with previous data
    finalForm.reset({
      ...finalForm.getValues(),
      publicShopName: shopInfoData?.shopName || '',
      publicAddress: shopInfoData?.shopAddress || '',
      publicContactNumber: shopInfoData?.shopPhone || '',
      internalShopName: shopInfoData?.shopName || '',
      ownerFullName: ownerInfoData?.ownerFullName || '',
      email: ownerInfoData?.email || '',
      phoneNumber: ownerInfoData?.ownerPhone || '',
      completeAddress: shopInfoData?.shopAddress || '',
      yearsOfExperience: ownerInfoData?.experience || '',
      servicesOffered: data.services.join(', '),
      equipmentAvailable: data.equipment.join(', '),
      workingHours: data.workingHours,
    });
    setCurrentStep(3);
  };

  const onFinalSubmit = (data: FinalApplicationForm) => {
    submitApplication.mutate(data);
  };

  const addCustomService = () => {
    if (customService.trim()) {
      const currentServices = servicesForm.getValues('services');
      servicesForm.setValue('services', [...currentServices, customService.trim()]);
      setCustomService('');
    }
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim()) {
      const currentEquipment = servicesForm.getValues('equipment');
      servicesForm.setValue('equipment', [...currentEquipment, customEquipment.trim()]);
      setCustomEquipment('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                      isActive
                        ? 'bg-brand-yellow border-brand-yellow text-rich-black'
                        : isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold text-rich-black">{steps[currentStep].title}</h2>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-rich-black" />
              </div>
              <CardTitle className="text-2xl text-rich-black">Shop Information</CardTitle>
              <p className="text-medium-gray">Tell us about your print shop</p>
            </CardHeader>
            <CardContent>
              <Form {...shopForm}>
                <form onSubmit={shopForm.handleSubmit(onShopInfoNext)} className="space-y-6">
                  <FormField
                    control={shopForm.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Shop Name</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your shop name" 
                            {...field} 
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shopForm.control}
                    name="shopAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Shop Address</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter complete shop address including area, city" 
                            {...field}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <p className="text-sm text-medium-gray">Service areas: Ahmedabad & North Bangalore only</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shopForm.control}
                    name="shopPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Shop Phone Number</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                              <span className="text-medium-gray">+91</span>
                            </div>
                            <Input 
                              placeholder="Enter 10 digit number" 
                              {...field}
                              className="h-12 rounded-l-none"
                            />
                            <div className="flex items-center px-3 border border-l-0 rounded-r-md">
                              <Phone className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-rich-black" />
              </div>
              <CardTitle className="text-2xl text-rich-black">Owner Information</CardTitle>
              <p className="text-medium-gray">Your personal details</p>
            </CardHeader>
            <CardContent>
              <Form {...ownerForm}>
                <form onSubmit={ownerForm.handleSubmit(onOwnerInfoNext)} className="space-y-6">
                  <FormField
                    control={ownerForm.control}
                    name="ownerFullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Owner Full Name</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Owner Phone Number</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                              <span className="text-medium-gray">+91</span>
                            </div>
                            <Input 
                              placeholder="Enter 10 digit number" 
                              {...field}
                              className="h-12 rounded-l-none"
                            />
                            <div className="flex items-center px-3 border border-l-0 rounded-r-md">
                              <Phone className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Email Address</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 border border-r-0 rounded-l-md">
                              <Mail className="w-4 h-4 text-gray-400" />
                            </div>
                            <Input 
                              placeholder="Enter your email" 
                              {...field}
                              className="h-12 rounded-l-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Experience in Printing Business</span>
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your experience, years in business, specialties, etc." 
                            {...field}
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Steps 3 and 4 would continue with similar pattern... */}
        
      </div>
    </div>
  );
}