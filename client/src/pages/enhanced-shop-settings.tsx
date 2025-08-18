import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Store, Clock, Phone, Mail, MapPin, 
  Bell, Save, Settings, Calendar, Globe, Check,
  Users, Package, MessageSquare, Shield, Power,
  Star, AlertCircle, CheckCircle2, Info, Plus, X,
  User, Briefcase, Building
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

export default function EnhancedShopSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState<string[]>([]);

  // Get current shop data
  const { data: userShops, isLoading: shopsLoading } = useQuery({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id && user?.role === 'shop_owner'
  });

  // Handle both array response and single shop object response
  const currentShop = userShops ? (Array.isArray(userShops) ? userShops[0] : (userShops as any).shop || userShops) : null;

  // Initialize form data state with all fields from application
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    publicOwnerName: '',
    address: '',
    phone: '',
    slug: '',
    
    // Internal Information  
    internalName: '',
    ownerFullName: '',
    email: '',
    ownerPhone: '',
    completeAddress: '',
    description: '',
    
    // Location
    pinCode: '',
    city: '',
    state: '',
    
    // Business Details
    services: [] as string[],
    customServices: [] as string[],
    equipment: [] as string[],
    customEquipment: [] as string[],
    yearsOfExperience: '',
    formationYear: '',
    
    // Working Hours
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      tuesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      wednesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      thursday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      friday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      saturday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
      sunday: { open: '09:00', close: '18:00', closed: true, is24Hours: false }
    },
    
    // Shop Settings
    isOnline: true,
    acceptsWalkinOrders: true,
    
    // Notifications
    notifications: {
      newOrders: true,
      statusUpdates: true,
      customerMessages: true
    }
  });

  // Initialize form data when shop data loads
  useEffect(() => {
    if (currentShop) {
      console.log('📊 Current Shop Data:', currentShop);
      
      // Fix for corrupted working hours data
      let parsedWorkingHours = {};
      try {
        if (typeof currentShop.workingHours === 'string') {
          parsedWorkingHours = JSON.parse(currentShop.workingHours);
        } else if (typeof currentShop.workingHours === 'object' && currentShop.workingHours !== null) {
          // Check if it's the corrupted format (character-by-character object)
          if (currentShop.workingHours['0'] || currentShop.workingHours['monday']) {
            if (currentShop.workingHours['monday']) {
              parsedWorkingHours = currentShop.workingHours;
            } else {
              // It's corrupted, use default
              parsedWorkingHours = {};
            }
          } else {
            parsedWorkingHours = currentShop.workingHours;
          }
        }
      } catch (e) {
        console.error('Error parsing working hours:', e);
        parsedWorkingHours = {};
      }

      const parsedServices = Array.isArray(currentShop.services) 
        ? currentShop.services 
        : typeof currentShop.services === 'string' 
          ? JSON.parse(currentShop.services || '[]')
          : [];

      const parsedEquipment = Array.isArray(currentShop.equipment) 
        ? currentShop.equipment 
        : typeof currentShop.equipment === 'string' 
          ? JSON.parse(currentShop.equipment || '[]')
          : [];
          
      // Parse custom services and equipment
      const parsedCustomServices = Array.isArray(currentShop.customServices) 
        ? currentShop.customServices 
        : typeof currentShop.customServices === 'string' 
          ? JSON.parse(currentShop.customServices || '[]')
          : [];
          
      const parsedCustomEquipment = Array.isArray(currentShop.customEquipment) 
        ? currentShop.customEquipment 
        : typeof currentShop.customEquipment === 'string' 
          ? JSON.parse(currentShop.customEquipment || '[]')
          : [];

      setFormData({
        // Basic Information
        name: currentShop.name || '',
        publicOwnerName: currentShop.publicOwnerName || '',
        address: currentShop.address || '',
        phone: currentShop.phone || '',
        slug: currentShop.slug || '',
        
        // Internal Information
        internalName: currentShop.internalName || '',
        ownerFullName: currentShop.ownerFullName || '',
        email: currentShop.email || '',
        ownerPhone: currentShop.ownerPhone || '',
        completeAddress: currentShop.completeAddress || '',
        description: currentShop.description || '',
        
        // Location
        pinCode: currentShop.pinCode || currentShop.pin_code || '',
        city: currentShop.city || '',
        state: currentShop.state || '',
        
        // Business Details - Combine standard and custom services/equipment
        services: parsedServices.filter((s: string) => SERVICES.includes(s)),
        customServices: [...parsedServices.filter((s: string) => !SERVICES.includes(s)), ...parsedCustomServices],
        equipment: parsedEquipment.filter((e: string) => EQUIPMENT.includes(e)),
        customEquipment: [...parsedEquipment.filter((e: string) => !EQUIPMENT.includes(e)), ...parsedCustomEquipment],
        yearsOfExperience: currentShop.yearsOfExperience?.toString() || '',
        formationYear: currentShop.formationYear?.toString() || '',
        
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
        isOnline: currentShop.isOnline ?? true,
        acceptsWalkinOrders: currentShop.acceptsWalkinOrders ?? true,
        
        // Notifications
        notifications: currentShop.notifications || {
          newOrders: true,
          statusUpdates: true,
          customerMessages: true
        }
      });

      // Set custom services and equipment - combine from both sources
      const allCustomServices = [...parsedServices.filter((s: string) => !SERVICES.includes(s)), ...parsedCustomServices];
      const allCustomEquipment = [...parsedEquipment.filter((e: string) => !EQUIPMENT.includes(e)), ...parsedCustomEquipment];
      
      setCustomServices(allCustomServices);
      setCustomEquipment(allCustomEquipment);
      
      console.log('📦 Custom Services:', allCustomServices);
      console.log('🔧 Custom Equipment:', allCustomEquipment);
    }
  }, [currentShop]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      // Combine standard and custom services/equipment
      const allServices = [...formData.services, ...formData.customServices];
      const allEquipment = [...formData.equipment, ...formData.customEquipment];

      const updateData = {
        ...formData,
        services: allServices,
        equipment: allEquipment,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        formationYear: formData.formationYear ? parseInt(formData.formationYear) : null,
      };
      
      return await apiRequest('/api/shops/settings', 'PATCH', updateData);
    },
    onSuccess: () => {
      // CRITICAL FIX: When shop owners update their settings, invalidate ALL relevant caches
      queryClient.invalidateQueries({ queryKey: [`/api/shops/owner/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] }); // Customer-facing cache
      toast({
        title: "Success",
        description: "Shop settings saved successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate();
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
      setCustomServices(prev => [...prev, service.trim()]);
    }
  };

  const removeCustomService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter(s => s !== service)
    }));
    setCustomServices(prev => prev.filter(s => s !== service));
  };

  const addCustomEquipment = (equipment: string) => {
    if (equipment.trim() && !formData.customEquipment.includes(equipment.trim())) {
      setFormData(prev => ({
        ...prev,
        customEquipment: [...prev.customEquipment, equipment.trim()]
      }));
      setCustomEquipment(prev => [...prev, equipment.trim()]);
    }
  };

  const removeCustomEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      customEquipment: prev.customEquipment.filter(e => e !== equipment)
    }));
    setCustomEquipment(prev => prev.filter(e => e !== equipment));
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

  if (shopsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/shop-dashboard')}
                className="text-gray-600 hover:text-rich-black p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-yellow rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-rich-black" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-rich-black">Complete Shop Settings</h1>
                  <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
                    Manage all your shop information and preferences
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={saveSettingsMutation.isPending}
              size="lg"
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-semibold px-4 sm:px-8 shadow-lg"
            >
              {saveSettingsMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-rich-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              )}
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          {/* Tab Navigation - Mobile Responsive */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Store className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Basic Info</span>
                <span className="sm:hidden">Basic</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Contact</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
              <TabsTrigger 
                value="location" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Location</span>
                <span className="sm:hidden">Location</span>
              </TabsTrigger>
              <TabsTrigger 
                value="business" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Business</span>
                <span className="sm:hidden">Business</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hours" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Hours</span>
                <span className="sm:hidden">Hours</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Basic Information Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                  Basic Shop Information
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Public information that customers will see
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm sm:text-base font-semibold">Public Shop Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Enter your public shop name"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="publicOwnerName" className="text-sm sm:text-base font-semibold">Public Owner Name</Label>
                    <Input
                      id="publicOwnerName"
                      value={formData.publicOwnerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, publicOwnerName: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Owner name visible to customers"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="internalName" className="text-sm sm:text-base font-semibold">Internal Shop Name</Label>
                    <Input
                      id="internalName"
                      value={formData.internalName}
                      onChange={(e) => setFormData(prev => ({ ...prev, internalName: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Internal reference name"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="slug" className="text-sm sm:text-base font-semibold">Shop URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="your-shop-url"
                    />
                    <p className="text-xs text-gray-500">
                      URL: printeasy.com/shop/{formData.slug || 'your-shop-url'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm sm:text-base font-semibold">Shop Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell customers about your shop, expertise, and what makes you special..."
                    rows={4}
                    className="text-sm sm:text-base"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                  Contact Information
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your contact details and owner information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="ownerFullName" className="text-sm sm:text-base font-semibold">Owner Full Name *</Label>
                    <Input
                      id="ownerFullName"
                      value={formData.ownerFullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerFullName: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Complete owner name"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm sm:text-base font-semibold">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm sm:text-base font-semibold">Public Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="ownerPhone" className="text-sm sm:text-base font-semibold">Owner Phone Number</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Owner's personal number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                  Location Details
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Complete address and location information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-sm sm:text-base font-semibold">Public Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                    placeholder="Short address for customers"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="completeAddress" className="text-sm sm:text-base font-semibold">Complete Address *</Label>
                  <Textarea
                    id="completeAddress"
                    value={formData.completeAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, completeAddress: e.target.value }))}
                    placeholder="Full detailed address with landmarks"
                    rows={3}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="pinCode" className="text-sm sm:text-base font-semibold">PIN Code *</Label>
                    <Input
                      id="pinCode"
                      value={formData.pinCode}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, pinCode: value }));
                        
                        // Auto-populate city and state when pincode is 6 digits
                        if (value.length === 6) {
                          try {
                            const response = await fetch(`/api/pincode/${value}`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.city && data.state) {
                                setFormData(prev => ({
                                  ...prev,
                                  city: data.city,
                                  state: data.state
                                }));
                                toast({
                                  title: "Location Updated",
                                  description: `City: ${data.city}, State: ${data.state}`
                                });
                              }
                            }
                          } catch (error) {
                            console.log('Pincode lookup failed:', error);
                          }
                        }
                      }}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="6-digit PIN"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="city" className="text-sm sm:text-base font-semibold">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Your city"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="state" className="text-sm sm:text-base font-semibold">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Your state"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Details Tab */}
          <TabsContent value="business" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {SERVICES.map((service) => (
                      <div key={service} className="flex items-center space-x-3">
                        <Checkbox
                          id={service}
                          checked={formData.services.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                          className="border-2"
                        />
                        <Label 
                          htmlFor={service} 
                          className="text-sm sm:text-base font-medium flex-1 cursor-pointer"
                        >
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm sm:text-base font-semibold">Custom Services</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom service..."
                        className="flex-1"
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
                          if (input) {
                            addCustomService(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.customServices.map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
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
                </CardContent>
              </Card>

              {/* Equipment */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                    Equipment Available
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {EQUIPMENT.map((equipment) => (
                      <div key={equipment} className="flex items-center space-x-3">
                        <Checkbox
                          id={equipment}
                          checked={formData.equipment.includes(equipment)}
                          onCheckedChange={() => toggleEquipment(equipment)}
                          className="border-2"
                        />
                        <Label 
                          htmlFor={equipment} 
                          className="text-sm sm:text-base font-medium flex-1 cursor-pointer"
                        >
                          {equipment}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm sm:text-base font-semibold">Custom Equipment</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom equipment..."
                        className="flex-1"
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
                          if (input) {
                            addCustomEquipment(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.customEquipment.map((equipment, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
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
                </CardContent>
              </Card>
            </div>

            {/* Business Experience */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                  Business Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="formationYear" className="text-sm sm:text-base font-semibold">Formation Year</Label>
                    <Input
                      id="formationYear"
                      value={formData.formationYear}
                      onChange={(e) => setFormData(prev => ({ ...prev, formationYear: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="YYYY"
                      maxLength={4}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="yearsOfExperience" className="text-sm sm:text-base font-semibold">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                      placeholder="Number of years"
                      type="number"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Working Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                  Working Hours & Availability
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Set your daily operating hours and 24/7 options
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {DAYS.map((day, index) => (
                  <div key={day} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-base sm:text-lg capitalize">{DAY_LABELS[index]}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.workingHours[day as keyof typeof formData.workingHours].is24Hours}
                            onCheckedChange={(checked) => updateWorkingHours(day, 'is24Hours', checked)}
                            className="scale-75 sm:scale-100"
                          />
                          <Label className="text-xs sm:text-sm font-medium">24/7</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!formData.workingHours[day as keyof typeof formData.workingHours].closed}
                            onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                            className="scale-75 sm:scale-100"
                          />
                          <Label className="text-xs sm:text-sm font-medium">Open</Label>
                        </div>
                      </div>
                    </div>

                    {!formData.workingHours[day as keyof typeof formData.workingHours].closed && 
                     !formData.workingHours[day as keyof typeof formData.workingHours].is24Hours && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Opening Time</Label>
                          <Input
                            type="time"
                            value={formData.workingHours[day as keyof typeof formData.workingHours].open}
                            onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                            className="h-8 sm:h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Closing Time</Label>
                          <Input
                            type="time"
                            value={formData.workingHours[day as keyof typeof formData.workingHours].close}
                            onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                            className="h-8 sm:h-10"
                          />
                        </div>
                      </div>
                    )}

                    {formData.workingHours[day as keyof typeof formData.workingHours].is24Hours && (
                      <div className="text-center py-2">
                        <Badge className="bg-brand-yellow text-rich-black">Open 24 Hours</Badge>
                      </div>
                    )}

                    {formData.workingHours[day as keyof typeof formData.workingHours].closed && (
                      <div className="text-center py-2">
                        <Badge variant="secondary">Closed</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications & Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shop Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                    Shop Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base font-semibold">Shop Status</Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Control whether your shop accepts new orders
                      </p>
                    </div>
                    <Switch
                      checked={formData.isOnline}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnline: checked }))}
                      className="scale-75 sm:scale-100"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base font-semibold">Walk-in Orders</Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Accept customers who walk in directly
                      </p>
                    </div>
                    <Switch
                      checked={formData.acceptsWalkinOrders}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptsWalkinOrders: checked }))}
                      className="scale-75 sm:scale-100"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base font-semibold">New Orders</Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Get notified when you receive new orders
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.newOrders}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, newOrders: checked }
                        }))
                      }
                      className="scale-75 sm:scale-100"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base font-semibold">Status Updates</Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Notifications for order status changes
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.statusUpdates}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, statusUpdates: checked }
                        }))
                      }
                      className="scale-75 sm:scale-100"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base font-semibold">Customer Messages</Label>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Chat notifications from customers
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.customerMessages}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, customerMessages: checked }
                        }))
                      }
                      className="scale-75 sm:scale-100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}