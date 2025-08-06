import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
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
  Users, Package, MessageSquare, Shield, Power
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

export default function ShopSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch shop details
  const { data: shop, isLoading, error } = useQuery({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    select: (data: any) => {
      console.log('✅ Shop data received:', data);
      // Handle both direct shop data and nested shop format
      return data?.shop || data;
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    services: [] as string[],
    equipment: [] as string[],
    workingHours: {} as Record<string, { open: string; close: string; closed: boolean }>,
    isOnline: true,
    acceptingOrders: true,
    notifications: {
      newOrders: true,
      statusUpdates: true,
      customerMessages: true
    }
  });

  // Initialize form data when shop data loads
  useEffect(() => {
    console.log('🔧 SETTINGS - useEffect triggered, shop:', shop);
    if (shop) {
      console.log('🔍 Shop data loaded for settings:', {
        name: shop.name,
        services: shop.services,
        equipment: shop.equipment,
        workingHours: shop.workingHours,
        email: shop.email,
        address: shop.address,
        completeAddress: shop.completeAddress,
        publicOwnerName: shop.publicOwnerName,
        internalName: shop.internalName,
        slug: shop.slug
      });
      
      const newFormData = {
        name: shop.name || shop.publicOwnerName || '',
        description: shop.description || shop.completeAddress || '',
        address: shop.address || shop.completeAddress || '',
        phone: shop.phone || shop.ownerPhone || '',
        email: shop.email || '',
        services: Array.isArray(shop.services) ? shop.services : (shop.services ? JSON.parse(shop.services) : []),
        equipment: Array.isArray(shop.equipment) ? shop.equipment : (shop.equipment ? JSON.parse(shop.equipment) : []),
        workingHours: typeof shop.workingHours === 'object' ? shop.workingHours : (shop.workingHours ? JSON.parse(shop.workingHours) : {}),
        isOnline: shop.isOnline ?? true,
        acceptingOrders: shop.acceptsWalkinOrders ?? true,
        notifications: shop.notifications || {
          newOrders: true,
          statusUpdates: true,
          customerMessages: true
        }
      };
      
      console.log('🚀 SETTINGS - Setting form data:', newFormData);
      setFormData(newFormData);
    }
  }, [shop]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Sending shop settings update:', formData);
      const { apiRequest } = await import('@/lib/queryClient');
      const response = await apiRequest('/api/shops/settings', 'PATCH', formData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all shop-related queries for real-time synchronization
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops/owner', user?.id] });
      if (shop?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/shops/slug/${shop.slug}`] });
      }
      // Also invalidate order queries to refresh shop data in customer views
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Success",
        description: "Shop settings saved successfully. All pages will update automatically."
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

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const dayKey = day.toLowerCase();
    const currentDayHours = formData.workingHours[dayKey] || { open: '09:00', close: '18:00', closed: false };
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/shop-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-rich-black">Shop Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Shop Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Shop Information
            </CardTitle>
            <CardDescription>
              Basic details about your print shop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell customers about your shop..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Offered */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
            <CardDescription>
              Select all services your shop provides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICES.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.services.includes(service)}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <label
                    htmlFor={service}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>
              Set your shop's operating hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => {
              const dayKey = day.toLowerCase();
              const hours = formData.workingHours[dayKey] || { open: '09:00', close: '18:00', closed: false };
              
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24">
                    <span className="text-sm font-medium">{day}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                    />
                    
                    {!hours.closed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}
                    
                    {hours.closed && (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Shop Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Shop Status
            </CardTitle>
            <CardDescription>
              Control your shop's availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Online Status</p>
                <p className="text-sm text-gray-500">
                  Show your shop as online to customers
                </p>
              </div>
              <Switch
                checked={formData.isOnline}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isOnline: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Accepting Orders</p>
                <p className="text-sm text-gray-500">
                  Allow customers to place new orders
                </p>
              </div>
              <Switch
                checked={formData.acceptingOrders}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, acceptingOrders: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Orders</p>
                <p className="text-sm text-gray-500">
                  Get notified when customers place orders
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
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status Updates</p>
                <p className="text-sm text-gray-500">
                  Notifications about order status changes
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
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer Messages</p>
                <p className="text-sm text-gray-500">
                  Get notified when customers send messages
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}