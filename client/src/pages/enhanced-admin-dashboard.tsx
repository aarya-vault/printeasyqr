import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User, Shop, ShopApplication, PlatformStats, SearchQueries } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, Users, Store, Package, TrendingUp, CheckCircle2, 
  XCircle, Clock, LogOut, Search, Filter, Eye, MessageSquare,
  BarChart3, DollarSign, AlertTriangle, UserCheck, Settings, Edit3, Ban, Star
} from 'lucide-react';
import { ShopViewModal } from "@/components/admin/shop-view-modal";
import { ShopEditModal } from "@/components/admin/shop-edit-modal";
import AdminUserEditModal from "@/components/admin-user-edit-modal";
import ComprehensiveShopManagementModal from "@/components/comprehensive-shop-management-modal";
import ShopApplicationEditModal from "@/components/shop-application-edit-modal";
import EnhancedAdminAnalytics from "@/components/enhanced-admin-analytics";



// All interfaces now imported from centralized types

export default function EnhancedAdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refresh queries when component mounts to ensure session is established
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Small delay to ensure session is fully established
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, queryClient]);
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [editingApplication, setEditingApplication] = useState<ShopApplication | null>(null);
  
  // Modal states for shops
  const [selectedShopForView, setSelectedShopForView] = useState<Shop | null>(null);
  const [selectedShopForEdit, setSelectedShopForEdit] = useState<Shop | null>(null);
  const [selectedShopForManagement, setSelectedShopForManagement] = useState<Shop | null>(null);
  
  // Modal states for users - restoring detailed user management
  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  const [adminNotes, setAdminNotes] = useState('');
  const [searchQueries, setSearchQueries] = useState<SearchQueries>({
    applications: '',
    users: '',
    shops: '',
    analytics: ''
  });
  const [userFilter, setUserFilter] = useState<'all' | 'customer' | 'shop_owner'>('all');

  // Fetch platform statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
    retry: 3,
    retryDelay: 1000
  });

  // Fetch shop applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ShopApplication[]>({
    queryKey: ['/api/admin/shop-applications'],
    enabled: !!user && user.role === 'admin',
    retry: 3,
    retryDelay: 1000
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
    retry: 3,
    retryDelay: 1000
  });

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/admin/shops'],
    enabled: !!user && user.role === 'admin',
    retry: 3,
    retryDelay: 1000
  });

  // Update shop application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await apiRequest(`/api/shop-applications/${id}`, 'PATCH', {
        status,
        adminNotes: notes
      });
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
      case 'pending': return <Clock className="w-5 h-5 text-brand-yellow" />;
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-brand-yellow/20 text-rich-black';
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
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-rich-black" />
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
              className="flex items-center space-x-2 border-brand-yellow text-rich-black hover:bg-brand-yellow/10"
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
                  <p className="text-3xl font-bold text-brand-yellow">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-rich-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Active Shops</p>
                  <p className="text-3xl font-bold text-brand-yellow">
                    {statsLoading ? '...' : stats?.activeShops || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6 text-rich-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Total Orders</p>
                  <p className="text-3xl font-bold text-brand-yellow">
                    {statsLoading ? '...' : stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-rich-black" />
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-rich-black">Shop Applications</h2>
              <Badge variant="outline" className="text-sm">
                {applications.filter((app: ShopApplication) => app.status === 'pending').length} Pending
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-gray w-4 h-4" />
                <Input
                  placeholder="Search applications by shop name, owner, city..."
                  value={searchQueries.applications}
                  onChange={(e) => setSearchQueries({ ...searchQueries, applications: e.target.value })}
                  className="pl-10 border-brand-yellow/30 focus:border-brand-yellow"
                />
              </div>
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
                {applications
                  .filter((app: ShopApplication) => {
                    if (!searchQueries.applications) return true;
                    const search = searchQueries.applications.toLowerCase();
                    return (
                      app.publicShopName?.toLowerCase().includes(search) ||
                      app.ownerFullName?.toLowerCase().includes(search) ||
                      app.city?.toLowerCase().includes(search) ||
                      app.publicOwnerName?.toLowerCase().includes(search)
                    );
                  })
                  .map((application: ShopApplication) => (
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
                            <p>Applicant: {application.ownerFullName || application.applicant?.name || 'Name not provided'}</p>
                            <p>Email: {application.email}</p>
                            <p>Location: {application.city || 'Not specified'}, {application.state || 'Not specified'}</p>
                            <p>Experience: {application.formationYear ? new Date().getFullYear() - application.formationYear : 'Not specified'} years</p>
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
                          <p className="text-medium-gray">{selectedApplication.publicShopName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-rich-black">Shop Slug</label>
                          <p className="text-medium-gray">{selectedApplication.shopSlug}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-rich-black">Applicant</label>
                          <p className="text-medium-gray">{selectedApplication.ownerFullName || selectedApplication.applicant?.name || 'Name not provided'}</p>
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
                          className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-rich-black">User Management</h2>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-gray w-4 h-4" />
                <Input
                  placeholder="Search users by name, phone, email..."
                  value={searchQueries.users}
                  onChange={(e) => setSearchQueries({ ...searchQueries, users: e.target.value })}
                  className="pl-10 border-brand-yellow/30 focus:border-brand-yellow"
                />
              </div>
              <Select value={userFilter} onValueChange={(value: any) => setUserFilter(value)}>
                <SelectTrigger className="w-full sm:w-[200px] border-brand-yellow/30">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customer">Customers Only</SelectItem>
                  <SelectItem value="shop_owner">Shop Owners Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User List */}
            <div className="space-y-4">
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-5 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-rich-black mb-2">No users found</h3>
                    <p className="text-medium-gray">User accounts will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users
                    .filter((user: any) => user.role !== 'admin') // Hide admin users from management
                    .filter((user: any) => {
                      // Filter by role
                      if (userFilter !== 'all' && user.role !== userFilter) return false;
                      // Filter by search
                      if (!searchQueries.users) return true;
                      const search = searchQueries.users.toLowerCase();
                      return user.name?.toLowerCase().includes(search) || 
                             user.phone?.toLowerCase().includes(search) ||
                             user.email?.toLowerCase().includes(search);
                    })
                    .map((user: any) => (
                      <Card key={user.id} className="border border-gray-200 hover:border-brand-yellow/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-rich-black">{user.name || 'Unnamed User'}</h3>
                                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'shop_owner' ? 'secondary' : 'outline'}>
                                  {user.role}
                                </Badge>
                                <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                                  {user.isActive ? (
                                    <>
                                      <Shield className="w-3 h-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-medium-gray">
                                <p className="flex items-center">
                                  <span className="font-medium">Phone:</span>
                                  <span className="ml-2">{user.phone}</span>
                                </p>
                                {user.email && (
                                  <p className="flex items-center">
                                    <span className="font-medium">Email:</span>
                                    <span className="ml-2">{user.email}</span>
                                  </p>
                                )}
                                <p className="flex items-center">
                                  <span className="font-medium">Joined:</span>
                                  <span className="ml-2">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Restored Detailed Action Buttons */}
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-brand-yellow/30 hover:bg-brand-yellow/10"
                              onClick={() => setSelectedUserForView(user)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-brand-yellow/30 hover:bg-brand-yellow/10"
                              onClick={() => window.open(`tel:${user.phone}`, '_blank')}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Contact
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                              onClick={() => setSelectedUserForEdit(user)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Shop Management Tab */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-rich-black">Shop Management</h2>
                <p className="text-medium-gray">Manage active shops and their settings</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search shops..."
                    value={searchQueries.shops}
                    onChange={(e) => setSearchQueries(prev => ({ ...prev, shops: e.target.value }))}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Shop Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Store className="w-8 h-8 text-brand-yellow" />
                    <div>
                      <p className="text-2xl font-bold text-rich-black">{shops.length}</p>
                      <p className="text-sm text-medium-gray">Total Shops</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {shops.filter((shop: Shop) => shop.isApproved).length}
                      </p>
                      <p className="text-sm text-medium-gray">Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-brand-yellow" />
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {shops.filter((shop: Shop) => shop.isOnline).length}
                      </p>
                      <p className="text-sm text-medium-gray">Online Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {shops.reduce((total: number, shop: Shop) => total + (shop.totalOrders || 0), 0)}
                      </p>
                      <p className="text-sm text-medium-gray">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shop List */}
            <div className="space-y-4">
              {shopsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-5 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : shops.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-rich-black mb-2">No shops found</h3>
                    <p className="text-medium-gray">Approved shops will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops
                    .filter((shop: Shop) => {
                      if (!searchQueries.shops) return true;
                      const search = searchQueries.shops.toLowerCase();
                      return shop.name?.toLowerCase().includes(search) || 
                             shop.ownerName?.toLowerCase().includes(search) ||
                             shop.city?.toLowerCase().includes(search);
                    })
                    .map((shop: Shop) => (
                      <Card key={shop.id} className="border border-gray-200 hover:border-brand-yellow/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-rich-black">{shop.name}</h3>
                                <Badge variant={shop.isApproved ? 'default' : 'secondary'}>
                                  {shop.isApproved ? 'Approved' : 'Pending'}
                                </Badge>
                                <Badge variant={shop.isOnline ? 'default' : 'outline'} className="text-xs">
                                  {shop.isOnline ? 'Online' : 'Offline'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-medium-gray">
                                <p className="flex items-center">
                                  <span className="font-medium">Owner:</span>
                                  <span className="ml-2">{shop.ownerName}</span>
                                </p>
                                <p className="flex items-center">
                                  <span className="font-medium">Location:</span>
                                  <span className="ml-2">{shop.city}</span>
                                </p>
                                <p className="flex items-center">
                                  <span className="font-medium">Orders:</span>
                                  <span className="ml-2">{shop.totalOrders || 0}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Restored Shop Action Buttons */}
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-brand-yellow/30 hover:bg-brand-yellow/10"
                              onClick={() => setSelectedShopForView(shop)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-brand-yellow/30 hover:bg-brand-yellow/10"
                              onClick={() => window.open(`tel:${shop.contactNumber}`, '_blank')}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Contact
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                              onClick={() => setSelectedShopForManagement(shop)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-rich-black">Platform Analytics</h2>
                <p className="text-medium-gray">View platform statistics and performance metrics</p>
              </div>
            </div>
            
            {/* Platform Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-brand-yellow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray mb-1">Total Revenue Potential</p>
                      <p className="text-2xl font-bold text-rich-black">
                        ₹{shops.reduce((total: number, shop: Shop) => total + (shop.totalOrders || 0) * 50, 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-success-green mt-1">Avg ₹50/order</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-brand-yellow opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray mb-1">Active Users</p>
                      <p className="text-2xl font-bold text-rich-black">
                        {users.filter((u: User) => u.isActive).length}
                      </p>
                      <p className="text-xs text-medium-gray mt-1">
                        {users.filter((u: User) => u.role === 'customer').length} customers
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray mb-1">Shop Performance</p>
                      <p className="text-2xl font-bold text-rich-black">
                        {Math.round(shops.reduce((total: number, shop: Shop) => total + (shop.totalOrders || 0), 0) / shops.length) || 0}
                      </p>
                      <p className="text-xs text-medium-gray mt-1">Avg orders/shop</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-medium-gray mb-1">Platform Health</p>
                      <p className="text-2xl font-bold text-rich-black">
                        {Math.round((shops.filter((s: Shop) => s.isOnline).length / shops.length) * 100) || 0}%
                      </p>
                      <p className="text-xs text-medium-gray mt-1">Shops online</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Performing Shops */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand-yellow" />
                      Top Performing Shops
                    </span>
                    <Badge variant="outline">By Orders</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shops
                      .sort((a: Shop, b: Shop) => (b.totalOrders || 0) - (a.totalOrders || 0))
                      .slice(0, 5)
                      .map((shop: Shop, index: number) => (
                        <div key={shop.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-brand-yellow text-rich-black' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-orange-300 text-orange-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-rich-black">{shop.name}</p>
                              <p className="text-xs text-medium-gray">{shop.city}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-rich-black">{shop.totalOrders || 0}</p>
                            <p className="text-xs text-medium-gray">orders</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-yellow" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-rich-black">Customers</p>
                          <p className="text-xs text-medium-gray">End users placing orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-rich-black">
                          {users.filter((u: User) => u.role === 'customer').length}
                        </p>
                        <p className="text-xs text-medium-gray">
                          {Math.round((users.filter((u: User) => u.role === 'customer').length / users.length) * 100)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Store className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-rich-black">Shop Owners</p>
                          <p className="text-xs text-medium-gray">Business operators</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-rich-black">
                          {users.filter((u: User) => u.role === 'shop_owner').length}
                        </p>
                        <p className="text-xs text-medium-gray">
                          {Math.round((users.filter((u: User) => u.role === 'shop_owner').length / users.length) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shop Performance Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-brand-yellow" />
                    All Shop Analytics
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {shops.length} Total Shops
                    </Badge>
                    <Badge className="bg-success-green text-white text-xs">
                      {shops.filter((s: Shop) => s.isOnline).length} Online
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Shop Name</th>
                        <th className="text-left py-3 px-4">Location</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-center py-3 px-4">Orders</th>
                        <th className="text-center py-3 px-4">Rating</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shops.map((shop: Shop) => (
                        <tr key={shop.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{shop.name}</td>
                          <td className="py-3 px-4 text-medium-gray">{shop.city}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={shop.isOnline ? 'default' : 'outline'} className="text-xs">
                              {shop.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">{shop.totalOrders || 0}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-brand-yellow fill-current" />
                              {shop.rating || '0.0'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedShopForManagement(shop)}
                              className="text-brand-yellow hover:text-brand-yellow/80"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>














      </div>
      
      {/* User Management Modals - Restored */}
      {selectedUserForEdit && (
        <AdminUserEditModal
          user={selectedUserForEdit}
          onClose={() => setSelectedUserForEdit(null)}
          onSave={() => {
            setSelectedUserForEdit(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
          }}
        />
      )}
      
      {/* Shop Modals */}
      {selectedShopForView && (
        <ShopViewModal
          shop={selectedShopForView}
          onClose={() => setSelectedShopForView(null)}
        />
      )}
      
      {selectedShopForEdit && (
        <ShopEditModal
          shop={selectedShopForEdit}
          onClose={() => setSelectedShopForEdit(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
          }}
        />
      )}
      
      {/* Comprehensive Shop Management Modal */}
      {selectedShopForManagement && (
        <ComprehensiveShopManagementModal
          shop={selectedShopForManagement}
          onClose={() => setSelectedShopForManagement(null)}
          onUpdate={() => {
            setSelectedShopForManagement(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
          }}
        />
      )}

      {/* Shop Application Edit Modal */}
      {editingApplication && (
        <ShopApplicationEditModal
          application={editingApplication}
          onClose={() => setEditingApplication(null)}
          onUpdate={() => {
            setEditingApplication(null);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
          }}
        />
      )}
    </div>
  );
}