import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
  Briefcase,
  Plus
} from 'lucide-react';

interface ShopApplication {
  id: number;
  publicShopName: string;
  publicOwnerName?: string;
  publicAddress: string;
  publicContactNumber?: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  city: string;
  state: string;
  pinCode: string;
  services: string[];
  customServices?: string[];
  equipment: string[];
  customEquipment?: string[];
  yearsOfExperience: string;
  workingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  acceptsWalkinOrders: boolean;
  shopSlug: string;
  status: string;
  adminNotes?: string;
}

interface ComprehensiveAdminApplicationEditProps {
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

const serviceOptions = [
  'Printing',
  'Photocopying',
  'Scanning',
  'Binding',
  'Lamination',
  'Banner Printing',
  'Business Cards',
  'Document Editing',
  'Photo Printing',
  'T-shirt Printing'
];

const equipmentOptions = [
  'Laser Printer',
  'Inkjet Printer',
  'Scanner',
  'Photocopier',
  'Laminator',
  'Binding Machine',
  'Paper Cutter',
  'Computer Terminal',
  'Large Format Printer',
  'Card Printer'
];

export default function ComprehensiveAdminApplicationEdit({ 
  application, 
  onClose, 
  onUpdate 
}: ComprehensiveAdminApplicationEditProps) {
  const [editingApplication, setEditingApplication] = useState<ShopApplication>(application);
  const [customServices, setCustomServices] = useState<string[]>(application.customServices || []);
  const [customEquipment, setCustomEquipment] = useState<string[]>(application.customEquipment || []);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/shop-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingApplication,
          customServices: customServices.filter(Boolean),
          customEquipment: customEquipment.filter(Boolean),
          services: [...editingApplication.services, ...customServices.filter(Boolean)],
          equipment: [...editingApplication.equipment, ...customEquipment.filter(Boolean)]
        }),
      });

      if (!response.ok) throw new Error('Failed to update application');

      toast({
        title: 'Application Updated',
        description: 'Shop application has been saved successfully',
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

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setEditingApplication({
      ...editingApplication,
      workingHours: {
        ...editingApplication.workingHours,
        [day]: {
          ...editingApplication.workingHours[day as keyof typeof editingApplication.workingHours],
          [field]: value,
        },
      },
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
            <Tabs defaultValue="public" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="public">Public Info</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              {/* Public Information Tab */}
              <TabsContent value="public" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="w-5 h-5 text-brand-yellow" />
                      <span>Public Shop Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Shop Name</label>
                        <Input
                          value={editingApplication.publicShopName}
                          onChange={(e) => setEditingApplication({ ...editingApplication, publicShopName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Shop Slug</label>
                        <Input
                          value={editingApplication.shopSlug}
                          onChange={(e) => setEditingApplication({ ...editingApplication, shopSlug: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Owner Name</label>
                        <Input
                          value={editingApplication.publicOwnerName || ''}
                          onChange={(e) => setEditingApplication({ ...editingApplication, publicOwnerName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Contact Number</label>
                        <Input
                          value={editingApplication.publicContactNumber || ''}
                          onChange={(e) => setEditingApplication({ ...editingApplication, publicContactNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Public Address</label>
                      <Textarea
                        value={editingApplication.publicAddress}
                        onChange={(e) => setEditingApplication({ ...editingApplication, publicAddress: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">City</label>
                        <Input
                          value={editingApplication.city}
                          onChange={(e) => setEditingApplication({ ...editingApplication, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">State</label>
                        <Input
                          value={editingApplication.state}
                          onChange={(e) => setEditingApplication({ ...editingApplication, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Pin Code</label>
                        <Input
                          value={editingApplication.pinCode}
                          onChange={(e) => setEditingApplication({ ...editingApplication, pinCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Internal Information Tab */}
              <TabsContent value="internal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-brand-yellow" />
                      <span>Internal Information & Credentials</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Full Name</label>
                        <Input
                          value={editingApplication.ownerFullName}
                          onChange={(e) => setEditingApplication({ ...editingApplication, ownerFullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Phone</label>
                        <Input
                          value={editingApplication.phoneNumber}
                          onChange={(e) => setEditingApplication({ ...editingApplication, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Email</label>
                        <Input
                          type="email"
                          value={editingApplication.email}
                          onChange={(e) => setEditingApplication({ ...editingApplication, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Password</label>
                        <Input
                          type="password"
                          value={editingApplication.password}
                          placeholder="Enter new password to change"
                          onChange={(e) => setEditingApplication({ ...editingApplication, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Details Tab */}
              <TabsContent value="business" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-brand-yellow" />
                      <span>Business Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Years of Experience</label>
                      <Select 
                        value={editingApplication.yearsOfExperience}
                        onValueChange={(value) => setEditingApplication({ ...editingApplication, yearsOfExperience: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(30)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} {i === 0 ? 'year' : 'years'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Services Offered</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {serviceOptions.map(service => (
                          <label key={service} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editingApplication.services.includes(service)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingApplication({
                                    ...editingApplication,
                                    services: [...editingApplication.services, service]
                                  });
                                } else {
                                  setEditingApplication({
                                    ...editingApplication,
                                    services: editingApplication.services.filter(s => s !== service)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Custom Services (up to 10)</label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (customServices.length < 10) {
                                setCustomServices([...customServices, '']);
                              }
                            }}
                            disabled={customServices.length >= 10}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Custom
                          </Button>
                        </div>
                        {customServices.map((service, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={service}
                              onChange={(e) => {
                                const newServices = [...customServices];
                                newServices[index] = e.target.value;
                                setCustomServices(newServices);
                              }}
                              placeholder={`Custom service ${index + 1}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCustomServices(customServices.filter((_, i) => i !== index));
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Equipment Available</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {equipmentOptions.map(equipment => (
                          <label key={equipment} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editingApplication.equipment.includes(equipment)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingApplication({
                                    ...editingApplication,
                                    equipment: [...editingApplication.equipment, equipment]
                                  });
                                } else {
                                  setEditingApplication({
                                    ...editingApplication,
                                    equipment: editingApplication.equipment.filter(s => s !== equipment)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{equipment}</span>
                          </label>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Custom Equipment (up to 10)</label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (customEquipment.length < 10) {
                                setCustomEquipment([...customEquipment, '']);
                              }
                            }}
                            disabled={customEquipment.length >= 10}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Custom
                          </Button>
                        </div>
                        {customEquipment.map((equipment, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={equipment}
                              onChange={(e) => {
                                const newEquipment = [...customEquipment];
                                newEquipment[index] = e.target.value;
                                setCustomEquipment(newEquipment);
                              }}
                              placeholder={`Custom equipment ${index + 1}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCustomEquipment(customEquipment.filter((_, i) => i !== index));
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
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
                      <span>Working Hours & Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dayNames.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center space-x-4">
                          <div className="w-24 font-medium">{label}</div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={!editingApplication.workingHours[key as keyof typeof editingApplication.workingHours]?.closed}
                              onCheckedChange={(checked) => updateWorkingHours(key, 'closed', !checked)}
                            />
                            <span className="text-sm">Open</span>
                          </div>
                        </div>
                        
                        {!editingApplication.workingHours[key as keyof typeof editingApplication.workingHours]?.closed && (
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="time" 
                              className="w-32" 
                              value={editingApplication.workingHours[key as keyof typeof editingApplication.workingHours]?.open || ''}
                              onChange={(e) => updateWorkingHours(key, 'open', e.target.value)}
                            />
                            <span>to</span>
                            <Input 
                              type="time" 
                              className="w-32" 
                              value={editingApplication.workingHours[key as keyof typeof editingApplication.workingHours]?.close || ''}
                              onChange={(e) => updateWorkingHours(key, 'close', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <h4 className="font-medium text-rich-black">Accept Walk-in Orders</h4>
                        <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                      </div>
                      <Switch
                        checked={editingApplication.acceptsWalkinOrders}
                        onCheckedChange={(checked) => setEditingApplication({ ...editingApplication, acceptsWalkinOrders: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Tab */}
              <TabsContent value="admin" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-brand-yellow" />
                      <span>Admin Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Application Status</label>
                      <Select 
                        value={editingApplication.status}
                        onValueChange={(value) => setEditingApplication({ ...editingApplication, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Admin Notes</label>
                      <Textarea
                        value={editingApplication.adminNotes || ''}
                        onChange={(e) => setEditingApplication({ ...editingApplication, adminNotes: e.target.value })}
                        className="min-h-[100px]"
                        placeholder="Internal notes about this application..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}