import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, Store, Package, TrendingUp, CheckCircle2, 
  XCircle, Clock, LogOut, Search, Filter, Eye, MessageSquare,
  BarChart3, DollarSign, AlertTriangle, UserCheck, Settings
} from 'lucide-react';
import ComprehensiveAdminApplicationView from '@/components/comprehensive-admin-application-view';
import ComprehensiveAdminShopEdit from '@/components/comprehensive-admin-shop-edit';

interface PlatformStats {
  totalUsers: number;
  activeShops: number;
  totalOrders: number;
}

interface ShopApplication {
  id: number;
  shopName: string;
  shopSlug: string;
  applicantName: string;
  email: string;
  city: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  services: string[];
  yearsOfExperience: string;
}

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'shop_owner' | 'admin';
  createdAt: string;
}

interface Shop {
  id: number;
  name: string;
  ownerName: string;
  city: string;
  rating: number;
  totalOrders: number;
  isOnline: boolean;
  isApproved: boolean;
}

export default function EnhancedAdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [editingApplication, setEditingApplication] = useState<ShopApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Fetch shop applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/admin/shop-applications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/shop-applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    }
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/admin/shops'],
    queryFn: async () => {
      const response = await fetch('/api/admin/shops');
      if (!response.ok) throw new Error('Failed to fetch shops');
      return response.json();
    }
  });

  // Update shop application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/shop-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setSelectedApplication(null);
      setAdminNotes('');
      toast({
        title: "Application Updated Successfully!",
        description: "The shop application has been processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApplicationAction = (application: ShopApplication, action: 'approved' | 'rejected') => {
    updateApplicationMutation.mutate({
      id: application.id,
      status: action,
      notes: adminNotes
    });
  };

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-rich-black mb-4">Access Denied</h2>
          <p className="text-medium-gray mb-6">You don't have permission to access this area</p>
          <Button onClick={() => window.location.href = '/'}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Admin Dashboard</h1>
                <p className="text-sm text-medium-gray">Platform Management Center</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                logout();
                navigate('/');
                toast({
                  title: "Signed Out",
                  description: "You have been successfully signed out",
                });
              }} 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Active Shops</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statsLoading ? '...' : stats?.activeShops || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {statsLoading ? '...' : stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Platform Activity</p>
                  <p className="text-3xl font-bold text-rich-black">
                    {statsLoading ? '...' : `${stats?.activeShops || 0} Active`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-rich-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Applications</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="shops" className="flex items-center space-x-2">
              <Store className="w-4 h-4" />
              <span>Shops</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Shop Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Shop Applications</h2>
              <Badge variant="outline" className="text-sm">
                {applications.filter((app: ShopApplication) => app.status === 'pending').length} Pending
              </Badge>
            </div>

            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No applications found</h3>
                  <p className="text-medium-gray">Shop applications will appear here for review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application: ShopApplication) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getApplicationStatusIcon(application.status)}
                            <h3 className="text-lg font-semibold text-rich-black">{application.shopName}</h3>
                            <Badge className={getApplicationStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-medium-gray">
                            <p>Applicant: {application.applicantName}</p>
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedApplication(application)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Review</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingApplication(application)}
                            className="flex items-center space-x-1 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Edit All</span>
                          </Button>
                          {application.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleApplicationAction(application, 'approved')}
                                disabled={updateApplicationMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleApplicationAction(application, 'rejected')}
                                disabled={updateApplicationMutation.isPending}
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
                ))}
              </div>
            )}

            {/* Application Review Modal */}
            {selectedApplication && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-rich-black">Review Application</h3>
                      <button 
                        onClick={() => setSelectedApplication(null)}
                        className="text-medium-gray hover:text-rich-black text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-rich-black">Shop Name</label>
                          <p className="text-medium-gray">{selectedApplication.shopName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-rich-black">Shop Slug</label>
                          <p className="text-medium-gray">{selectedApplication.shopSlug}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-rich-black">Applicant</label>
                          <p className="text-medium-gray">{selectedApplication.applicantName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-rich-black">Email</label>
                          <p className="text-medium-gray">{selectedApplication.email}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-rich-black">Services Offered</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedApplication.services.map((service, index) => (
                            <Badge key={index} variant="secondary">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-rich-black mb-2 block">Admin Notes</label>
                        <Textarea
                          placeholder="Add notes about this application..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    {selectedApplication.status === 'pending' && (
                      <div className="flex justify-end space-x-4">
                        <Button 
                          variant="destructive"
                          onClick={() => handleApplicationAction(selectedApplication, 'rejected')}
                          disabled={updateApplicationMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Application
                        </Button>
                        <Button 
                          onClick={() => handleApplicationAction(selectedApplication, 'approved')}
                          disabled={updateApplicationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Application
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">User Management</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search users..." className="pl-10" />
                </div>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-rich-black mb-2">Total Customers</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {users.filter((u: User) => u.role === 'customer').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-rich-black mb-2">Shop Owners</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter((u: User) => u.role === 'shop_owner').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-rich-black mb-2">Administrators</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {users.filter((u: User) => u.role === 'admin').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shops Tab */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Shop Management</h2>
              <Badge variant="outline" className="text-sm">
                {shops.filter((shop: Shop) => shop.isOnline).length} Online
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop: Shop) => (
                <Card key={shop.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-rich-black mb-1">{shop.name}</h3>
                        <p className="text-sm text-medium-gray">{shop.ownerName}</p>
                        <p className="text-sm text-medium-gray">{shop.city}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-medium-gray">
                          {shop.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-medium-gray">Rating:</span>
                        <span className="font-medium">⭐ {shop.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium-gray">Total Orders:</span>
                        <span className="font-medium">{shop.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium-gray">Status:</span>
                        <Badge className={shop.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {shop.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Platform Analytics</h2>
              <Button variant="outline" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Growth Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-medium-gray">User Growth:</span>
                      <span className="font-semibold text-green-600">+12% this month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Shop Growth:</span>
                      <span className="font-semibold text-green-600">+8% this month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Order Growth:</span>
                      <span className="font-semibold text-green-600">+15% this month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Order Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Document Printing:</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Photo Printing:</span>
                      <span className="font-semibold">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Business Materials:</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-medium-gray">Others:</span>
                      <span className="font-semibold">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Comprehensive Application View Modal */}
        {selectedApplication && (
          <ComprehensiveAdminApplicationView
            applications={[selectedApplication]}
            onClose={() => setSelectedApplication(null)}
            onStatusUpdate={(status: string, notes?: string) => {
              handleApplicationAction(selectedApplication, status as 'approved' | 'rejected', notes);
              setSelectedApplication(null);
            }}
          />
        )}

        {/* Comprehensive Admin Shop Edit Modal */}
        {editingApplication && (
          <ComprehensiveAdminShopEdit
            application={editingApplication}
            onClose={() => setEditingApplication(null)}
            onSave={() => {
              setEditingApplication(null);
              queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
            }}
          />
        )}
      </div>
    </div>
  );
}