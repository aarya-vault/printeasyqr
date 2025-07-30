import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, Users, Package, Search, Filter, 
  CheckCircle, XCircle, Clock, Eye 
} from 'lucide-react';

interface ShopApplication {
  id: number;
  publicShopName: string;
  shopSlug: string;
  city: string;
  state: string;
  email: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

interface PlatformStats {
  totalUsers: number;
  activeShops: number;
  totalOrders: number;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingApplication, setViewingApplication] = useState<ShopApplication | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shop applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/shop-applications'],
    queryFn: async () => {
      const response = await fetch('/api/shop-applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    }
  });

  // Fetch platform stats
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/shop-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes })
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Application updated',
        description: 'Application status has been updated successfully'
      });
      setViewingApplication(null);
    }
  });

  const filteredApplications = applications.filter((app: ShopApplication) => {
    const matchesSearch = app.publicShopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage PrintEasy platform and shop applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeShops || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Management */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Applications</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application: ShopApplication) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{application.publicShopName}</h3>
                          <Badge variant={
                            application.status === 'approved' ? 'default' :
                            application.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {application.city}, {application.state} • /{application.shopSlug}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingApplication(application)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {application.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusUpdate(application.id, 'approved')}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(application.id, 'rejected')}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}