import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
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
  Clock, Briefcase, Settings, CheckCircle, Loader2
} from 'lucide-react';

// Form validation schema
const applicationSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Public shop name is required'),
  publicOwnerName: z.string().optional(),
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().optional(),
  
  // Internal Information
  internalShopName: z.string().min(1, 'Internal shop name is required'),
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  completeAddress: z.string().min(1, 'Complete address is required'),
  
  // Location
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(6, 'Valid pin code is required'),
  
  // Business Details
  services: z.array(z.string()).min(1, 'At least one service is required'),
  equipment: z.array(z.string()).min(1, 'At least one equipment is required'),
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
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
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
      completeAddress: '',
      city: '',
      state: '',
      pinCode: '',
      services: [],
      equipment: [],
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
    },
  });

  const onSubmit = async (data: ApplicationForm) => {
    setIsSubmitting(true);
    try {
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
                    <Input placeholder="Contact number for customers (optional)" {...field} />
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
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your contact number" {...field} />
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
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create a secure password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complete Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full business address with landmarks"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Available * (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {equipment.map((equip) => (
                      <div key={equip} className="flex items-center space-x-2">
                        <Checkbox
                          id={equip}
                          checked={field.value.includes(equip)}
                          onCheckedChange={() => handleEquipmentToggle(equip)}
                        />
                        <label htmlFor={equip} className="text-sm">{equip}</label>
                      </div>
                    ))}
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
                <div key={day} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 font-medium capitalize">{day}</div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={hours.closed}
                        onCheckedChange={(checked) => {
                          form.setValue(`workingHours.${day as keyof typeof form.getValues['workingHours']}.closed`, !!checked);
                        }}
                      />
                      <label className="text-sm">Closed</label>
                    </div>
                  </div>
                  
                  {!hours.closed && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => {
                          form.setValue(`workingHours.${day as keyof typeof form.getValues['workingHours']}.open`, e.target.value);
                        }}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => {
                          form.setValue(`workingHours.${day as keyof typeof form.getValues['workingHours']}.close`, e.target.value);
                        }}
                        className="w-32"
                      />
                    </div>
                  )}
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
                <p><strong>City:</strong> {form.watch('city')}, {form.watch('state')}</p>
                <p><strong>Experience:</strong> {form.watch('yearsOfExperience')}</p>
                <p><strong>Services:</strong> {form.watch('services').length} selected</p>
                <p><strong>Equipment:</strong> {form.watch('equipment').length} selected</p>
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