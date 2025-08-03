import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Building, Settings, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedShopDataProps {
  applicationId: number;
  isAdminView?: boolean;
}

export const UnifiedShopDataManagement: React.FC<UnifiedShopDataProps> = ({ 
  applicationId, 
  isAdminView = false 
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  // Fetch shop application data
  const { data: application, isLoading } = useQuery({
    queryKey: ['/api/shop-applications', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/shop-applications/${applicationId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    }
  });

  // 🔥 EMERGENCY DISABLE
  const { data: shopData } = useQuery({
    queryKey: ['/api/shops/owner', application?.applicantId],
    queryFn: async () => {
      if (!application?.applicantId) return null;
      const response = await fetch(`/api/shops/owner/${application.applicantId}`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: Boolean(user?.id && user?.role === 'shop_owner')
  });

  // Update mutation with unified sync
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const endpoint = isAdminView 
        ? `/api/admin/shop-applications/${applicationId}`
        : `/api/shop-applications/${applicationId}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Data updated successfully - all interfaces synchronized');
      queryClient.invalidateQueries({ queryKey: ['/api/shop-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  const handleUpdate = (field: string, value: any) => {
    const updates = { [field]: value };
    updateMutation.mutate(updates);
  };

  const handleBulkUpdate = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop data...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Application not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Sync Status */}
      <Card className="border-yellow-500 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            Unified Data Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={application.status === 'approved' ? 'default' : 'secondary'}>
                Application: {application.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={shopData?.shop ? 'default' : 'secondary'}>
                Shop: {shopData?.shop ? 'Active' : 'Not Created'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Sync: Real-time
              </Badge>
            </div>
          </div>
          <p className="text-yellow-700 mt-2 text-sm">
            Changes made here automatically sync across admin dashboard, shop management, and shop settings.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Controls
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Credentials
          </TabsTrigger>
        </TabsList>

        {/* Business Information - Shop Owner Can Edit */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Business Information</CardTitle>
              <p className="text-sm text-green-600">
                ✓ Shop owners can edit these fields through their settings panel
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publicShopName">Public Shop Name</Label>
                  <Input
                    id="publicShopName"
                    value={application.publicShopName || ''}
                    onChange={(e) => handleUpdate('publicShopName', e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="publicOwnerName">Public Owner Name</Label>
                  <Input
                    id="publicOwnerName"
                    value={application.publicOwnerName || ''}
                    onChange={(e) => handleUpdate('publicOwnerName', e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="publicAddress">Public Address</Label>
                  <Textarea
                    id="publicAddress"
                    value={application.publicAddress || ''}
                    onChange={(e) => handleUpdate('publicAddress', e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="publicContactNumber">Public Contact Number</Label>
                  <Input
                    id="publicContactNumber"
                    value={application.publicContactNumber || ''}
                    onChange={(e) => handleUpdate('publicContactNumber', e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={application.email || ''}
                    onChange={(e) => handleUpdate('email', e.target.value)}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Select
                    value={application.yearsOfExperience?.toString() || ''}
                    onValueChange={(value) => handleUpdate('yearsOfExperience', value)}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} year{i + 1 > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Services Offered</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {application.services && Array.isArray(application.services) && 
                    application.services.map((service: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-green-300">
                        {service}
                      </Badge>
                    ))
                  }
                </div>
              </div>

              <div className="space-y-3">
                <Label>Equipment Available</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {application.equipment && Array.isArray(application.equipment) && 
                    application.equipment.map((equipment: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-green-300">
                        {equipment}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Controls - Admin Only */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-800">Admin Controls</CardTitle>
              <p className="text-sm text-red-600">
                🔒 Only admins can modify these critical settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isAdminView ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="acceptsWalkinOrders">Accept Walk-in Orders</Label>
                        <Switch
                          id="acceptsWalkinOrders"
                          checked={shopData?.shop?.acceptsWalkinOrders ?? application.acceptsWalkinOrders}
                          onCheckedChange={(checked) => handleUpdate('acceptsWalkinOrders', checked)}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Allow customers to place orders for immediate pickup
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isOnline">Shop Online</Label>
                        <Switch
                          id="isOnline"
                          checked={shopData?.shop?.isOnline ?? false}
                          onCheckedChange={(checked) => handleUpdate('isOnline', checked)}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Shop appears as online to customers
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isPublic">Public Visibility</Label>
                        <Switch
                          id="isPublic"
                          checked={shopData?.shop?.isPublic ?? false}
                          onCheckedChange={(checked) => handleUpdate('isPublic', checked)}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Shop visible in public listings
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isApproved">Approved Status</Label>
                        <Switch
                          id="isApproved"
                          checked={application.status === 'approved'}
                          onCheckedChange={(checked) => 
                            handleUpdate('status', checked ? 'approved' : 'pending')
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Shop has admin approval
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="adminNotes">Admin Notes</Label>
                    <Textarea
                      id="adminNotes"
                      value={application.adminNotes || ''}
                      onChange={(e) => handleUpdate('adminNotes', e.target.value)}
                      placeholder="Internal admin notes..."
                      className="border-red-200 focus:border-red-500"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Admin access required to view these settings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-800">Working Hours</CardTitle>
              <p className="text-sm text-blue-600">
                ⏰ Shop owners can modify through settings panel
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.workingHours && typeof application.workingHours === 'object' && 
                  Object.entries(application.workingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg">
                      <div className="font-medium capitalize">{day}</div>
                      <div className="text-sm text-gray-600">
                        {hours?.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials */}
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-800">Login Credentials</CardTitle>
              <p className="text-sm text-purple-600">
                🔑 Shop owner authentication information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ownerFullName">Owner Full Name</Label>
                <Input
                  id="ownerFullName"
                  value={application.ownerFullName || ''}
                  onChange={(e) => handleUpdate('ownerFullName', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Owner Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={application.phoneNumber || ''}
                  onChange={(e) => handleUpdate('phoneNumber', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="shopSlug">Shop URL Slug</Label>
                <Input
                  id="shopSlug"
                  value={application.shopSlug || ''}
                  onChange={(e) => handleUpdate('shopSlug', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Used for shop URL: printeasy.com/shop/{application.shopSlug}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Status Footer */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings className="h-4 w-4" />
              Data synchronized across all platforms
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              {updateMutation.isPending ? 'Syncing...' : 'In Sync'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedShopDataManagement;