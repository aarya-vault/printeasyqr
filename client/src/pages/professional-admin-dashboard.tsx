import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/professional-layout';
import { DashboardStats, DashboardCard, QuickActions, DashboardTable } from '@/components/professional-dashboard';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Search,
  Eye,
  Edit,
  Building,
  FileText,
  TrendingUp,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


interface ShopApplication {
  id: number;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  services: string[];
  experience: number;
}

interface Shop {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  city: string;
  state: string;
  isActive: boolean;
  totalOrders: number;
  createdAt: string;
}

interface PlatformStats {
  totalShops: number;
  activeShops: number;
  totalOrders: number;
  pendingApplications: number;
  totalCustomers: number;
  todayOrders: number;
}

export default function ProfessionalAdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ShopApplication[]>({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/admin/shops'],
    enabled: !!user && user.role === 'admin'
  });

  // Mutations
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, { 
        method: 'POST' 
      });
      if (!response.ok) throw new Error('Failed to approve application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    }
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, { 
        method: 'POST' 
      });
      if (!response.ok) throw new Error('Failed to reject application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
    }
  });

  // Filter applications
  const filteredApplications = applications.filter(app =>
    app.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate dashboard stats
  const dashboardStats = React.useMemo(() => [
    {
      label: 'Total Shops',
      value: stats?.totalShops || 0,
      icon: <Building className="h-4 w-4" />,
      change: `${stats?.activeShops || 0} active`,
      changeType: 'positive' as const
    },
    {
      label: 'Pending Applications',
      value: stats?.pendingApplications || 0,
      icon: <FileText className="h-4 w-4" />,
      changeType: stats?.pendingApplications ? 'neutral' as const : 'positive' as const
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: <ShoppingBag className="h-4 w-4" />,
      change: `${stats?.todayOrders || 0} today`,
      changeType: 'positive' as const
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: <Users className="h-4 w-4" />,
      changeType: 'positive' as const
    }
  ], [stats]);

  const quickActions = [
    {
      label: 'Review Applications',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => setLocation('/admin/applications'),
      variant: 'primary' as const,
      disabled: (stats?.pendingApplications || 0) === 0
    },
    {
      label: 'Manage Shops',
      icon: <Building className="h-4 w-4" />,
      onClick: () => setLocation('/admin/shops'),
      variant: 'secondary' as const
    },
    {
      label: 'Platform Analytics',
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: () => setLocation('/admin/analytics'),
      variant: 'outline' as const
    },
    {
      label: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => setLocation('/admin/settings'),
      variant: 'outline' as const
    }
  ];

  const handleApproveApplication = async (applicationId: number) => {
    try {
      await approveApplicationMutation.mutateAsync(applicationId);
    } catch (error) {
      console.error('Failed to approve application:', error);
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    try {
      await rejectApplicationMutation.mutateAsync(applicationId);
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (statsLoading || applicationsLoading || shopsLoading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <ProfessionalLoading message="Loading admin dashboard..." size="lg" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Admin Dashboard"
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation('/admin/analytics')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button 
            className="btn-primary"
            onClick={() => setLocation('/admin/applications')}
            disabled={(stats?.pendingApplications || 0) === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Review Applications {stats?.pendingApplications ? `(${stats.pendingApplications})` : ''}
          </Button>
        </div>
      }
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          PrintEasy Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage the platform, review shop applications, and monitor system performance.
        </p>
      </div>

      {/* Stats Overview */}
      <DashboardStats stats={dashboardStats} loading={statsLoading} />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Applications */}
        <DashboardCard
          title="Pending Shop Applications"
          description="New shop registration requests"
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/admin/applications')}
            >
              View All
            </Button>
          }
        >
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-professional"
              />
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching applications' : 'No pending applications'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'All shop applications have been processed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto optimized-scroll">
              {filteredApplications.slice(0, 5).map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-black mb-1">{application.shopName}</h4>
                      <p className="text-sm text-gray-600">
                        {application.ownerName} • {application.city}, {application.state}
                      </p>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {application.services.length} services • {application.experience} years experience
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied: {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {application.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => handleApproveApplication(application.id)}
                        disabled={approveApplicationMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectApplication(application.id)}
                        disabled={rejectApplicationMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/admin/applications/${application.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Active Shops */}
        <DashboardCard
          title="Active Shops"
          description="Currently registered print shops"
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/admin/shops')}
            >
              Manage All
            </Button>
          }
        >
          {shops.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active shops</h3>
              <p className="text-gray-500">
                Shop applications will appear here once approved.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto optimized-scroll">
              {shops.slice(0, 5).map((shop) => (
                <div key={shop.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-black mb-1">{shop.name}</h4>
                      <p className="text-sm text-gray-600">
                        {shop.ownerName} • {shop.city}, {shop.state}
                      </p>
                    </div>
                    <Badge className={shop.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">
                      {shop.totalOrders} total orders • Joined: {new Date(shop.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/admin/shops/${shop.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/admin/shops/${shop.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Recent Activity Summary */}
      <DashboardCard
        title="Platform Overview"
        description="Quick summary of platform activity"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-black mb-1">{stats?.totalShops || 0}</div>
            <div className="text-sm text-gray-600">Total Shops</div>
            <div className="text-xs text-green-600 mt-1">{stats?.activeShops || 0} active</div>
          </div>
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-black mb-1">{stats?.totalOrders || 0}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-xs text-blue-600 mt-1">{stats?.todayOrders || 0} today</div>
          </div>
          <div className="text-center p-4 border border-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-black mb-1">{stats?.totalCustomers || 0}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
            <div className="text-xs text-purple-600 mt-1">Growing platform</div>
          </div>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}