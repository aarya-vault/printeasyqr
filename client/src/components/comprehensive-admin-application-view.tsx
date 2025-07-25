import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Edit2, Check, X, Clock, User, Store, Settings, 
  Phone, Mail, MapPin, Briefcase, Shield, AlertCircle
} from 'lucide-react';

const adminEditSchema = z.object({
  // Public Information
  publicShopName: z.string().min(1, 'Public shop name is required'),
  publicOwnerName: z.string().optional(),
  publicAddress: z.string().min(1, 'Public address is required'),
  publicContactNumber: z.string().optional(),
  
  // Internal Information
  internalShopName: z.string().min(1, 'Internal shop name is required'),
  ownerFullName: z.string().min(1, 'Owner full name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
  completeAddress: z.string().min(1, 'Complete address is required'),
  
  // Business Details
  yearsOfExperience: z.string().min(1, 'Experience is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  equipment: z.array(z.string()).min(1, 'At least one equipment is required'),
  
  // Working Hours
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
  }),
  
  // Settings
  acceptsWalkinOrders: z.boolean(),
  
  // Admin Fields
  status: z.enum(['pending', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
});

type AdminEditForm = z.infer<typeof adminEditSchema>;

interface ShopApplication {
  id: number;
  publicShopName: string;
  publicOwnerName?: string;
  publicAddress: string;
  publicContactNumber?: string;
  internalShopName: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  workingHours: any;
  acceptsWalkinOrders: boolean;
  shopSlug: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComprehensiveAdminApplicationViewProps {
  applications: ShopApplication[];
}

export default function ComprehensiveAdminApplicationView({ applications }: ComprehensiveAdminApplicationViewProps) {
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AdminEditForm>({
    resolver: zodResolver(adminEditSchema),
    defaultValues: {
      publicShopName: '',
      publicOwnerName: '',
      publicAddress: '',
      publicContactNumber: '',
      internalShopName: '',
      ownerFullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      completeAddress: '',
      yearsOfExperience: '',
      services: [],
      equipment: [],
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      },
      acceptsWalkinOrders: true,
      status: 'pending',
      adminNotes: '',
    },
  });

  // Update form when application is selected
  React.useEffect(() => {
    if (selectedApplication) {
      form.reset({
        publicShopName: selectedApplication.publicShopName || '',
        publicOwnerName: selectedApplication.publicOwnerName || '',
        publicAddress: selectedApplication.publicAddress || '',
        publicContactNumber: selectedApplication.publicContactNumber || '',
        internalShopName: selectedApplication.internalShopName || '',
        ownerFullName: selectedApplication.ownerFullName || '',
        email: selectedApplication.email || '',
        phoneNumber: selectedApplication.phoneNumber || '',
        password: selectedApplication.password || '',
        completeAddress: selectedApplication.completeAddress || '',
        yearsOfExperience: selectedApplication.yearsOfExperience || '',
        services: selectedApplication.services || [],
        equipment: selectedApplication.equipment || [],
        workingHours: selectedApplication.workingHours || form.getValues('workingHours'),
        acceptsWalkinOrders: selectedApplication.acceptsWalkinOrders ?? true,
        status: selectedApplication.status as any,
        adminNotes: selectedApplication.adminNotes || '',
      });
    }
  }, [selectedApplication, form]);

  // Update application mutation
  const updateApplication = useMutation({
    mutationFn: async (data: AdminEditForm) => {
      const response = await fetch(`/api/shop-applications/${selectedApplication?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      setIsEditing(false);
      toast({
        title: 'Application Updated',
        description: 'Shop application has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  // Approve application mutation
  const approveApplication = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shop-applications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: form.getValues('adminNotes') }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve application');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      setSelectedApplication(null);
      toast({
        title: 'Application Approved',
        description: 'Shop application has been approved and shop created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: AdminEditForm) => {
    updateApplication.mutate(data);
  };

  const handleApprove = () => {
    if (selectedApplication) {
      approveApplication.mutate(selectedApplication.id);
    }
  };

  const handleReject = () => {
    if (selectedApplication) {
      const updatedData = {
        ...form.getValues(),
        status: 'rejected' as const,
      };
      updateApplication.mutate(updatedData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((application) => (
          <Card key={application.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-rich-black">{application.publicShopName}</CardTitle>
                <Badge className={`${getStatusColor(application.status)} text-white`}>
                  {application.status}
                </Badge>
              </div>
              <p className="text-sm text-medium-gray">{application.ownerFullName}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-medium-gray truncate">{application.publicAddress}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-medium-gray">{application.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-medium-gray">{application.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-medium-gray">{application.yearsOfExperience} experience</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-medium-gray">
                  Applied {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setSelectedApplication(application)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Store className="w-5 h-5" />
                      <span>{selectedApplication?.publicShopName} - Application Details</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  {selectedApplication && (
                    <div className="space-y-6">
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${getStatusColor(selectedApplication.status)} text-white`}>
                            {selectedApplication.status}
                          </Badge>
                          <span className="text-sm text-medium-gray">
                            Slug: <code className="bg-gray-200 px-2 py-1 rounded">{selectedApplication.shopSlug}</code>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            {isEditing ? 'Cancel Edit' : 'Edit Details'}
                          </Button>
                          {selectedApplication.status === 'pending' && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleReject}
                                disabled={updateApplication.isPending}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                className="bg-green-500 hover:bg-green-600 text-white"
                                size="sm"
                                onClick={handleApprove}
                                disabled={approveApplication.isPending}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Detailed Information */}
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                          <Tabs defaultValue="public" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="public">Public Info</TabsTrigger>
                              <TabsTrigger value="internal">Internal Info</TabsTrigger>
                              <TabsTrigger value="credentials">Credentials</TabsTrigger>
                              <TabsTrigger value="business">Business</TabsTrigger>
                              <TabsTrigger value="admin">Admin</TabsTrigger>
                            </TabsList>

                            {/* Public Information Tab */}
                            <TabsContent value="public" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="publicShopName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Public Shop Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="publicOwnerName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Public Owner Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="publicAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Public Address</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} disabled={!isEditing} className="min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="publicContactNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Public Contact Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>

                            {/* Internal Information Tab */}
                            <TabsContent value="internal" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="internalShopName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Internal Shop Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="ownerFullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Owner Full Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="completeAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Complete Address</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} disabled={!isEditing} className="min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="yearsOfExperience"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Years of Experience</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>

                            {/* Credentials Tab */}
                            <TabsContent value="credentials" className="space-y-4">
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Shield className="w-5 h-5 text-yellow-600" />
                                  <span className="font-medium text-yellow-800">Login Credentials</span>
                                </div>
                                <p className="text-sm text-yellow-700">
                                  These are the credentials the shop owner will use to log into their account.
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email Address</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="phoneNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone Number</FormLabel>
                                      <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input {...field} type={isEditing ? "text" : "password"} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>

                            {/* Business Details Tab */}
                            <TabsContent value="business" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Services Offered</label>
                                  <div className="mt-2 space-y-2">
                                    {selectedApplication.services?.map((service, index) => (
                                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                                        {service}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Equipment Available</label>
                                  <div className="mt-2 space-y-2">
                                    {selectedApplication.equipment?.map((equipment, index) => (
                                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                                        {equipment}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <FormField
                                control={form.control}
                                name="acceptsWalkinOrders"
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between p-4 border rounded-md">
                                    <div>
                                      <FormLabel className="text-base font-medium">Accept Walk-in Orders</FormLabel>
                                      <p className="text-sm text-medium-gray">Allow customers to place orders for immediate pickup</p>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={!isEditing}
                                        className="data-[state=checked]:bg-brand-yellow"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              {/* Working Hours Display */}
                              <div>
                                <label className="text-sm font-medium mb-3 block">Working Hours</label>
                                <div className="space-y-2">
                                  {Object.entries(selectedApplication.workingHours || {}).map(([day, hours]: [string, any]) => (
                                    <div key={day} className="flex items-center justify-between p-3 border rounded-md">
                                      <div className="font-medium capitalize">{day}</div>
                                      <div className="text-sm text-medium-gray">
                                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>

                            {/* Admin Tab */}
                            <TabsContent value="admin" className="space-y-4">
                              <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Application Status</FormLabel>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <Badge className={`${getStatusColor(field.value)} text-white px-3 py-1`}>
                                        {field.value}
                                      </Badge>
                                      <span className="text-sm text-medium-gray">
                                        Last updated: {new Date(selectedApplication.updatedAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="adminNotes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Admin Notes</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...field} 
                                        disabled={!isEditing}
                                        placeholder="Add notes for the applicant or internal use..."
                                        className="min-h-[120px]"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AlertCircle className="w-5 h-5 text-blue-600" />
                                  <span className="font-medium text-blue-800">Application Information</span>
                                </div>
                                <div className="text-sm text-blue-700 space-y-1">
                                  <p><strong>Application ID:</strong> {selectedApplication.id}</p>
                                  <p><strong>Shop Slug:</strong> {selectedApplication.shopSlug}</p>
                                  <p><strong>Submitted:</strong> {new Date(selectedApplication.createdAt).toLocaleString()}</p>
                                  <p><strong>Last Modified:</strong> {new Date(selectedApplication.updatedAt).toLocaleString()}</p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {/* Save Button (only show when editing) */}
                          {isEditing && (
                            <div className="flex justify-end pt-6 border-t">
                              <Button
                                type="submit"
                                className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                                disabled={updateApplication.isPending}
                              >
                                {updateApplication.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          )}
                        </form>
                      </Form>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-rich-black mb-2">No Applications</h3>
          <p className="text-medium-gray">No shop applications found.</p>
        </div>
      )}
    </div>
  );
}