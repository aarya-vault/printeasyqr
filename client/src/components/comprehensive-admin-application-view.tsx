import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X
} from 'lucide-react';

interface ShopApplication {
  id: number;
  
  // Public Information
  publicShopName: string;
  shopSlug: string;
  publicOwnerName: string;
  publicPhoneNumber: string;
  
  // Contact Details
  email: string;
  password?: string;
  ownerFullName: string;
  ownerContactNumber: string;
  
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  
  // Business Details
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  
  // Working Hours
  workingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  
  // Settings
  acceptsWalkinOrders: boolean;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminNotes?: string;
}

interface ComprehensiveAdminApplicationViewProps {
  application: ShopApplication;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string, notes?: string) => void;
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

export default function ComprehensiveAdminApplicationView({ 
  application, 
  onClose, 
  onStatusUpdate 
}: ComprehensiveAdminApplicationViewProps) {
  const [editingApplication, setEditingApplication] = useState<ShopApplication | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [adminNotes, setAdminNotes] = useState(application.adminNotes || '');
  const { toast } = useToast();

  const handleApplicationAction = async (action: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/shop-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, adminNotes }),
      });

      if (!response.ok) throw new Error('Failed to update application');

      toast({
        title: `Application ${action}`,
        description: `${application.publicShopName} has been ${action}`,
      });

      onStatusUpdate(application.id, action, adminNotes);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update application status',
      });
    }
  };

  const handleSaveEdits = async () => {
    if (!editingApplication) return;

    try {
      const response = await fetch(`/api/shop-applications/${editingApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingApplication),
      });

      if (!response.ok) throw new Error('Failed to update application');

      toast({
        title: 'Application Updated',
        description: 'Changes have been saved successfully',
      });

      setIsEditing(false);
      setEditingApplication(null);
      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save changes',
      });
    }
  };

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (!editingApplication) return;
    
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

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-brand-yellow" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-brand-yellow/10 text-rich-black border-brand-yellow/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getApplicationStatusIcon(application.status)}
            <h2 className="text-2xl font-bold text-rich-black">{application.publicShopName}</h2>
            <Badge className={getApplicationStatusColor(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingApplication(application);
                  setIsEditing(true);
                }}
                className="bg-white border-brand-yellow text-rich-black hover:bg-brand-yellow/5"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Application
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="bg-white border-rich-black text-rich-black hover:bg-gray-50">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <Tabs defaultValue="public" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="public">Public Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
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
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Shop Name</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.publicShopName || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              publicShopName: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.publicShopName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Shop Slug</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.shopSlug || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              shopSlug: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.shopSlug}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Owner Name</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.publicOwnerName || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              publicOwnerName: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.publicOwnerName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Public Phone Number</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.publicPhoneNumber || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              publicPhoneNumber: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.publicPhoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Details Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-brand-yellow" />
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Email</label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editingApplication?.email || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              email: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Full Name</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.ownerFullName || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              ownerFullName: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.ownerFullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-1">Owner Contact Number</label>
                        {isEditing ? (
                          <Input
                            value={editingApplication?.ownerContactNumber || ''}
                            onChange={(e) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              ownerContactNumber: e.target.value
                            })}
                          />
                        ) : (
                          <p className="text-medium-gray">{application.ownerContactNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-rich-black mb-1">Complete Address</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-medium-gray mb-1">Address Line 1</label>
                          {isEditing ? (
                            <Input
                              value={editingApplication?.addressLine1 || ''}
                              onChange={(e) => editingApplication && setEditingApplication({
                                ...editingApplication,
                                addressLine1: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-medium-gray">{application.addressLine1}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-medium-gray mb-1">Address Line 2</label>
                          {isEditing ? (
                            <Input
                              value={editingApplication?.addressLine2 || ''}
                              onChange={(e) => editingApplication && setEditingApplication({
                                ...editingApplication,
                                addressLine2: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-medium-gray">{application.addressLine2 || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-medium-gray mb-1">City</label>
                          {isEditing ? (
                            <Input
                              value={editingApplication?.city || ''}
                              onChange={(e) => editingApplication && setEditingApplication({
                                ...editingApplication,
                                city: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-medium-gray">{application.city}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-medium-gray mb-1">State</label>
                          {isEditing ? (
                            <Input
                              value={editingApplication?.state || ''}
                              onChange={(e) => editingApplication && setEditingApplication({
                                ...editingApplication,
                                state: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-medium-gray">{application.state}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-medium-gray mb-1">Pin Code</label>
                          {isEditing ? (
                            <Input
                              value={editingApplication?.pinCode || ''}
                              onChange={(e) => editingApplication && setEditingApplication({
                                ...editingApplication,
                                pinCode: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-medium-gray">{application.pinCode}</p>
                          )}
                        </div>
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
                      <Settings className="w-5 h-5 text-brand-yellow" />
                      <span>Business Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Years of Experience</label>
                      {isEditing ? (
                        <Input
                          value={editingApplication?.yearsOfExperience || ''}
                          onChange={(e) => editingApplication && setEditingApplication({
                            ...editingApplication,
                            yearsOfExperience: e.target.value
                          })}
                        />
                      ) : (
                        <p className="text-medium-gray">{application.yearsOfExperience}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Services Offered</label>
                      <div className="flex flex-wrap gap-2">
                        {application.services.map((service: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-brand-yellow/10 text-rich-black">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Equipment Available</label>
                      <div className="flex flex-wrap gap-2">
                        {application.equipment.map((equip: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-brand-yellow text-rich-black">
                            {equip}
                          </Badge>
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
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={!editingApplication?.workingHours[key as keyof typeof editingApplication.workingHours]?.closed}
                                onCheckedChange={(checked) => updateWorkingHours(key, 'closed', !checked)}
                              />
                              <span className="text-sm">Open</span>
                            </div>
                          ) : (
                            <Badge variant={application.workingHours[key as keyof typeof application.workingHours]?.closed ? "secondary" : "default"}>
                              {application.workingHours[key as keyof typeof application.workingHours]?.closed ? 'Closed' : 'Open'}
                            </Badge>
                          )}
                        </div>
                        
                        {!application.workingHours[key as keyof typeof application.workingHours]?.closed && (
                          <div className="flex items-center space-x-2">
                            {isEditing ? (
                              <>
                                <Input 
                                  type="time" 
                                  className="w-32" 
                                  value={editingApplication?.workingHours[key as keyof typeof editingApplication.workingHours]?.open || ''}
                                  onChange={(e) => updateWorkingHours(key, 'open', e.target.value)}
                                />
                                <span>to</span>
                                <Input 
                                  type="time" 
                                  className="w-32" 
                                  value={editingApplication?.workingHours[key as keyof typeof editingApplication.workingHours]?.close || ''}
                                  onChange={(e) => updateWorkingHours(key, 'close', e.target.value)}
                                />
                              </>
                            ) : (
                              <span className="text-medium-gray">
                                {application.workingHours[key as keyof typeof application.workingHours]?.open} - {application.workingHours[key as keyof typeof application.workingHours]?.close}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="p-4 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-rich-black">Accept Walk-in Orders</h4>
                          <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                        </div>
                        {isEditing ? (
                          <Switch
                            checked={editingApplication?.acceptsWalkinOrders || false}
                            onCheckedChange={(checked) => editingApplication && setEditingApplication({
                              ...editingApplication,
                              acceptsWalkinOrders: checked
                            })}
                          />
                        ) : (
                          <Badge variant={application.acceptsWalkinOrders ? "default" : "secondary"} className="bg-brand-yellow text-rich-black">
                            {application.acceptsWalkinOrders ? 'Enabled' : 'Disabled'}
                          </Badge>
                        )}
                      </div>
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
                      <span>Admin Control</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-rich-black mb-2">Admin Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this application..."
                        className="min-h-[120px]"
                      />
                    </div>

                    {application.status === 'pending' && (
                      <div className="flex space-x-4 pt-4">
                        <Button
                          onClick={() => handleApplicationAction('approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Application
                        </Button>
                        <Button
                          onClick={() => handleApplicationAction('rejected')}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Application
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingApplication(null);
                  }}
                >
                  Cancel Changes
                </Button>
                <Button
                  onClick={handleSaveEdits}
                  className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}