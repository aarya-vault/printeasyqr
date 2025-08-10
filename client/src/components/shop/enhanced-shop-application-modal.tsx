import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Clock, Store, User, Mail, MapPin, FileText, Plus, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ShopApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STANDARD_SERVICES = [
  'Document Printing',
  'Photo Printing', 
  'Binding & Lamination',
  'Photocopying',
  'Scanning',
  'Large Format Printing',
  'Business Cards',
  'Letterheads',
  'Brochures',
  'Posters',
  'Stationery',
  'ID Cards'
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

export function EnhancedShopApplicationModal({ isOpen, onClose }: ShopApplicationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    shopName: '',
    shopSlug: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    email: '',
    ownerContactName: '',
    ownerEmail: '',
    yearsOfExperience: ''
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');
  const [workingHours, setWorkingHours] = useState<Record<string, any>>({
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '21:00', closed: false },
    saturday: { open: '09:00', close: '21:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate shop slug from shop name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleShopNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      shopName: value,
      shopSlug: generateSlug(value)
    }));
  };

  const addService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const removeService = (service: string) => {
    setSelectedServices(prev => prev.filter(s => s !== service));
  };

  const addCustomService = () => {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      setSelectedServices(prev => [...prev, customService.trim()]);
      setCustomService('');
    }
  };

  const updateWorkingHours = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const submitApplicationMutation = useMutation({
    mutationFn: async (applicationData: any) => {
      const response = await fetch('/api/shop-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });
      if (!response.ok) throw new Error('Failed to submit application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-applications'] });
      toast({
        title: "Application Submitted Successfully!",
        description: "Your shop application has been submitted for review. You'll be notified once it's processed.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      shopName: '',
      shopSlug: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      email: '',
      ownerContactName: '',
      ownerEmail: '',
      yearsOfExperience: ''
    });
    setSelectedServices([]);
    setCustomService('');
    setWorkingHours({
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '18:00', closed: false }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to submit an application.",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Services Required",
        description: "Please select at least one service that your shop offers.",
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      applicantId: user.id,
      shopName: formData.shopName,
      shopSlug: formData.shopSlug,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
      email: formData.email,
      ownerContactName: formData.ownerContactName || null,
      ownerEmail: formData.ownerEmail || null,
      services: selectedServices,
      workingHours: workingHours,
      yearsOfExperience: formData.yearsOfExperience
    };

    submitApplicationMutation.mutate(applicationData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Store className="w-6 h-6 text-brand-yellow" />
            <span>Shop Application</span>
          </DialogTitle>
          <DialogDescription>
            Apply to join the PrintEasy network and connect with customers in your area.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Store className="w-5 h-5" />
                <span>Shop Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <Input
                    id="shopName"
                    value={formData.shopName}
                    onChange={(e) => handleShopNameChange(e.target.value)}
                    placeholder="Enter your shop name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shopSlug">Shop URL Slug *</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-medium-gray">printeasy.com/shop/</span>
                    <Input
                      id="shopSlug"
                      value={formData.shopSlug}
                      onChange={(e) => setFormData(prev => ({ ...prev, shopSlug: generateSlug(e.target.value) }))}
                      placeholder="shop-url"
                      required
                    />
                  </div>
                  <p className="text-xs text-medium-gray mt-1">
                    This will be your shop's unique URL. Auto-generated from shop name.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Shop Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="shop@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                <Input
                  id="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                  placeholder="e.g., 5 years"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MapPin className="w-5 h-5" />
                <span>Location Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Complete Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete shop address with landmarks"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ahmedabad"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Gujarat"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    value={formData.pinCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="380001"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Contact Information (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="w-5 h-5" />
                <span>Owner Contact Information (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerContactName">Owner/Manager Name</Label>
                  <Input
                    id="ownerContactName"
                    value={formData.ownerContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerContactName: e.target.value }))}
                    placeholder="Full name of shop owner or manager"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Owner/Manager Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    placeholder="owner@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="w-5 h-5" />
                <span>Services Offered *</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Standard Services</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                  {STANDARD_SERVICES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => 
                        selectedServices.includes(service) 
                          ? removeService(service) 
                          : addService(service)
                      }
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        selectedServices.includes(service)
                          ? 'bg-brand-yellow text-rich-black border-brand-yellow'
                          : 'bg-white text-medium-gray border-gray-300 hover:border-brand-yellow'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="customService">Add Custom Service</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="customService"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Enter custom service name"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                  />
                  <Button type="button" onClick={addCustomService} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedServices.length > 0 && (
                <div>
                  <Label>Selected Services</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedServices.map((service) => (
                      <Badge key={service} variant="outline" className="flex items-center space-x-1">
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-error-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="w-5 h-5" />
                <span>Working Hours *</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  <div className="w-20 font-medium">{day.label}</div>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={workingHours[day.key]?.closed || false}
                      onChange={(e) => updateWorkingHours(day.key, 'closed', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Closed</span>
                  </label>

                  {!workingHours[day.key]?.closed && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Open:</Label>
                        <Input
                          type="time"
                          value={workingHours[day.key]?.open || '09:00'}
                          onChange={(e) => updateWorkingHours(day.key, 'open', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Close:</Label>
                        <Input
                          type="time"
                          value={workingHours[day.key]?.close || '21:00'}
                          onChange={(e) => updateWorkingHours(day.key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitApplicationMutation.isPending}
              className="bg-rich-black text-white hover:bg-gray-800"
            >
              {submitApplicationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}