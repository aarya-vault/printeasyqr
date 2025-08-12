import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Settings,
  Save,
  X,
  Plus
} from 'lucide-react';

interface ShopApplication {
  id: number;
  publicShopName: string;
  shopSlug: string;
  ownerFullName: string;
  publicOwnerName?: string;
  publicAddress: string;
  publicContactNumber: string;
  internalShopName: string;
  email: string;
  phoneNumber: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  googleMapsLink?: string;
  services: string[];
  customServices?: string[];
  equipment: string[];
  customEquipment?: string[];
  yearsOfExperience: string;
  workingHours: {
    monday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    tuesday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    wednesday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    thursday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    friday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    saturday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
    sunday: { open: string; close: string; closed?: boolean; is24Hours?: boolean };
  };
  acceptsWalkinOrders: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShopApplicationEditModalProps {
  application: ShopApplication;
  onClose: () => void;
  onUpdate: () => void;
}

const dayNames = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const availableServices = [
  'printing', 'scanning', 'binding', 'lamination', 'photocopying',
  'digital printing', 'large format printing', 'business cards',
  'banners', 'posters', 'brochures', 'flyers'
];

const availableEquipment = [
  'laser printer', 'inkjet printer', 'scanner', 'laminator',
  'binding machine', 'plotter', 'cutting machine', 'photocopier'
];

export default function ShopApplicationEditModal({ 
  application, 
  onClose, 
  onUpdate 
}: ShopApplicationEditModalProps) {
  const [editingApplication, setEditingApplication] = useState<ShopApplication>(application);
  const [isLoading, setIsLoading] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customEquipmentInput, setCustomEquipmentInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/admin/shop-applications/${application.id}`, 'PUT', editingApplication);

      // Comprehensive query invalidation for real-time synchronization
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/admin/shop-applications/${application.id}`] });
      
      toast({
        title: 'Application Updated',
        description: 'Shop application has been updated successfully',
      });

      onUpdate();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save application changes',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed' | 'is24Hours', value: string | boolean) => {
    const dayKey = day.toLowerCase() as keyof typeof editingApplication.workingHours;
    const currentDayHours = editingApplication.workingHours[dayKey] || { open: '09:00', close: '18:00', closed: false, is24Hours: false };
    
    setEditingApplication({
      ...editingApplication,
      workingHours: {
        ...editingApplication.workingHours,
        [dayKey]: {
          ...currentDayHours,
          [field]: value,
        },
      },
    });
  };

  const toggleService = (service: string) => {
    const services = editingApplication.services.includes(service)
      ? editingApplication.services.filter(s => s !== service)
      : [...editingApplication.services, service];
    
    setEditingApplication({ ...editingApplication, services });
  };

  const toggleEquipment = (equipment: string) => {
    const equipmentList = editingApplication.equipment.includes(equipment)
      ? editingApplication.equipment.filter(e => e !== equipment)
      : [...editingApplication.equipment, equipment];
    
    setEditingApplication({ ...editingApplication, equipment: equipmentList });
  };

  const addCustomService = () => {
    if (customServiceInput.trim()) {
      const currentCustomServices = editingApplication.customServices || [];
      if (!currentCustomServices.includes(customServiceInput.trim()) && currentCustomServices.length < 10) {
        setEditingApplication({
          ...editingApplication,
          customServices: [...currentCustomServices, customServiceInput.trim()]
        });
        setCustomServiceInput('');
      }
    }
  };

  const removeCustomService = (service: string) => {
    const currentCustomServices = editingApplication.customServices || [];
    setEditingApplication({
      ...editingApplication,
      customServices: currentCustomServices.filter(s => s !== service)
    });
  };

  const addCustomEquipment = () => {
    if (customEquipmentInput.trim()) {
      const currentCustomEquipment = editingApplication.customEquipment || [];
      if (!currentCustomEquipment.includes(customEquipmentInput.trim()) && currentCustomEquipment.length < 10) {
        setEditingApplication({
          ...editingApplication,
          customEquipment: [...currentCustomEquipment, customEquipmentInput.trim()]
        });
        setCustomEquipmentInput('');
      }
    }
  };

  const removeCustomEquipment = (equipment: string) => {
    const currentCustomEquipment = editingApplication.customEquipment || [];
    setEditingApplication({
      ...editingApplication,
      customEquipment: currentCustomEquipment.filter(e => e !== equipment)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-brand-yellow" />
            <h2 className="text-2xl font-bold text-rich-black">Edit Application: {application.publicShopName}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="bg-white border-rich-black text-rich-black hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="w-5 h-5 text-brand-yellow" />
                      <span>Shop Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Public Shop Name *
                        </label>
                        <Input
                          value={editingApplication.publicShopName}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            publicShopName: e.target.value
                          })}
                          placeholder="The name customers will see"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Shop Slug *
                        </label>
                        <Input
                          value={editingApplication.shopSlug}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            shopSlug: e.target.value
                          })}
                          placeholder="shop-url-slug"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        Internal Shop Name
                      </label>
                      <Input
                        value={editingApplication.internalShopName}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          internalShopName: e.target.value
                        })}
                        placeholder="Internal reference name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Owner Full Name *
                        </label>
                        <Input
                          value={editingApplication.ownerFullName}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            ownerFullName: e.target.value
                          })}
                          placeholder="Full legal name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Public Owner Name
                        </label>
                        <Input
                          value={editingApplication.publicOwnerName || ''}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            publicOwnerName: e.target.value
                          })}
                          placeholder="Name shown to customers"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        Years of Experience
                      </label>
                      <Input
                        value={editingApplication.yearsOfExperience}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          yearsOfExperience: e.target.value
                        })}
                        placeholder="e.g., 5+, 10+"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-brand-yellow" />
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          value={editingApplication.email}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            email: e.target.value
                          })}
                          placeholder="owner@shopname.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Phone Number *
                        </label>
                        <Input
                          value={editingApplication.phoneNumber}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            phoneNumber: e.target.value
                          })}
                          placeholder="10-digit phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        Public Contact Number
                      </label>
                      <Input
                        value={editingApplication.publicContactNumber}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          publicContactNumber: e.target.value
                        })}
                        placeholder="Number shown to customers"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Public Address *
                      </label>
                      <Input
                        value={editingApplication.publicAddress}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          publicAddress: e.target.value
                        })}
                        placeholder="Address shown to customers"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        Complete Address
                      </label>
                      <Textarea
                        value={editingApplication.completeAddress}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          completeAddress: e.target.value
                        })}
                        placeholder="Full address with details"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        Pin Code * (Auto-fetches city & state)
                      </label>
                      <Input
                        value={editingApplication.pinCode}
                        onChange={async (e) => {
                          const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setEditingApplication({
                            ...editingApplication,
                            pinCode: pincode
                          });
                          
                          // Auto-fetch city and state when PIN code is complete
                          if (pincode.length === 6) {
                            try {
                              const response = await fetch(`/api/pincode/location/${pincode}`);
                              const result = await response.json();
                              
                              if (result.success && result.data) {
                                setEditingApplication(prev => ({
                                  ...prev,
                                  city: result.data.city,
                                  state: result.data.state
                                }));
                              }
                            } catch (error) {
                              console.error('PIN code lookup failed:', error);
                            }
                          }
                        }}
                        placeholder="6-digit PIN (e.g., 380059)"
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        City and state will be auto-filled when you enter a valid PIN code
                      </p>
                    </div>
                    
                    {/* Auto-populated City and State fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          City * (Auto-filled from PIN)
                        </label>
                        <Input
                          value={editingApplication.city || ''}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            city: e.target.value
                          })}
                          placeholder="City will be auto-filled"
                          className="bg-gray-50"
                          readOnly={!!editingApplication.pinCode && editingApplication.pinCode.length === 6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          State * (Auto-filled from PIN)
                        </label>
                        <Input
                          value={editingApplication.state || ''}
                          onChange={(e) => setEditingApplication({
                            ...editingApplication,
                            state: e.target.value
                          })}
                          placeholder="State will be auto-filled"
                          className="bg-gray-50"
                          readOnly={!!editingApplication.pinCode && editingApplication.pinCode.length === 6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Google Maps Link (Optional)
                      </label>
                      <Input
                        value={editingApplication.googleMapsLink || ''}
                        onChange={(e) => setEditingApplication({
                          ...editingApplication,
                          googleMapsLink: e.target.value
                        })}
                        placeholder="https://maps.google.com/..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Google Maps URL to help customers find the shop easily
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {availableServices.map((service) => (
                        <label key={service} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingApplication.services.includes(service)}
                            onChange={() => toggleService(service)}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{service}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Custom Services Section */}
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-rich-black">Custom Services</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Add custom service (max 10)"
                          value={customServiceInput}
                          onChange={(e) => setCustomServiceInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                          disabled={(editingApplication.customServices?.length || 0) >= 10}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomService}
                          disabled={!customServiceInput.trim() || (editingApplication.customServices?.length || 0) >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {editingApplication.customServices && editingApplication.customServices.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editingApplication.customServices.map((service: string) => (
                            <Badge key={service} variant="secondary" className="flex items-center gap-1">
                              {service}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeCustomService(service)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Custom services: {editingApplication.customServices?.length || 0}/10
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Equipment Available (Optional)</CardTitle>
                    <p className="text-sm text-medium-gray">Select equipment available at your shop (optional)</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {availableEquipment.map((equipment) => (
                        <label key={equipment} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingApplication.equipment?.includes(equipment) || false}
                            onChange={() => toggleEquipment(equipment)}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{equipment}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Custom Equipment Section */}
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-rich-black">Custom Equipment</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Add custom equipment (max 10)"
                          value={customEquipmentInput}
                          onChange={(e) => setCustomEquipmentInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
                          disabled={(editingApplication.customEquipment?.length || 0) >= 10}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomEquipment}
                          disabled={!customEquipmentInput.trim() || (editingApplication.customEquipment?.length || 0) >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {editingApplication.customEquipment && editingApplication.customEquipment.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editingApplication.customEquipment.map((equipment: string) => (
                            <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                              {equipment}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeCustomEquipment(equipment)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Custom equipment: {editingApplication.customEquipment?.length || 0}/10
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingApplication.acceptsWalkinOrders}
                        onCheckedChange={(checked) => setEditingApplication({
                          ...editingApplication,
                          acceptsWalkinOrders: checked
                        })}
                      />
                      <label className="text-sm font-medium">Accept Walk-in Orders</label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Working Hours Tab */}
              <TabsContent value="hours" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-brand-yellow" />
                      <span>Working Hours</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dayNames.map((day) => {
                      const dayHours = editingApplication.workingHours[day.key as keyof typeof editingApplication.workingHours] || { open: '09:00', close: '18:00', closed: false, is24Hours: false };
                      return (
                        <div key={day.key} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-20 font-medium">{day.label}</div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={!dayHours.closed}
                                    onCheckedChange={(checked) => {
                                      updateWorkingHours(day.key, 'closed', !checked);
                                      if (!checked) {
                                        updateWorkingHours(day.key, 'is24Hours', false);
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{dayHours.closed ? 'Closed' : 'Open'}</span>
                                </div>
                                {!dayHours.closed && (
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={dayHours.is24Hours || false}
                                      onCheckedChange={(checked) => {
                                        updateWorkingHours(day.key, 'is24Hours', checked);
                                        if (checked) {
                                          updateWorkingHours(day.key, 'open', '00:00');
                                          updateWorkingHours(day.key, 'close', '23:59');
                                        }
                                      }}
                                      className="data-[state=checked]:bg-brand-yellow"
                                    />
                                    <span className="text-sm text-brand-yellow font-medium">24/7</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {!dayHours.closed && !dayHours.is24Hours && (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={dayHours.open}
                                  onChange={(e) => updateWorkingHours(day.key, 'open', e.target.value)}
                                  className="w-32"
                                />
                                <span>to</span>
                                <Input
                                  type="time"
                                  value={dayHours.close}
                                  onChange={(e) => updateWorkingHours(day.key, 'close', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                            )}
                            
                            {!dayHours.closed && dayHours.is24Hours && (
                              <div className="flex items-center">
                                <Badge variant="outline" className="border-brand-yellow text-brand-yellow">
                                  Open 24 Hours
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}