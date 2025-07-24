import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Bell, LogOut, Users, Store, FileText, DollarSign, UserPlus, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PlatformStats, ShopApplication } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not an admin
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch platform stats
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/analytics/platform-stats'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch pending shop applications
  const { data: pendingApplications = [], isLoading: applicationsLoading } = useQuery<ShopApplication[]>({
    queryKey: ['/api/shop-applications/pending'],
    enabled: !!user && user.role === 'admin',
  });

  // Update shop application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: 'approved' | 'rejected'; adminNotes?: string }) => {
      const response = await fetch(`/api/shop-applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-applications/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/platform-stats'] });
      toast({
        title: variables.status === 'approved' ? "Shop approved successfully" : "Shop application rejected",
        description: variables.status === 'approved' 
          ? "The shop owner has been notified and can now start accepting orders."
          : "The applicant has been notified of the rejection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleApproveShop = async (id: number) => {
    await updateApplicationMutation.mutateAsync({
      id,
      status: 'approved',
      adminNotes: 'Application approved after review.'
    });
  };

  const handleRejectShop = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      await updateApplicationMutation.mutateAsync({
        id,
        status: 'rejected',
        adminNotes: reason
      });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-medium-gray mx-auto mb-4" />
          <p className="text-medium-gray">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const recentActivities = [
    {
      id: 1,
      description: 'New shop application from "Digital Print Hub"',
      time: '2 hours ago',
      type: 'Pending'
    },
    {
      id: 2,
      description: 'Shop "Quick Prints" has been approved',
      time: '4 hours ago',
      type: 'Approved'
    },
    {
      id: 3,
      description: 'New customer registration: John Doe',
      time: '6 hours ago',
      type: 'User'
    },
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Admin Dashboard</h1>
                <p className="text-sm text-medium-gray">Platform Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-6 h-6 text-medium-gray" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                  {pendingApplications.length}
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-medium-gray" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shops">Shop Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-rich-black" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {statsLoading ? '...' : stats?.totalUsers.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-medium-gray">Total Users</p>
                      <p className="text-xs text-success-green">+12% this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-success-green rounded-xl flex items-center justify-center mr-4">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {statsLoading ? '...' : stats?.activeShops || 0}
                      </p>
                      <p className="text-sm text-medium-gray">Active Shops</p>
                      <p className="text-xs text-success-green">+8% this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-warning-amber rounded-xl flex items-center justify-center mr-4">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        {statsLoading ? '...' : stats?.totalOrders.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-medium-gray">Total Orders</p>
                      <p className="text-xs text-success-green">+23% this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-rich-black rounded-xl flex items-center justify-center mr-4">
                      <DollarSign className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rich-black">
                        ₹{statsLoading ? '...' : stats?.monthlyRevenue.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-medium-gray">Monthly Revenue</p>
                      <p className="text-xs text-success-green">+18% this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activities */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-rich-black mb-4">Recent Activities</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
                      <div className="w-10 h-10 bg-light-gray rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-medium-gray" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-rich-black">{activity.description}</p>
                        <p className="text-xs text-medium-gray">{activity.time}</p>
                      </div>
                      <Badge className="text-xs bg-brand-yellow text-rich-black">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Shop Management Tab */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Shop Management</h2>
              <Button className="bg-brand-yellow text-rich-black hover:bg-yellow-400">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Shop
              </Button>
            </div>
            
            {/* Shop Applications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-rich-black mb-4">Pending Applications</h3>
                
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-20 rounded-lg"></div>
                    ))}
                  </div>
                ) : pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                    <p className="text-medium-gray">No pending shop applications</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-medium-gray">Shop Name</th>
                          <th className="text-left py-3 px-4 font-medium text-medium-gray">Applicant</th>
                          <th className="text-left py-3 px-4 font-medium text-medium-gray">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-medium-gray">Applied</th>
                          <th className="text-left py-3 px-4 font-medium text-medium-gray">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApplications.map((application) => (
                          <tr key={application.id} className="border-b border-gray-200 hover:bg-light-gray">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-rich-black">{application.shopName}</p>
                                <p className="text-sm text-medium-gray">
                                  {Array.isArray(application.services) ? application.services.join(', ') : 'Full service printing'}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-rich-black">Applicant #{application.applicantId}</p>
                              <p className="text-sm text-medium-gray">{application.email || 'No email'}</p>
                            </td>
                            <td className="py-3 px-4 text-rich-black">
                              {application.city}, {application.state}
                            </td>
                            <td className="py-3 px-4 text-medium-gray">
                              {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm"
                                  onClick={() => handleApproveShop(application.id)}
                                  className="bg-success-green text-white hover:bg-green-600"
                                  disabled={updateApplicationMutation.isPending}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectShop(application.id)}
                                  disabled={updateApplicationMutation.isPending}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">User Management</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                  <p className="text-medium-gray">User management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">Analytics</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                  <p className="text-medium-gray">Advanced analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
