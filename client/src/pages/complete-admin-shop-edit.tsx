import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ObjectUploader } from '@/components/ObjectUploader';
import { 
  Store, User, MapPin, Briefcase, Clock, Settings, 
  Save, X, Plus, Package, Upload, Camera
} from 'lucide-react';

const SERVICES = [
  'Document Printing', 'Photo Printing', 'Business Cards', 'Brochures',
  'Banners & Posters', 'Binding & Lamination', 'Scanning', 'Photocopying',
  'ID Card Printing', 'Wedding Cards', 'T-Shirt Printing', 'Book Printing'
];

const EQUIPMENT = [
  'Color Printer', 'Black & White Printer', 'Large Format Printer',
  'Binding Machine', 'Lamination Machine', 'Scanner', 'Photocopier',
  'Cutting Machine', 'Folding Machine', 'Digital Press'
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface CompleteAdminShopEditProps {
  shop: any;
  onClose: () => void;
  onSave: () => void;
}

export default function CompleteAdminShopEdit({ shop, onClose, onSave }: CompleteAdminShopEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse services and equipment
  const parsedServices = Array.isArray(shop.services) 
    ? shop.services 
    : typeof shop.services === 'string' 
      ? JSON.parse(shop.services || '[]')
      : [];

  const parsedEquipment = Array.isArray(shop.equipment) 
    ? shop.equipment 
    : typeof shop.equipment === 'string' 
      ? JSON.parse(shop.equipment || '[]')
      : [];

  const parsedWorkingHours = typeof shop.workingHours === 'string' 
    ? JSON.parse(shop.workingHours || '{}')
    : shop.workingHours || {};

  // Form state with ALL fields from application
  const [formData, setFormData] = useState({
    // Basic Information
    name: shop.name || '',
    publicOwnerName: shop.publicOwnerName || '',
    address: shop.address || '',
    phone: shop.phone || '',
    slug: shop.slug || '',
    
    // Internal Information
    internalName: shop.internalName || '',
    ownerFullName: shop.ownerFullName || '',
    email: shop.email || '',
    ownerPhone: shop.ownerPhone || '',
    completeAddress: shop.completeAddress || '',
    
    // Exterior Image
    exteriorImage: shop.exteriorImage || '',
    description: shop.description || '',
    
    // Location
    pinCode: shop.pinCode || '',
    city: shop.city || '',
    state: shop.state || '',
    
    // Business Details
    services: parsedServices.filter((s: any) => SERVICES.includes(s)),
    customServices: parsedServices.filter((s: any) => !SERVICES.includes(s)),
    equipment: parsedEquipment.filter((e: any) => EQUIPMENT.includes(e)),
    customEquipment: parsedEquipment.filter((e: any) => !EQUIPMENT.includes(e)),
    yearsOfExperience: shop.yearsOfExperience?.toString() || '',
    formationYear: shop.formationYear?.toString() || '',
    
    // Working Hours
    workingHours: {
      monday: parsedWorkingHours.monday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      tuesday: parsedWorkingHours.tuesday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      wednesday: parsedWorkingHours.wednesday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      thursday: parsedWorkingHours.thursday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      friday: parsedWorkingHours.friday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      saturday: parsedWorkingHours.saturday || { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      sunday: parsedWorkingHours.sunday || { open: '09:00', close: '18:00', closed: true, is24Hours: false }
    },
    
    // Shop Settings
    isOnline: shop.isOnline ?? true,
    isApproved: shop.isApproved ?? true,
    acceptsWalkinOrders: shop.acceptsWalkinOrders ?? true,
    status: shop.status || 'active'
  });

  // Image upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest('/api/admin/objects/upload', 'POST');
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;
      
      // Update shop with the new image URL
      try {
        const response = await apiRequest('/api/admin/shop-exterior-image', 'PUT', {
          shopId: shop.id,
          exteriorImageURL: imageURL,
        });
        
        setFormData(prev => ({ ...prev, exteriorImage: response.objectPath }));
        
        toast({
          title: "Success",
          description: "Shop exterior image uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save image",
          variant: "destructive",
        });
      }
    }
  };

  // Save mutation
  const saveShopMutation = useMutation({
    mutationFn: async () => {
      const allServices = [...formData.services, ...formData.customServices];
      const allEquipment = [...formData.equipment, ...formData.customEquipment];

      const updateData = {
        ...formData,
        services: allServices,
        equipment: allEquipment,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        formationYear: formData.formationYear ? parseInt(formData.formationYear) : null,
      };

      return await apiRequest(`/api/admin/shops/${shop.id}`, 'PATCH', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      toast({
        title: "Success",
        description: "Shop updated successfully"
      });
      onSave();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shop",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveShopMutation.mutate();
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const addCustomService = (service: string) => {
    if (service.trim() && !formData.customServices.includes(service.trim())) {
      setFormData(prev => ({
        ...prev,
        customServices: [...prev.customServices, service.trim()]
      }));
    }
  };

  const removeCustomService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter(s => s !== service)
    }));
  };

  const addCustomEquipment = (equipment: string) => {
    if (equipment.trim() && !formData.customEquipment.includes(equipment.trim())) {
      setFormData(prev => ({
        ...prev,
        customEquipment: [...prev.customEquipment, equipment.trim()]
      }));
    }
  };

  const removeCustomEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      customEquipment: prev.customEquipment.filter(e => e !== equipment)
    }));
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-rich-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-rich-black">Edit Shop - Complete Settings</h3>
                <p className="text-sm text-gray-600">Modify all shop information and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleSave}
                disabled={saveShopMutation.isPending}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              >
                {saveShopMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-brand-yellow" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Public Shop Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Shop name visible to customers"
                  />
                </div>
                <div>
                  <Label>Public Owner Name</Label>
                  <Input
                    value={formData.publicOwnerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, publicOwnerName: e.target.value }))}
                    placeholder="Owner name visible to customers"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Shop Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="shop-url-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: printeasy.com/shop/{formData.slug || 'shop-slug'}
                  </p>
                </div>
                <div>
                  <Label>Public Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div>
                <Label>Public Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Short address for customers"
                />
              </div>

              <div>
                <Label>Shop Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your shop and services..."
                  rows={3}
                />
              </div>

              {/* Exterior Image Upload Section */}
              <div>
                <Label className="text-base font-medium">Shop Exterior Image</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload a high-quality exterior photo of the shop (Admin Only Feature)
                </p>
                
                {formData.exteriorImage ? (
                  <div className="space-y-3">
                    {/* Current Image Preview */}
                    <div className="relative">
                      <img 
                        src={formData.exteriorImage} 
                        alt="Shop exterior" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, exteriorImage: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Replace Image Button */}
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={314572800} // 300MB for images
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleImageUploadComplete}
                      buttonClassName="w-full border border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Replace Exterior Image
                    </ObjectUploader>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exterior image</h3>
                    <p className="text-gray-600 mb-4">Upload a professional photo of the shop exterior</p>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={314572800} // 300MB for images
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleImageUploadComplete}
                      buttonClassName="bg-[#FFBF00] hover:bg-[#FFBF00]/90 text-black"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Exterior Image
                    </ObjectUploader>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-brand-yellow" />
                Internal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Internal Shop Name</Label>
                  <Input
                    value={formData.internalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalName: e.target.value }))}
                    placeholder="Internal reference name"
                  />
                </div>
                <div>
                  <Label>Owner Full Name *</Label>
                  <Input
                    value={formData.ownerFullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerFullName: e.target.value }))}
                    placeholder="Complete owner name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="owner@email.com"
                  />
                </div>
                <div>
                  <Label>Owner Phone</Label>
                  <Input
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                    placeholder="Owner's personal number"
                  />
                </div>
              </div>

              <div>
                <Label>Complete Address *</Label>
                <Textarea
                  value={formData.completeAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, completeAddress: e.target.value }))}
                  placeholder="Full detailed address with landmarks..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-yellow" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>PIN Code *</Label>
                  <Input
                    value={formData.pinCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinCode: e.target.value }))}
                    placeholder="6-digit PIN"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City name"
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-yellow" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Formation Year</Label>
                  <Input
                    value={formData.formationYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, formationYear: e.target.value }))}
                    placeholder="YYYY"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                    placeholder="Number of years"
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              <Separator />

              {/* Services */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Services Offered</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {SERVICES.map((service) => (
                    <div key={service} className="flex items-center space-x-3">
                      <Checkbox
                        id={service}
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <Label htmlFor={service} className="text-sm cursor-pointer flex-1">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Custom Services</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add custom service..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomService((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add custom service..."]') as HTMLInputElement;
                        if (input?.value) {
                          addCustomService(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customServices.map((service: any, index: any) => (
                      <Badge key={index} variant="secondary">
                        {service}
                        <button
                          onClick={() => removeCustomService(service)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Equipment */}
              <div>
                <Label className="text-base font-semibold mb-4 block">Equipment Available</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {EQUIPMENT.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-3">
                      <Checkbox
                        id={equipment}
                        checked={formData.equipment.includes(equipment)}
                        onCheckedChange={() => toggleEquipment(equipment)}
                      />
                      <Label htmlFor={equipment} className="text-sm cursor-pointer flex-1">
                        {equipment}
                      </Label>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Custom Equipment</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add custom equipment..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomEquipment((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add custom equipment..."]') as HTMLInputElement;
                        if (input?.value) {
                          addCustomEquipment(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.customEquipment.map((equipment: any, index: any) => (
                      <Badge key={index} variant="secondary">
                        {equipment}
                        <button
                          onClick={() => removeCustomEquipment(equipment)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-yellow" />
                Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day, index) => (
                <div key={day} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold capitalize">{DAY_LABELS[index]}</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.workingHours[day as keyof typeof formData.workingHours].is24Hours}
                          onCheckedChange={(checked) => updateWorkingHours(day, 'is24Hours', checked)}
                        />
                        <Label className="text-sm">24/7</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={!formData.workingHours[day as keyof typeof formData.workingHours].closed}
                          onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                        />
                        <Label className="text-sm">Open</Label>
                      </div>
                    </div>
                  </div>

                  {!formData.workingHours[day as keyof typeof formData.workingHours].closed && 
                   !formData.workingHours[day as keyof typeof formData.workingHours].is24Hours && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Opening Time</Label>
                        <Input
                          type="time"
                          value={formData.workingHours[day as keyof typeof formData.workingHours].open}
                          onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Closing Time</Label>
                        <Input
                          type="time"
                          value={formData.workingHours[day as keyof typeof formData.workingHours].close}
                          onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {formData.workingHours[day as keyof typeof formData.workingHours].is24Hours && (
                    <div className="text-center">
                      <Badge className="bg-brand-yellow text-rich-black">Open 24 Hours</Badge>
                    </div>
                  )}

                  {formData.workingHours[day as keyof typeof formData.workingHours].closed && (
                    <div className="text-center">
                      <Badge variant="secondary">Closed</Badge>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shop Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-yellow" />
                Shop Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Shop Status</Label>
                  <p className="text-sm text-gray-600">Control online/offline status</p>
                </div>
                <Switch
                  checked={formData.isOnline}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnline: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Shop Approval</Label>
                  <p className="text-sm text-gray-600">Admin approval status</p>
                </div>
                <Switch
                  checked={formData.isApproved}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isApproved: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Walk-in Orders</Label>
                  <p className="text-sm text-gray-600">Accept walk-in customers</p>
                </div>
                <Switch
                  checked={formData.acceptsWalkinOrders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptsWalkinOrders: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}