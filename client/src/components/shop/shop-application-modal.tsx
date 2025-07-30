import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { shopApplicationSchema } from '@/lib/validation';
import { ShopApplicationFormData } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface ShopApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShopApplicationModal({ isOpen, onClose }: ShopApplicationModalProps) {
  const [formData, setFormData] = useState<ShopApplicationFormData>({
    shopName: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    email: '',
    services: [],
    workingHours: {
      open: '09:00',
      close: '21:00',
    },
    yearsOfExperience: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableServices = [
    'Document Printing',
    'Photo Printing',
    'Binding',
    'Lamination',
    'Large Format',
    'Scanning',
  ];

  const experienceOptions = [
    'Less than 1 year',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    'More than 10 years',
  ];

  const handleReset = () => {
    setFormData({
      shopName: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      email: '',
      services: [],
      workingHours: {
        open: '09:00',
        close: '21:00',
      },
      yearsOfExperience: '',
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Please login first",
        variant: "destructive",
      });
      return;
    }

    try {
      const validation = shopApplicationSchema.safeParse(formData);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      const response = await fetch('/api/shop-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...validation.data,
          applicantId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      handleClose();
      toast({
        title: "Application submitted successfully!",
        description: "We will review your application and contact you soon.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to submit application",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-rich-black">
            Shop Partnership Application
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-rich-black mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Shop Name *
                </Label>
                <Input
                  placeholder="Enter shop name"
                  value={formData.shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="shop@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-rich-black mb-4">Shop Address</h3>
            <div className="space-y-4">
              <Textarea
                rows={3}
                placeholder="Complete shop address with landmark"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="input-field"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-rich-black mb-2 block">
                    City *
                  </Label>
                  <Input
                    placeholder="Ahmedabad"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-rich-black mb-2 block">
                    State *
                  </Label>
                  <Input
                    placeholder="Gujarat"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-rich-black mb-2 block">
                    PIN Code *
                  </Label>
                  <Input
                    placeholder="380001"
                    value={formData.pinCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinCode: e.target.value }))}
                    className="input-field"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Services & Equipment */}
          <div>
            <h3 className="text-lg font-medium text-rich-black mb-4">Services & Equipment</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Services Offered *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableServices.map((service) => (
                    <label key={service} className="flex items-center">
                      <Checkbox
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <span className="ml-2 text-sm text-rich-black">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Years of Experience
                </Label>
                <Select 
                  value={formData.yearsOfExperience} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, yearsOfExperience: value }))}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Working Hours */}
          <div>
            <h3 className="text-lg font-medium text-rich-black mb-4">Working Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Opening Time *
                </Label>
                <Input
                  type="time"
                  value={formData.workingHours.open}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, open: e.target.value }
                  }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Closing Time *
                </Label>
                <Input
                  type="time"
                  value={formData.workingHours.close}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, close: e.target.value }
                  }))}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
