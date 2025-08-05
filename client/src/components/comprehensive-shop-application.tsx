import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PhoneInput from '@/components/phone-input';
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
  equipment: z.array(z.string()).optional(), // Made optional
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
  }),
});

const finalApplicationSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Public shop name is required'),
  publicName: z.string().min(1, 'Public name is required'), // Renamed from publicOwnerName - mandatory for customer chat display
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().min(1, 'Public contact number is required'), // Made mandatory for customer calls
  
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
  servicesOffered: z.array(z.string()).min(1, 'Select at least one service'), // Changed to array for checkboxes
  customServices: z.string().optional(), // Custom services input
  equipmentAvailable: z.array(z.string()).optional(), // Made optional
  customEquipment: z.string().optional(), // Custom equipment input
  
  // Working Hours with 24/7 support
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean(), is24Hours: z.boolean() }),
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
  monday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  tuesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  wednesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  thursday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  friday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  saturday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
  sunday: { open: '10:00', close: '16:00', closed: true, is24Hours: false },
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
      publicName: '',
      publicAddress: '',
      publicContactNumber: '',
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
      customServices: '',
      equipmentAvailable: [],
      customEquipment: '',
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
        const { available } = await apiClient.get(`/api/shops/check-slug/${shopSlug}`);
        if (available) break;
        shopSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const applicationData = {
        // Map form data to database schema
        publicShopName: data.publicShopName,
        publicOwnerName: data.publicName, // Use publicName field
        publicAddress: data.publicAddress,
        publicContactNumber: data.publicContactNumber,

        ownerFullName: data.ownerFullName,
        email: data.email,
        phoneNumber: data.ownerContactNumber, // Use ownerContactNumber field
        password: data.password,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        services: servicesData?.services || [],
        equipment: servicesData?.equipment || [],
        yearsOfExperience: data.yearsOfExperience,
        servicesOffered: data.servicesOffered.concat(data.customServices ? [data.customServices] : []),
        equipmentAvailable: (data.equipmentAvailable || []).concat(data.customEquipment ? [data.customEquipment] : []),
        workingHours: data.workingHours,
        acceptsWalkinOrders: data.acceptsWalkinOrders,
        shopSlug,
      };

      return await apiClient.post('/api/shop-applications', applicationData);
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
      const currentEquipment = servicesForm.getValues('equipment') || [];
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

        {currentStep === 2 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-rich-black" />
              </div>
              <CardTitle className="text-2xl text-rich-black">Services & Equipment</CardTitle>
              <p className="text-medium-gray">What services do you offer?</p>
            </CardHeader>
            <CardContent>
              <Form {...servicesForm}>
                <form onSubmit={servicesForm.handleSubmit(onServicesNext)} className="space-y-6">
                  <FormField
                    control={servicesForm.control}
                    name="services"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Services Offered</span>
                          <span className="text-red-500">*</span>
                          <span className="text-sm text-medium-gray">(Select all that apply)</span>
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-3">
                          {serviceOptions.map((service) => (
                            <div key={service} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value.includes(service)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, service]);
                                  } else {
                                    field.onChange(field.value.filter(s => s !== service));
                                  }
                                }}
                              />
                              <span className="text-sm">{service}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Input
                            placeholder="Add custom service"
                            value={customService}
                            onChange={(e) => setCustomService(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomService}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={servicesForm.control}
                    name="equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <span>Equipment Available</span>
                          <span className="text-sm text-medium-gray">(Optional - Select all that apply)</span>
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-3">
                          {equipmentOptions.map((equipment) => (
                            <div key={equipment} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(equipment) || false}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, equipment]);
                                  } else {
                                    field.onChange(currentValue.filter(e => e !== equipment));
                                  }
                                }}
                              />
                              <span className="text-sm">{equipment}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Input
                            placeholder="Add custom equipment"
                            value={customEquipment}
                            onChange={(e) => setCustomEquipment(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomEquipment}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={servicesForm.control}
                    name="workingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Working Hours</span>
                        </FormLabel>
                        <div className="space-y-3">
                          {Object.entries(field.value).map(([day, hours]) => (
                            <div key={day} className="flex items-center space-x-4 p-3 border rounded-md">
                              <div className="w-20 font-medium capitalize">{day}</div>
                              <Switch
                                checked={!hours.closed}
                                onCheckedChange={(checked) => {
                                  field.onChange({
                                    ...field.value,
                                    [day]: { ...hours, closed: !checked, is24Hours: checked ? hours.is24Hours : false }
                                  });
                                }}
                                className="data-[state=checked]:bg-brand-yellow"
                              />
                              <span className="text-sm w-12">
                                {hours.closed ? 'Closed' : 'Open'}
                              </span>
                              {!hours.closed && (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={hours.is24Hours}
                                      onCheckedChange={(checked) => {
                                        field.onChange({
                                          ...field.value,
                                          [day]: { 
                                            ...hours, 
                                            is24Hours: checked,
                                            open: checked ? '00:00' : hours.open,
                                            close: checked ? '23:59' : hours.close
                                          }
                                        });
                                      }}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                    <span className="text-sm font-medium text-green-600">
                                      24/7
                                    </span>
                                  </div>
                                  {!hours.is24Hours && (
                                    <>
                                      <Input
                                        type="time"
                                        value={hours.open}
                                        onChange={(e) => {
                                          field.onChange({
                                            ...field.value,
                                            [day]: { ...hours, open: e.target.value }
                                          });
                                        }}
                                        className="w-24"
                                      />
                                      <span className="text-medium-gray">to</span>
                                      <Input
                                        type="time"
                                        value={hours.close}
                                        onChange={(e) => {
                                          field.onChange({
                                            ...field.value,
                                            [day]: { ...hours, close: e.target.value }
                                          });
                                        }}
                                        className="w-24"
                                      />
                                    </>
                                  )}
                                  {hours.is24Hours && (
                                    <span className="text-sm font-bold text-green-600 px-3 py-1 bg-green-50 rounded-full">
                                      Open 24 Hours
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
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

        {currentStep === 3 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-rich-black" />
              </div>
              <CardTitle className="text-2xl text-rich-black">Shop Application Form</CardTitle>
              <p className="text-medium-gray">Complete your application details</p>
            </CardHeader>
            <CardContent>
              <Form {...finalForm}>
                <form onSubmit={finalForm.handleSubmit(onFinalSubmit)} className="space-y-8">
                  {/* Public Information Section */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-brand-yellow">Public Information</h3>
                      <p className="text-sm text-medium-gray">This information will be displayed to customers</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={finalForm.control}
                        name="publicShopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Public Shop Name</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Quick Print Center" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={finalForm.control}
                        name="publicOwnerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Public Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional - shown to customers" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={finalForm.control}
                      name="publicAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <span>Public Address</span>
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Address shown to customers for navigation"
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={finalForm.control}
                      name="publicContactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional - contact number for customers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Internal Shop Details Section */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-brand-yellow">Shop Details (Internal Use)</h3>
                      <p className="text-sm text-medium-gray">Internal information for platform management</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={finalForm.control}
                        name="internalShopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Internal Shop Name</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={finalForm.control}
                        name="ownerFullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Owner Full Name</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={finalForm.control}
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
                                <Input {...field} className="rounded-l-none" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={finalForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Phone Number</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="flex">
                                <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                                  <span className="text-medium-gray">+91</span>
                                </div>
                                <PhoneInput 
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="rounded-none border-l-0 border-r-0"
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={finalForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Password</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={finalForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Confirm Password</span>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={finalForm.control}
                      name="completeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <span>Complete Address</span>
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Operating Hours */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-brand-yellow">Operating Hours</h3>
                    </div>
                    
                    <FormField
                      control={finalForm.control}
                      name="workingHours"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            {Object.entries(field.value).map(([day, hours]) => (
                              <div key={day} className="flex items-center space-x-4 p-3 border rounded-md">
                                <div className="w-20 font-medium capitalize">{day}</div>
                                <Switch
                                  checked={!hours.closed}
                                  onCheckedChange={(checked) => {
                                    field.onChange({
                                      ...field.value,
                                      [day]: { ...hours, closed: !checked }
                                    });
                                  }}
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
                                        field.onChange({
                                          ...field.value,
                                          [day]: { ...hours, open: e.target.value }
                                        });
                                      }}
                                      className="w-24"
                                    />
                                    <span className="text-medium-gray">to</span>
                                    <Input
                                      type="time"
                                      value={hours.close}
                                      onChange={(e) => {
                                        field.onChange({
                                          ...field.value,
                                          [day]: { ...hours, close: e.target.value }
                                        });
                                      }}
                                      className="w-24"
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
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold text-brand-yellow">Additional Information</h3>
                    </div>
                    
                    <FormField
                      control={finalForm.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5 years" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={finalForm.control}
                      name="servicesOffered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Services Offered</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Digital printing, Photocopying, Lamination, Binding..."
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={finalForm.control}
                      name="equipmentAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Available</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Color printer, Black & white printer, Laminating machine..."
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={finalForm.control}
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

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                    <Button
                      type="submit"
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                      disabled={submitApplication.isPending}
                    >
                      {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}