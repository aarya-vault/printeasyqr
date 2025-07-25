import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  X
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  publicOwnerName?: string;
  internalName: string;
  ownerFullName: string;
  email: string;
  ownerPhone: string;
  completeAddress: string;
  services: string[];
  equipment: string[];
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
  isOnline: boolean;
  isApproved: boolean;
  isPublic: boolean;
  status?: 'active' | 'deactivated' | 'banned';
}

interface ComprehensiveAdminShopEditProps {
  shop: Shop;
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

export default function ComprehensiveAdminShopEdit({ 
  shop, 
  onClose, 
  onUpdate 
}: ComprehensiveAdminShopEditProps) {
  const [editingShop, setEditingShop] = useState<Shop>(shop);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingShop),
      });

      if (!response.ok) throw new Error('Failed to update shop');

      toast({
        title: 'Shop Updated',
        description: 'Shop details have been saved successfully',
      });

      onUpdate();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save shop changes',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setEditingShop({
      ...editingShop,
      workingHours: {
        ...editingShop.workingHours,
        [day]: {
          ...editingShop.workingHours[day as keyof typeof editingShop.workingHours],
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
            <h2 className="text-2xl font-bold text-rich-black">Edit Shop: {shop.name}</h2>
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="public">Public Info</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="hours">Hours & Settings</TabsTrigger>
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
                          value={editingShop.name}
                          onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Shop Slug</label>
                        <Input
                          value={editingShop.slug}
                          onChange={(e) => setEditingShop({ ...editingShop, slug: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Owner Name</label>
                        <Input
                          value={editingShop.publicOwnerName || ''}
                          onChange={(e) => setEditingShop({ ...editingShop, publicOwnerName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Phone Number</label>
                        <Input
                          value={editingShop.phone}
                          onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Address</label>
                      <Input
                        value={editingShop.address}
                        onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">City</label>
                        <Input
                          value={editingShop.city}
                          onChange={(e) => setEditingShop({ ...editingShop, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">State</label>
                        <Input
                          value={editingShop.state}
                          onChange={(e) => setEditingShop({ ...editingShop, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Pin Code</label>
                        <Input
                          value={editingShop.pinCode}
                          onChange={(e) => setEditingShop({ ...editingShop, pinCode: e.target.value })}
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
                      <span>Internal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Internal Shop Name</label>
                        <Input
                          value={editingShop.internalName}
                          onChange={(e) => setEditingShop({ ...editingShop, internalName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Full Name</label>
                        <Input
                          value={editingShop.ownerFullName}
                          onChange={(e) => setEditingShop({ ...editingShop, ownerFullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Email</label>
                        <Input
                          type="email"
                          value={editingShop.email}
                          onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Phone</label>
                        <Input
                          value={editingShop.ownerPhone}
                          onChange={(e) => setEditingShop({ ...editingShop, ownerPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Complete Address</label>
                      <Textarea
                        value={editingShop.completeAddress}
                        onChange={(e) => setEditingShop({ ...editingShop, completeAddress: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Details Tab */}
              <TabsContent value="business" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-brand-yellow" />
                      <span>Business Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-1">Years of Experience</label>
                      <Input
                        value={editingShop.yearsOfExperience}
                        onChange={(e) => setEditingShop({ ...editingShop, yearsOfExperience: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Services Offered</label>
                      <Input
                        placeholder="Comma-separated services (e.g., Printing, Binding, Lamination)"
                        value={Array.isArray(editingShop.services) ? editingShop.services.join(', ') : ''}
                        onChange={(e) => setEditingShop({ 
                          ...editingShop, 
                          services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                        })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Equipment Available</label>
                      <Input
                        placeholder="Comma-separated equipment (e.g., Laser Printer, Scanner, Laminator)"
                        value={Array.isArray(editingShop.equipment) ? editingShop.equipment.join(', ') : ''}
                        onChange={(e) => setEditingShop({ 
                          ...editingShop, 
                          equipment: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Working Hours & Settings Tab */}
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
                              checked={!editingShop.workingHours[key as keyof typeof editingShop.workingHours]?.closed}
                              onCheckedChange={(checked) => updateWorkingHours(key, 'closed', !checked)}
                            />
                            <span className="text-sm">Open</span>
                          </div>
                        </div>
                        
                        {!editingShop.workingHours[key as keyof typeof editingShop.workingHours]?.closed && (
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="time" 
                              className="w-32" 
                              value={editingShop.workingHours[key as keyof typeof editingShop.workingHours]?.open || ''}
                              onChange={(e) => updateWorkingHours(key, 'open', e.target.value)}
                            />
                            <span>to</span>
                            <Input 
                              type="time" 
                              className="w-32" 
                              value={editingShop.workingHours[key as keyof typeof editingShop.workingHours]?.close || ''}
                              onChange={(e) => updateWorkingHours(key, 'close', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium text-rich-black">Accept Walk-in Orders</h4>
                          <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                        </div>
                        <Switch
                          checked={editingShop.acceptsWalkinOrders}
                          onCheckedChange={(checked) => setEditingShop({ ...editingShop, acceptsWalkinOrders: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium text-rich-black">Shop Online</h4>
                          <p className="text-sm text-medium-gray">Shop appears as online to customers</p>
                        </div>
                        <Switch
                          checked={editingShop.isOnline}
                          onCheckedChange={(checked) => setEditingShop({ ...editingShop, isOnline: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium text-rich-black">Public Visibility</h4>
                          <p className="text-sm text-medium-gray">Shop visible in public listings</p>
                        </div>
                        <Switch
                          checked={editingShop.isPublic}
                          onCheckedChange={(checked) => setEditingShop({ ...editingShop, isPublic: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium text-rich-black">Approved Status</h4>
                          <p className="text-sm text-medium-gray">Shop has admin approval</p>
                        </div>
                        <Switch
                          checked={editingShop.isApproved}
                          onCheckedChange={(checked) => setEditingShop({ ...editingShop, isApproved: checked })}
                        />
                      </div>
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