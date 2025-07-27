import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ProfessionalLayout } from '@/components/professional-layout';
import { ProfessionalForm, ProfessionalInput, ProfessionalTextarea, ProfessionalSelect, ProfessionalCheckboxList, ProfessionalMultiInput } from '@/components/professional-forms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, CheckCircle, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface ApplicationFormData {
  // Basic Info
  shopName: string;
  shopSlug: string;
  publicName: string;
  publicContactNumber: string;
  
  // Contact Details
  email: string;
  password: string;
  ownerContactNumber: string;
  
  // Address
  buildingName: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  
  // Business Details
  yearsOfExperience: number;
  servicesOffered: string[];
  customServices: string[];
  equipmentAvailable: string[];
  customEquipment: string[];
  acceptWalkinOrders: boolean;
  
  // Working Hours
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const SERVICES_OPTIONS = [
  { value: 'document_printing', label: 'Document Printing', description: 'Black & white and color document printing' },
  { value: 'photo_printing', label: 'Photo Printing', description: 'High-quality photo prints in various sizes' },
  { value: 'business_cards', label: 'Business Cards', description: 'Professional business card printing' },
  { value: 'brochures', label: 'Brochures & Flyers', description: 'Marketing material printing' },
  { value: 'binding', label: 'Binding Services', description: 'Spiral, comb, and book binding' },
  { value: 'lamination', label: 'Lamination', description: 'Document and photo lamination' }
];

const EQUIPMENT_OPTIONS = [
  { value: 'laser_printer', label: 'Laser Printer', description: 'High-speed document printing' },
  { value: 'inkjet_printer', label: 'Inkjet Printer', description: 'Color printing and photos' },
  { value: 'photocopier', label: 'Photocopier', description: 'Document copying and scanning' },
  { value: 'laminator', label: 'Laminator', description: 'Document lamination machine' },
  { value: 'binding_machine', label: 'Binding Machine', description: 'Spiral and comb binding' },
  { value: 'cutting_machine', label: 'Paper Cutting Machine', description: 'Precision paper cutting' }
];

