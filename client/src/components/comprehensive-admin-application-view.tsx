import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, Edit3, Save, X, User, Mail, Phone, MapPin, Store, 
  Clock, Briefcase, Settings, CheckCircle2, XCircle, Globe, 
  Lock, Building, Timer, Users
} from 'lucide-react';

interface ShopApplication {
  id: number;
  // Public Information
  publicShopName: string;
  publicOwnerName?: string;
  publicAddress: string;
  publicContactNumber?: string;
  
  // Internal Information
  internalShopName: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  completeAddress: string;
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
  applications: ShopApplication[];
}

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ComprehensiveAdminApplicationView({ applications }: ComprehensiveAdminApplicationViewProps) {
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [editingApplication, setEditingApplication] = useState<ShopApplication | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleApplicationAction = async (application: ShopApplication, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/shop-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (!response.ok) throw new Error('Failed to update application');

      toast({
        title: `Application ${action}`,
        description: `${application.publicShopName} has been ${action}`,
      });

      // Refresh the page to get updated data
      window.location.reload();
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
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-4">
      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-black mb-2">No applications found</h3>
            <p className="text-medium-gray">Shop applications will appear here for review</p>
          </CardContent>
        </Card>
      ) : (
        applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getApplicationStatusIcon(application.status)}
                    <h3 className="text-lg font-semibold text-rich-black">{application.publicShopName}</h3>
                    <Badge className={getApplicationStatusColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-medium-gray">
                    <p>Applicant: {application.ownerFullName}</p>
                    <p>Email: {application.email}</p>
                    <p>Location: {application.city}, {application.state}</p>
                    <p>Experience: {application.yearsOfExperience}</p>
                    <p>Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {application.services.slice(0, 3).map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {application.services.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{application.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Store className="w-5 h-5 text-brand-yellow" />
                          <span>Shop Application Review</span>
                          {isEditing && <Badge variant="outline">Editing Mode</Badge>}
                        </DialogTitle>
                      </DialogHeader>

                      {selectedApplication && (
                        <div className="space-y-6">
                          {/* Action Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getApplicationStatusIcon(selectedApplication.status)}
                              <span className="font-medium">Status: </span>
                              <Badge className={getApplicationStatusColor(selectedApplication.status)}>
                                {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!isEditing ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsEditing(true);
                                    setEditingApplication({ ...selectedApplication });
                                  }}
                                  className="flex items-center space-x-2"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>Edit</span>
                                </Button>
                              ) : (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditing(false);
                                      setEditingApplication(null);
                                    }}
                                    className="flex items-center space-x-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdits}
                                    className="bg-brand-yellow text-rich-black hover:bg-yellow-500 flex items-center space-x-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <Tabs defaultValue="public" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="public" className="flex items-center space-x-2">
                                <Globe className="w-4 h-4" />
                                <span>Public Info</span>
                              </TabsTrigger>
                              <TabsTrigger value="internal" className="flex items-center space-x-2">
                                <Lock className="w-4 h-4" />
                                <span>Internal Info</span>
                              </TabsTrigger>
                              <TabsTrigger value="credentials" className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Credentials</span>
                              </TabsTrigger>
                              <TabsTrigger value="business" className="flex items-center space-x-2">
                                <Briefcase className="w-4 h-4" />
                                <span>Business</span>
                              </TabsTrigger>
                              <TabsTrigger value="settings" className="flex items-center space-x-2">
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                              </TabsTrigger>
                            </TabsList>

                            {/* Public Information Tab */}
                            <TabsContent value="public" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    <span>Public Information (Customer-Facing)</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Public Shop Name</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.publicShopName || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, publicShopName: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.publicShopName}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label>Public Owner Name</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.publicOwnerName || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, publicOwnerName: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.publicOwnerName || 'Not provided'}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Public Address</Label>
                                    {isEditing ? (
                                      <Textarea
                                        value={editingApplication?.publicAddress || ''}
                                        onChange={(e) => setEditingApplication(prev => prev ? {...prev, publicAddress: e.target.value} : null)}
                                      />
                                    ) : (
                                      <p className="font-medium">{selectedApplication.publicAddress}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label>Public Contact Number</Label>
                                    {isEditing ? (
                                      <Input
                                        value={editingApplication?.publicContactNumber || ''}
                                        onChange={(e) => setEditingApplication(prev => prev ? {...prev, publicContactNumber: e.target.value} : null)}
                                      />
                                    ) : (
                                      <p className="font-medium">{selectedApplication.publicContactNumber || 'Not provided'}</p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            {/* Internal Information Tab */}
                            <TabsContent value="internal" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <Lock className="w-5 h-5 text-red-500" />
                                    <span>Internal Information (Admin Only)</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Internal Shop Name</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.internalShopName || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, internalShopName: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.internalShopName}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label>Owner Full Name</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.ownerFullName || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, ownerFullName: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.ownerFullName}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Complete Address</Label>
                                    {isEditing ? (
                                      <Textarea
                                        value={editingApplication?.completeAddress || ''}
                                        onChange={(e) => setEditingApplication(prev => prev ? {...prev, completeAddress: e.target.value} : null)}
                                      />
                                    ) : (
                                      <p className="font-medium">{selectedApplication.completeAddress}</p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label>City</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.city || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, city: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.city}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label>State</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.state || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, state: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.state}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label>Pin Code</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.pinCode || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, pinCode: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.pinCode}</p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            {/* Credentials Tab */}
                            <TabsContent value="credentials" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <User className="w-5 h-5 text-green-500" />
                                    <span>Login Credentials</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Email (Login ID)</Label>
                                      {isEditing ? (
                                        <Input
                                          type="email"
                                          value={editingApplication?.email || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, email: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.email}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label>Phone Number</Label>
                                      {isEditing ? (
                                        <Input
                                          value={editingApplication?.phoneNumber || ''}
                                          onChange={(e) => setEditingApplication(prev => prev ? {...prev, phoneNumber: e.target.value} : null)}
                                        />
                                      ) : (
                                        <p className="font-medium">{selectedApplication.phoneNumber}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Password</Label>
                                    {isEditing ? (
                                      <Input
                                        type="password"
                                        value={editingApplication?.password || ''}
                                        onChange={(e) => setEditingApplication(prev => prev ? {...prev, password: e.target.value} : null)}
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-500">••••••••</p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            {/* Business Details Tab */}
                            <TabsContent value="business" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <Briefcase className="w-5 h-5 text-purple-500" />
                                    <span>Business Details</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label>Years of Experience</Label>
                                    {isEditing ? (
                                      <Input
                                        value={editingApplication?.yearsOfExperience || ''}
                                        onChange={(e) => setEditingApplication(prev => prev ? {...prev, yearsOfExperience: e.target.value} : null)}
                                      />
                                    ) : (
                                      <p className="font-medium">{selectedApplication.yearsOfExperience}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label>Services Offered</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedApplication.services.map((service, index) => (
                                        <Badge key={index} variant="secondary">
                                          {service}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Equipment Available</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedApplication.equipment.map((equip, index) => (
                                        <Badge key={index} variant="outline">
                                          {equip}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center space-x-2">
                                    <Settings className="w-5 h-5 text-orange-500" />
                                    <span>Shop Settings</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                  {/* Working Hours */}
                                  <div className="space-y-4">
                                    <h4 className="font-medium flex items-center space-x-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Working Hours</span>
                                    </h4>
                                    <div className="space-y-3">
                                      {dayNames.map((day) => {
                                        const hours = selectedApplication.workingHours[day as keyof typeof selectedApplication.workingHours];
                                        return (
                                          <div key={day} className="flex items-center justify-between p-3 border rounded-md">
                                            <div className="flex items-center space-x-4">
                                              <div className="w-20 font-medium capitalize">{day}</div>
                                              {isEditing ? (
                                                <div className="flex items-center space-x-2">
                                                  <Switch
                                                    checked={!hours.closed}
                                                    onCheckedChange={(checked) => updateWorkingHours(day, 'closed', !checked)}
                                                  />
                                                  <Label>Open</Label>
                                                </div>
                                              ) : (
                                                <Badge variant={hours.closed ? 'destructive' : 'default'}>
                                                  {hours.closed ? 'Closed' : 'Open'}
                                                </Badge>
                                              )}
                                            </div>
                                            
                                            {!hours.closed && (
                                              <div className="flex items-center space-x-2">
                                                {isEditing ? (
                                                  <>
                                                    <Input
                                                      type="time"
                                                      value={hours.open}
                                                      onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                                                      className="w-32"
                                                    />
                                                    <span>to</span>
                                                    <Input
                                                      type="time"
                                                      value={hours.close}
                                                      onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                                                      className="w-32"
                                                    />
                                                  </>
                                                ) : (
                                                  <span className="text-sm">{hours.open} - {hours.close}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Walk-in Orders Setting */}
                                  <div className="flex items-center justify-between p-4 border rounded-md">
                                    <div>
                                      <Label className="text-base font-medium">Accept Walk-in Orders</Label>
                                      <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                                    </div>
                                    {isEditing ? (
                                      <Switch
                                        checked={editingApplication?.acceptsWalkinOrders || false}
                                        onCheckedChange={(checked) => setEditingApplication(prev => prev ? {...prev, acceptsWalkinOrders: checked} : null)}
                                      />
                                    ) : (
                                      <Badge variant={selectedApplication.acceptsWalkinOrders ? 'default' : 'secondary'}>
                                        {selectedApplication.acceptsWalkinOrders ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>

                          {/* Application Actions */}
                          {selectedApplication.status === 'pending' && (
                            <div className="flex items-center justify-center space-x-4 pt-6 border-t">
                              <Button
                                variant="destructive"
                                onClick={() => handleApplicationAction(selectedApplication, 'rejected')}
                                className="flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject Application</span>
                              </Button>
                              <Button
                                onClick={() => handleApplicationAction(selectedApplication, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve Application</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {application.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleApplicationAction(application, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleApplicationAction(application, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}