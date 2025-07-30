import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Users, Store, FileText, Bell, Settings, CheckCircle, XCircle, 
  Clock, TrendingUp, Eye, Plus, Search, Filter, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import PrintEasyLogo from '@/components/common/printeasy-logo';

interface AdminStats {
  totalUsers: number;
  activeShops: number;
  pendingApplications: number;
  totalOrders: number;
}

interface ShopApplication {
  id: number;
  applicantId: number;
  shopName: string;
  shopSlug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  email: string;
  ownerContactName?: string;
  ownerEmail?: string;
  services: string[];
  workingHours: Record<string, any>;
  yearsOfExperience: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch shop applications
  const { data: applications = [], isLoading } = useQuery<ShopApplication[]>({
    queryKey: ['/api/admin/shop-applications'],
    enabled: !!user && user.role === 'admin',
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/shop-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Application updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateApplicationMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: number, adminNotes?: string) => {
    updateApplicationMutation.mutate({ 
      id, 
      status: 'rejected', 
      adminNotes: adminNotes || 'Application does not meet requirements' 
    });
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <PrintEasyLogo size="md" />
              <div>
                <h1 className="text-xl font-bold text-rich-black">PrintEasy Admin</h1>
                <p className="text-sm text-medium-gray">Platform Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-6 h-6 text-medium-gray" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                  {applications.filter(app => app.status === 'pending').length}
                </span>
              </Button>
              <div className="flex items-center space-x-2">
                <PrintEasyLogo size="sm" />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 text-medium-gray" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medium-gray">Total Users</p>
                  <p className="text-2xl font-bold text-rich-black">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medium-gray">Active Shops</p>
                  <p className="text-2xl font-bold text-rich-black">{stats?.activeShops || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-success-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medium-gray">Pending Applications</p>
                  <p className="text-2xl font-bold text-rich-black">
                    {applications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning-amber" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-medium-gray">Total Orders</p>
                  <p className="text-2xl font-bold text-rich-black">{stats?.totalOrders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Applications */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="text-xl font-semibold text-rich-black">Shop Applications</CardTitle>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-medium-gray" />
                  <Input
                    placeholder="Search by shop name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-w-[250px]"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-32 rounded-lg"></div>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <p className="text-medium-gray">No applications found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-rich-black">{application.shopName}</h3>
                            <p className="text-sm text-medium-gray">/{application.shopSlug}</p>
                          </div>
                          <Badge 
                            className={`${
                              application.status === 'pending' 
                                ? 'bg-yellow-100 text-warning-amber' 
                                : application.status === 'approved'
                                ? 'bg-green-100 text-success-green'
                                : 'bg-red-100 text-error-red'
                            }`}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-rich-black">Location</p>
                            <p className="text-sm text-medium-gray">{application.address}, {application.city}, {application.state} - {application.pinCode}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-rich-black">Contact</p>
                            <p className="text-sm text-medium-gray">{application.email}</p>
                            {application.ownerContactName && (
                              <p className="text-sm text-medium-gray">{application.ownerContactName}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-rich-black">Experience</p>
                            <p className="text-sm text-medium-gray">{application.yearsOfExperience} years</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-rich-black">Applied</p>
                            <p className="text-sm text-medium-gray">
                              {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-rich-black mb-2">Services</p>
                          <div className="flex flex-wrap gap-2">
                            {(application.services as string[]).map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {application.adminNotes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-rich-black">Admin Notes</p>
                            <p className="text-sm text-medium-gray">{application.adminNotes}</p>
                          </div>
                        )}
                      </div>
                      
                      {application.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:ml-6">
                          <Button
                            onClick={() => handleApprove(application.id)}
                            disabled={updateApplicationMutation.isPending}
                            className="bg-success-green text-white hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(application.id)}
                            disabled={updateApplicationMutation.isPending}
                            className="border-error-red text-error-red hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}