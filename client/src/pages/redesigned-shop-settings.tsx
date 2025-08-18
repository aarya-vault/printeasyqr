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
  Star, AlertCircle, CheckCircle2, Info
} from 'lucide-react';

const SERVICES = [
  'Document Printing',
  'Photo Printing', 
  'Photocopying',
  'Scanning',
  'Binding & Lamination',
  'Business Cards',
  'Letterheads',
  'Brochures',
  'Posters',
  'Large Format Printing',
  'ID Cards',
  'Stationery'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RedesignedShopSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customEquipmentInput, setCustomEquipmentInput] = useState('');

  // ✅ PROPERLY ENABLED: With correct authentication guards
  const { data: shop, isLoading } = useQuery({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner'),
    staleTime: 300000,
    retry: 2,
  });

  const currentShop = shop && typeof shop === 'object' && 'shop' in shop ? (shop as any).shop : shop;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    services: [] as string[],
    customServices: [] as string[],
    equipment: [] as string[],
    customEquipment: [] as string[],
    workingHours: {} as Record<string, { open: string; close: string; closed: boolean; is24Hours: boolean }>,
    isOnline: true,
    acceptsWalkinOrders: true,
    notifications: {
      newOrders: true,
      statusUpdates: true,
      customerMessages: true
    }
  });

  // Initialize form data when shop data loads - Enhanced debugging
  useEffect(() => {
    console.log('🔍 REDESIGNED SHOP SETTINGS - Raw API data:', shop);
    console.log('🔍 REDESIGNED SHOP SETTINGS - Processed currentShop:', currentShop);
    
    if (currentShop) {
      console.log('🔍 REDESIGNED SHOP SETTINGS - Setting form data with:', {
        name: currentShop.name,
        address: currentShop.address,
        phone: currentShop.phone,
        email: currentShop.email,
        services: currentShop.services,
        workingHours: currentShop.workingHours
      });
      
      console.log('🔧 WORKING HOURS DEBUG - Raw working hours:', currentShop.workingHours);
      console.log('🔧 WORKING HOURS DEBUG - Type:', typeof currentShop.workingHours);
      console.log('🔧 CUSTOM EQUIPMENT DEBUG - Raw custom equipment:', currentShop.customEquipment);
      console.log('🔧 CUSTOM EQUIPMENT DEBUG - Type:', typeof currentShop.customEquipment);
      
      // CRITICAL FIX: Ensure working hours is always an object with proper structure
      const normalizedWorkingHours = currentShop.workingHours || {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Ensure all days have proper structure for frontend
      days.forEach(day => {
        if (!normalizedWorkingHours[day]) {
          normalizedWorkingHours[day] = {
            open: '09:00',
            close: '18:00',
            closed: false,
            is24Hours: false
          };
        }
      });
      
      console.log('🔧 NORMALIZED WORKING HOURS:', normalizedWorkingHours);

      setFormData({
        name: currentShop.name || '',
        description: currentShop.description || '',
        address: currentShop.address || '',
        phone: currentShop.phone || '',
        email: currentShop.email || '',
        services: currentShop.services || [],
        customServices: currentShop.customServices || [],
        equipment: currentShop.equipment || [],
        customEquipment: currentShop.customEquipment || [],
        workingHours: normalizedWorkingHours,
        isOnline: currentShop.isOnline ?? true,
        acceptsWalkinOrders: currentShop.acceptsWalkinOrders ?? true,
        notifications: currentShop.notifications || {
          newOrders: true,
          statusUpdates: true,
          customerMessages: true
        }
      });
      console.log('🔍 REDESIGNED SHOP SETTINGS - Form data updated successfully');
    } else {
      console.log('🔍 REDESIGNED SHOP SETTINGS - No currentShop data available');
    }
  }, [currentShop, shop]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        ...formData,
        customServices: formData.customServices || [],
        customEquipment: formData.customEquipment || []
      };
      console.log('🔍 REDESIGNED SHOP SETTINGS - Saving form data:', dataToSave);
      console.log('🔧 CUSTOM EQUIPMENT BEFORE SAVE:', {
        count: formData.customEquipment.length,
        items: formData.customEquipment
      });
      const response = await apiRequest('/api/shops/settings', 'PATCH', dataToSave);
      return response.json();
    },
    onSuccess: (response) => {
      console.log('✅ SHOP SETTINGS - Save successful, invalidating all caches');
      // CRITICAL FIX: When shop owners update their settings, invalidate ALL relevant caches
      queryClient.invalidateQueries({ queryKey: [`/api/shops/owner/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] }); // Customer-facing cache
      
      // IMMEDIATE REFRESH: Also refetch the current shop data immediately
      queryClient.refetchQueries({ queryKey: [`/api/shops/owner/${user?.id}`] });
      
      // FORCE IMMEDIATE UPDATE: Set stale time to 0 to force immediate refresh across all components
      queryClient.setQueryData(['/api/shops'], (oldData: any) => {
        if (!oldData || !response?.shop) return oldData;
        return oldData.map((shop: any) => shop.id === response.shop.id ? response.shop : shop);
      });
      
      // Update the form data with the fresh data from the server response
      if (response && response.shop) {
        console.log('✅ SHOP SETTINGS - Updating form with server response data');
        const updatedShop = response.shop;
        setFormData({
          name: updatedShop.name || '',
          description: updatedShop.description || '',
          address: updatedShop.address || '',
          phone: updatedShop.phone || '',
          email: updatedShop.email || '',
          services: updatedShop.services || [],
          customServices: updatedShop.customServices || [],
          equipment: updatedShop.equipment || [],
          customEquipment: updatedShop.customEquipment || [],
          workingHours: updatedShop.workingHours || {},
          isOnline: updatedShop.isOnline ?? true,
          acceptsWalkinOrders: updatedShop.acceptsWalkinOrders ?? true,
          notifications: updatedShop.notifications || {
            newOrders: true,
            statusUpdates: true,
            customerMessages: true
          }
        });
      }
      
      toast({
        title: "Success",
        description: "Shop settings saved and synchronized successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ SHOP SETTINGS - Save failed:', error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${error?.message || 'Unknown error'}`,
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

  const updateWorkingHours = (day: string, field: string, value: any) => {
    const dayKey = day.toLowerCase();
    const currentDayHours = formData.workingHours[dayKey] || { open: '09:00', close: '18:00', closed: false, is24Hours: false };
    
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...currentDayHours,
          [field]: value
        }
      }
    }));
  };

  const addCustomService = () => {
    const trimmedInput = customServiceInput.trim();
    if (!trimmedInput || formData.customServices.length >= 10) return;
    if (formData.customServices.includes(trimmedInput)) {
      toast({
        title: "Duplicate Service",
        description: "This custom service already exists",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      customServices: [...prev.customServices, trimmedInput]
    }));
    setCustomServiceInput('');
  };

  const removeCustomService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter((_, i) => i !== index)
    }));
  };

  const addCustomEquipment = () => {
    const trimmedInput = customEquipmentInput.trim();
    if (!trimmedInput || formData.customEquipment.length >= 10) return;
    if (formData.customEquipment.includes(trimmedInput)) {
      toast({
        title: "Duplicate Equipment",
        description: "This custom equipment already exists",
        variant: "destructive"
      });
      return;
    }
    
    const updatedEquipment = [...formData.customEquipment, trimmedInput];
    console.log('🔧 ADDING CUSTOM EQUIPMENT:', {
      input: trimmedInput,
      currentEquipment: formData.customEquipment,
      newEquipment: updatedEquipment
    });
    
    setFormData(prev => ({
      ...prev,
      customEquipment: updatedEquipment
    }));
    setCustomEquipmentInput('');
  };

  const removeCustomEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customEquipment: prev.customEquipment.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate('/shop-dashboard')}
                className="hover:bg-brand-yellow/10 font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-rich-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-rich-black">Shop Settings</h1>
                  <p className="text-gray-600">Manage your shop preferences and configuration</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saveSettingsMutation.isPending}
              size="lg"
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-semibold px-8 shadow-lg"
            >
              {saveSettingsMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-rich-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-5 gap-2">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-3"
              >
                <Store className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="hours" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-3"
              >
                <Clock className="w-4 h-4 mr-2" />
                Hours
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-3"
              >
                <Package className="w-4 h-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-3"
              >
                <Settings className="w-4 h-4 mr-2" />
                Equipment
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-brand-yellow data-[state=active]:text-rich-black font-medium py-3"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-brand-yellow" />
                  Shop Information
                </CardTitle>
                <CardDescription className="text-base">
                  Basic details that customers will see about your print shop
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold">Shop Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 text-base"
                      placeholder="Enter your shop name"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-semibold">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-12 text-base"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold">Shop Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell customers about your shop, expertise, and what makes you special..."
                    rows={4}
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-semibold">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-12 text-base"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-base font-semibold">Shop Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="h-12 text-base"
                      placeholder="Complete shop address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hours & Availability Tab */}
          <TabsContent value="hours" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Working Hours */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-brand-yellow" />
                      Working Hours
                    </CardTitle>
                    <CardDescription className="text-base">
                      Set your shop's operating hours for each day
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    {DAYS.map((day) => {
                      const dayKey = day.toLowerCase();
                      const rawHours = formData.workingHours[dayKey] || {};
                      
                      // Handle both database format (isOpen, openTime, closeTime) and legacy format (open, close, closed)
                      const hours = {
                        open: (rawHours as any).openTime || (rawHours as any).open || '09:00',
                        close: (rawHours as any).closeTime || (rawHours as any).close || '18:00',
                        closed: (rawHours as any).isOpen === false || (rawHours as any).closed || false,
                        is24Hours: (rawHours as any).is24Hours || false
                      };
                      
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-24">
                            <span className="font-semibold text-rich-black">{day}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={!hours.closed}
                                onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                                className="data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow"
                              />
                              <span className="text-sm font-medium">Open</span>
                            </div>
                            
                            {!hours.closed && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={hours.is24Hours}
                                    onCheckedChange={(checked) => {
                                      updateWorkingHours(day, 'is24Hours', checked);
                                      if (checked) {
                                        updateWorkingHours(day, 'open', '00:00');
                                        updateWorkingHours(day, 'close', '23:59');
                                      }
                                    }}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                  <span className="text-sm font-medium text-green-600">24/7</span>
                                </div>
                                
                                {hours.is24Hours ? (
                                  <Badge className="bg-green-500 text-white font-bold">
                                    Open 24 Hours
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="time"
                                      value={hours.open}
                                      onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                                      className="w-32"
                                    />
                                    <span className="text-gray-500 font-medium">to</span>
                                    <Input
                                      type="time"
                                      value={hours.close}
                                      onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                                      className="w-32"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                            
                            {hours.closed && (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                Closed
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Availability Settings */}
              <div>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="flex items-center gap-3">
                      <Power className="w-6 h-6 text-brand-yellow" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold text-rich-black">Shop Online</p>
                        <p className="text-sm text-gray-600">Accept new orders</p>
                      </div>
                      <Switch
                        checked={formData.isOnline}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnline: checked }))}
                        className="data-[state=checked]:bg-brand-yellow"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold text-rich-black">Walk-in Orders</p>
                        <p className="text-sm text-gray-600">Allow immediate orders</p>
                      </div>
                      <Switch
                        checked={formData.acceptsWalkinOrders}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptsWalkinOrders: checked }))}
                        className="data-[state=checked]:bg-brand-yellow"
                      />
                    </div>

                    <div className="p-4 bg-brand-yellow/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-brand-yellow" />
                        <span className="font-semibold text-rich-black">Status</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {formData.isOnline ? "Currently accepting orders" : "Currently offline"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-brand-yellow" />
                  Services Offered
                </CardTitle>
                <CardDescription className="text-base">
                  Select all services your print shop provides to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SERVICES.map((service) => (
                    <div 
                      key={service} 
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.services.includes(service) 
                          ? 'border-brand-yellow bg-brand-yellow/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleService(service)}
                    >
                      <Checkbox
                        id={service}
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                        className="data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow"
                      />
                      <label
                        htmlFor={service}
                        className="font-medium text-rich-black cursor-pointer select-none"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
                
                {/* Custom Services Section */}
                <Separator className="my-8" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-rich-black">Custom Services</h3>
                    <Badge variant="outline" className="text-xs">Up to 10</Badge>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add custom service..."
                      value={customServiceInput}
                      onChange={(e) => setCustomServiceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
                      className="flex-1"
                      maxLength={50}
                    />
                    <Button 
                      onClick={addCustomService}
                      disabled={!customServiceInput.trim() || formData.customServices.length >= 10}
                      className="bg-brand-yellow hover:bg-yellow-600 text-black"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.customServices.length > 0 && (
                    <div className="grid gap-2">
                      {formData.customServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-blue-900">{service}</span>
                          <Button
                            onClick={() => removeCustomService(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-rich-black mb-2">
                    Total Services: {formData.services.length + formData.customServices.length}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Standard Services ({formData.services.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.services.map((service) => (
                          <Badge key={service} className="bg-brand-yellow text-rich-black">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {formData.customServices.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Custom Services ({formData.customServices.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.customServices.map((service) => (
                            <Badge key={service} variant="outline" className="border-blue-300 text-blue-700">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-brand-yellow" />
                  Equipment Available
                </CardTitle>
                <CardDescription className="text-base">
                  Add equipment your shop has available for various printing needs
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-rich-black">Custom Equipment</h3>
                    <Badge variant="outline" className="text-xs">Up to 10</Badge>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add custom equipment..."
                      value={customEquipmentInput}
                      onChange={(e) => setCustomEquipmentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomEquipment()}
                      className="flex-1"
                      maxLength={50}
                    />
                    <Button 
                      onClick={addCustomEquipment}
                      disabled={!customEquipmentInput.trim() || formData.customEquipment.length >= 10}
                      className="bg-brand-yellow hover:bg-yellow-600 text-black"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.customEquipment.length > 0 && (
                    <div className="grid gap-2">
                      {formData.customEquipment.map((equipment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-green-900">{equipment}</span>
                          <Button
                            onClick={() => removeCustomEquipment(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-rich-black mb-2">
                    Total Equipment: {formData.equipment.length + formData.customEquipment.length}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Standard Equipment ({formData.equipment.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.equipment.map((equipment) => (
                          <Badge key={equipment} className="bg-brand-yellow text-rich-black">
                            {equipment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {formData.customEquipment.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Custom Equipment ({formData.customEquipment.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.customEquipment.map((equipment) => (
                            <Badge key={equipment} variant="outline" className="border-green-300 text-green-700">
                              {equipment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-brand-yellow" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-base">
                  Choose when you want to receive notifications about your shop
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 border rounded-lg">
                    <div>
                      <p className="font-semibold text-rich-black text-lg">New Orders</p>
                      <p className="text-gray-600">Get notified when customers place new orders</p>
                    </div>
                    <Switch
                      checked={formData.notifications.newOrders}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, newOrders: checked }
                        }))
                      }
                      className="data-[state=checked]:bg-brand-yellow"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 border rounded-lg">
                    <div>
                      <p className="font-semibold text-rich-black text-lg">Status Updates</p>
                      <p className="text-gray-600">Get notified about order status changes</p>
                    </div>
                    <Switch
                      checked={formData.notifications.statusUpdates}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, statusUpdates: checked }
                        }))
                      }
                      className="data-[state=checked]:bg-brand-yellow"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 border rounded-lg">
                    <div>
                      <p className="font-semibold text-rich-black text-lg">Customer Messages</p>
                      <p className="text-gray-600">Get notified when customers send messages</p>
                    </div>
                    <Switch
                      checked={formData.notifications.customerMessages}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, customerMessages: checked }
                        }))
                      }
                      className="data-[state=checked]:bg-brand-yellow"
                    />
                  </div>
                </div>

                <div className="p-6 bg-brand-yellow/10 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-yellow" />
                    <span className="font-semibold text-rich-black">Notification Status</span>
                  </div>
                  <p className="text-gray-700">
                    You'll receive notifications via the dashboard and any connected communication methods.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}