export default function ProfessionalShopApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<ApplicationFormData>({
    shopName: '',
    shopSlug: '',
    publicName: '',
    publicContactNumber: '',
    email: '',
    password: '',
    ownerContactNumber: '',
    buildingName: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    yearsOfExperience: 1,
    servicesOffered: [],
    customServices: [],
    equipmentAvailable: [],
    customEquipment: [],
    acceptWalkinOrders: true,
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/shops/check-slug/${slug}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      setSlugAvailable(null);
    }
  };

  // Submit application
  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const response = await fetch('/api/applications/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Application submission failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon."
      });
      setLocation('/application-success');
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please check your information and try again.",
        variant: "destructive"
      });
    }
  });

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
      if (!formData.shopSlug.trim()) newErrors.shopSlug = 'Shop URL is required';
      if (!formData.publicName.trim()) newErrors.publicName = 'Public name is required';
      if (!formData.publicContactNumber.trim()) newErrors.publicContactNumber = 'Contact number is required';
    }

    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      if (!formData.ownerContactNumber.trim()) newErrors.ownerContactNumber = 'Owner contact is required';
    }

    if (step === 3) {
      if (!formData.area.trim()) newErrors.area = 'Area is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    }

    if (step === 4) {
      if (formData.servicesOffered.length === 0 && formData.customServices.length === 0) {
        newErrors.services = 'At least one service must be selected';
      }
      if (formData.equipmentAvailable.length === 0 && formData.customEquipment.length === 0) {
        newErrors.equipment = 'At least one equipment must be selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      submitMutation.mutate(formData);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generate slug from shop name
  const generateSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    updateFormData('shopSlug', slug);
    if (slug) checkSlugAvailability(slug);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Basic Shop Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ProfessionalInput
                  label="Shop Name"
                  required
                  value={formData.shopName}
                  onChange={(e) => {
                    updateFormData('shopName', e.target.value);
                    generateSlug(e.target.value);
                  }}
                  placeholder="e.g., QuickPrint Solutions"
                  error={errors.shopName}
                  description="The official name of your print shop"
                />
                
                <div className="space-y-2">
                  <ProfessionalInput
                    label="Shop URL"
                    required
                    value={formData.shopSlug}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      updateFormData('shopSlug', slug);
                      checkSlugAvailability(slug);
                    }}
                    placeholder="quickprint-solutions"
                    error={errors.shopSlug}
                    description="Unique URL for your shop (automatically generated)"
                  />
                  {slugAvailable === true && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-3 w-3" />
                      URL is available
                    </div>
                  )}
                  {slugAvailable === false && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <Clock className="h-3 w-3" />
                      URL is already taken
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <ProfessionalInput
                  label="Public Contact Name"
                  required
                  value={formData.publicName}
                  onChange={(e) => updateFormData('publicName', e.target.value)}
                  placeholder="e.g., Mr. Rajesh"
                  error={errors.publicName}
                  description="Name shown to customers for contact"
                />
                
                <ProfessionalInput
                  label="Public Contact Number"
                  required
                  type="tel"
                  value={formData.publicContactNumber}
                  onChange={(e) => updateFormData('publicContactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  error={errors.publicContactNumber}
                  description="Number customers can call"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Login Credentials & Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ProfessionalInput
                  label="Email Address"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="owner@quickprint.com"
                  error={errors.email}
                  description="Used for shop owner login"
                />
                
                <ProfessionalInput
                  label="Password"
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Create a secure password"
                  error={errors.password}
                  description="For accessing your shop dashboard"
                />
              </div>

              <div className="mt-4">
                <ProfessionalInput
                  label="Owner Contact Number"
                  required
                  type="tel"
                  value={formData.ownerContactNumber}
                  onChange={(e) => updateFormData('ownerContactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  error={errors.ownerContactNumber}
                  description="Your personal contact number"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Shop Address</h3>
              <div className="space-y-4">
                <ProfessionalInput
                  label="Building/Shop Name"
                  value={formData.buildingName}
                  onChange={(e) => updateFormData('buildingName', e.target.value)}
                  placeholder="e.g., Ground Floor, ABC Complex"
                  description="Building or complex name (optional)"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <ProfessionalInput
                    label="Area/Locality"
                    required
                    value={formData.area}
                    onChange={(e) => updateFormData('area', e.target.value)}
                    placeholder="e.g., Koramangala"
                    error={errors.area}
                  />
                  
                  <ProfessionalInput
                    label="City"
                    required
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="e.g., Bangalore"
                    error={errors.city}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ProfessionalSelect
                    label="State"
                    required
                    value={formData.state}
                    onValueChange={(value) => updateFormData('state', value)}
                    options={INDIAN_STATES.map(state => ({ value: state, label: state }))}
                    placeholder="Select state"
                    error={errors.state}
                  />
                  
                  <ProfessionalInput
                    label="Pincode"
                    required
                    value={formData.pincode}
                    onChange={(e) => updateFormData('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="560034"
                    error={errors.pincode}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Business Details</h3>
              
              <div className="mb-6">
                <ProfessionalSelect
                  label="Years of Experience"
                  required
                  value={formData.yearsOfExperience.toString()}
                  onValueChange={(value) => updateFormData('yearsOfExperience', parseInt(value))}
                  options={Array.from({ length: 30 }, (_, i) => ({ 
                    value: (i + 1).toString(), 
                    label: `${i + 1} year${i === 0 ? '' : 's'}` 
                  }))}
                  placeholder="Select experience"
                />
              </div>

              <ProfessionalCheckboxList
                label="Services Offered"
                options={SERVICES_OPTIONS}
                value={formData.servicesOffered}
                onChange={(value) => updateFormData('servicesOffered', value)}
                error={errors.services}
                description="Select all services you provide"
              />

              <ProfessionalMultiInput
                label="Additional Services"
                values={formData.customServices}
                onChange={(values) => updateFormData('customServices', values)}
                placeholder="Enter custom service"
                maxItems={10}
                description="Add any additional services not listed above"
              />

              <ProfessionalCheckboxList
                label="Equipment Available"
                options={EQUIPMENT_OPTIONS}
                value={formData.equipmentAvailable}
                onChange={(value) => updateFormData('equipmentAvailable', value)}
                error={errors.equipment}
                description="Select all equipment you have"
              />

              <ProfessionalMultiInput
                label="Additional Equipment"  
                values={formData.customEquipment}
                onChange={(values) => updateFormData('customEquipment', values)}
                placeholder="Enter equipment name"
                maxItems={10}
                description="Add any additional equipment not listed above"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProfessionalLayout 
      title="Apply for Your Print Shop"
      maxWidth="2xl"
    >
      {/* Progress Header */}
      <Card className="card-professional mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-black flex items-center gap-2">
                <Building className="h-6 w-6 text-yellow-600" />
                Shop Application
              </CardTitle>
              <CardDescription>
                Step {currentStep} of {totalSteps}: Complete your print shop registration
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-yellow-700 border-yellow-200">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Form Content */}
      <Card className="card-professional">
        <CardContent className="p-8">
          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {renderStepContent()}

            <Separator className="my-8" />

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-3">
                {currentStep < totalSteps ? (
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </ProfessionalLayout>
  );
}