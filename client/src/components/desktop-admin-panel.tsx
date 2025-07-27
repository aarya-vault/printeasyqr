import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  Edit,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

interface DesktopAdminPanelProps {
  className?: string;
}

export default function DesktopAdminPanel({ className = '' }: DesktopAdminPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [selectedShopForSettings, setSelectedShopForSettings] = useState<Shop | null>(null);

  // Fetch admin data with real-time updates
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 5000, // Real-time stats updates every 5 seconds
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ShopApplication[]>({
    queryKey: ['/api/admin/applications'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 10000, // Check for new applications every 10 seconds
  });

  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/admin/shops'],
    enabled: !!user && user.role === 'admin',
  });

  // Application approval/rejection mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Application Updated",
        description: "Shop application status has been updated successfully.",
      });
      setSelectedApplication(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update shop mutation  
  const updateShopMutation = useMutation({
    mutationFn: async ({ shopId, shopData }: { shopId: number; shopData: any }) => {
      const response = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      });
      if (!response.ok) throw new Error('Failed to update shop');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Shop Updated",
        description: "Shop information has been updated successfully.",
      });
      setEditingShop(null);
      setSelectedShopForSettings(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shop. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter applications and shops based on search
  const filteredApplications = applications.filter(app =>
    app.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Real-time dashboard stats
  const dashboardStats = React.useMemo(() => [
    {
      label: 'Pending Applications',
      value: applications.filter(app => app.status === 'pending').length,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      urgent: applications.filter(app => app.status === 'pending').length > 5
    },
    {
      label: 'Active Shops',
      value: stats?.activeShops || 0,
      icon: <Building className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      urgent: false
    },
    {
      label: 'Total Orders Today',
      value: stats?.todayOrders || 0,
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      urgent: false
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      urgent: false
    }
  ], [applications, stats]);

  const getApplicationUrgency = (createdAt: string) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 7) return 'urgent';
    if (daysSinceCreated > 3) return 'attention';
    return 'normal';
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Real-time Admin Stats Dashboard */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className={`${stat.urgent ? 'border-red-300 shadow-md' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    {React.cloneElement(stat.icon, { className: `h-5 w-5 ${stat.color}` })}
                  </div>
                </div>
                {stat.urgent && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">Needs Attention</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications, shops, owners, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Admin Management Tabs */}
      <div className="p-6">
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">
              Shop Applications
              {applications.filter(app => app.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {applications.filter(app => app.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shops">Active Shops</TabsTrigger>
            <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
          </TabsList>

          {/* Shop Applications Tab */}
          <TabsContent value="applications" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pending Applications */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Pending Review</h3>
                  <Badge variant="secondary">
                    {filteredApplications.filter(app => app.status === 'pending').length}
                  </Badge>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredApplications
                      .filter(app => app.status === 'pending')
                      .map((application) => {
                        const urgency = getApplicationUrgency(application.createdAt);
                        return (
                          <Card 
                            key={application.id} 
                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                              urgency === 'urgent' ? 'border-red-300 bg-red-50' :
                              urgency === 'attention' ? 'border-yellow-300 bg-yellow-50' :
                              'border-gray-200'
                            }`}
                            onClick={() => setSelectedApplication(application)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-sm">{application.shopName}</h4>
                                  <p className="text-xs text-gray-600">{application.ownerName}</p>
                                </div>
                                {urgency === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-3">
                                {application.city}, {application.state}
                              </p>
                              <p className="text-xs text-gray-500 mb-3">
                                {application.experience} years experience
                              </p>
                              
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateApplicationMutation.mutate({ 
                                      applicationId: application.id, 
                                      status: 'approved' 
                                    });
                                  }}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                                  disabled={updateApplicationMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedApplication(application);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplicationMutation.mutate({ 
                                        applicationId: application.id, 
                                        status: 'rejected' 
                                      });
                                    }}
                                    className="flex-1 text-xs text-red-600 hover:text-red-700"
                                    disabled={updateApplicationMutation.isPending}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-400 mt-2">
                                Applied {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </ScrollArea>
              </div>

              {/* Processed Applications */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Recently Processed</h3>
                  <Badge variant="secondary">
                    {filteredApplications.filter(app => app.status !== 'pending').length}
                  </Badge>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredApplications
                      .filter(app => app.status !== 'pending')
                      .slice(0, 20)
                      .map((application) => (
                        <Card key={application.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-sm">{application.shopName}</h4>
                                <p className="text-xs text-gray-600">{application.ownerName}</p>
                              </div>
                              <Badge 
                                className={
                                  application.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {application.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {application.city}, {application.state}
                            </p>
                            <div className="text-xs text-gray-400">
                              {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Active Shops Tab */}
          <TabsContent value="shops" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {filteredShops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{shop.name}</h4>
                        <p className="text-xs text-gray-600">{shop.ownerName}</p>
                      </div>
                      <Badge 
                        className={
                          shop.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {shop.city}, {shop.state}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {shop.totalOrders} total orders
                    </p>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedShop(shop)}
                        className="flex-1 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingShop(shop)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedShopForSettings(shop)}
                        className="flex-1 text-xs"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      Joined {format(new Date(shop.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Platform Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Shops</span>
                      <span className="font-semibold">{stats?.totalShops || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Shops</span>
                      <span className="font-semibold">{stats?.activeShops || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="font-semibold">{stats?.totalOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Customers</span>
                      <span className="font-semibold">{stats?.totalCustomers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Orders Today</span>
                      <span className="font-semibold">{stats?.todayOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Applications</span>
                      <span className="font-semibold">{stats?.pendingApplications || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Shop Utilization</span>
                      <span className="font-semibold">
                        {stats?.activeShops && stats?.totalShops 
                          ? Math.round((stats.activeShops / stats.totalShops) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Shop Application Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedApplication(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Shop Information</h4>
                <p className="text-sm text-gray-600">Name: {selectedApplication.shopName}</p>
                <p className="text-sm text-gray-600">Owner: {selectedApplication.ownerName}</p>
                <p className="text-sm text-gray-600">Email: {selectedApplication.email}</p>
                <p className="text-sm text-gray-600">Phone: {selectedApplication.phone}</p>
                <p className="text-sm text-gray-600">Location: {selectedApplication.city}, {selectedApplication.state}</p>
                <p className="text-sm text-gray-600">Experience: {selectedApplication.experience} years</p>
              </div>
              
              <div>
                <h4 className="font-medium">Services Offered</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedApplication.services.map((service, index) => (
                    <Badge key={index} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateApplicationMutation.mutate({ 
                    applicationId: selectedApplication.id, 
                    status: 'approved' 
                  })}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={updateApplicationMutation.isPending}
                >
                  Approve Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateApplicationMutation.mutate({ 
                    applicationId: selectedApplication.id, 
                    status: 'rejected' 
                  })}
                  className="flex-1"
                  disabled={updateApplicationMutation.isPending}
                >
                  Reject Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shop Details Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Shop Details - {selectedShop.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedShop(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  <p className="text-sm text-gray-600">Shop Name: {selectedShop.name}</p>
                  <p className="text-sm text-gray-600">Owner: {selectedShop.ownerName}</p>
                  <p className="text-sm text-gray-600">Email: {selectedShop.email}</p>
                  <p className="text-sm text-gray-600">Location: {selectedShop.city}, {selectedShop.state}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Statistics</h4>
                  <p className="text-sm text-gray-600">Total Orders: {selectedShop.totalOrders}</p>
                  <p className="text-sm text-gray-600">Status: {selectedShop.isActive ? 'Active' : 'Inactive'}</p>
                  <p className="text-sm text-gray-600">Joined: {format(new Date(selectedShop.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setSelectedShop(null);
                    setEditingShop(selectedShop);
                  }}
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                >
                  Edit Shop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedShop(null);
                    setSelectedShopForSettings(selectedShop);
                  }}
                >
                  Manage Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shop Edit Modal */}
      {editingShop && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Shop - {editingShop.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingShop(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Shop Name</label>
                  <Input
                    defaultValue={editingShop.name}
                    onChange={(e) => setEditingShop({...editingShop, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Owner Name</label>
                  <Input
                    defaultValue={editingShop.ownerName}
                    onChange={(e) => setEditingShop({...editingShop, ownerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    defaultValue={editingShop.email}
                    onChange={(e) => setEditingShop({...editingShop, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Input
                      defaultValue={editingShop.city}
                      onChange={(e) => setEditingShop({...editingShop, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input
                      defaultValue={editingShop.state}
                      onChange={(e) => setEditingShop({...editingShop, state: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateShopMutation.mutate({ 
                    shopId: editingShop.id, 
                    shopData: {
                      name: editingShop.name,
                      ownerName: editingShop.ownerName,
                      email: editingShop.email,
                      city: editingShop.city,
                      state: editingShop.state
                    }
                  })}
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                  disabled={updateShopMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingShop(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shop Settings Modal */}
      {selectedShopForSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Shop Settings - {selectedShopForSettings.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedShopForSettings(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Shop Status</h4>
                    <p className="text-sm text-gray-600">Control whether the shop is active or inactive</p>
                  </div>
                  <Button
                    variant={selectedShopForSettings.isActive ? "default" : "outline"}
                    onClick={() => updateShopMutation.mutate({ 
                      shopId: selectedShopForSettings.id, 
                      shopData: { isActive: !selectedShopForSettings.isActive }
                    })}
                    disabled={updateShopMutation.isPending}
                  >
                    {selectedShopForSettings.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Shop Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-medium ml-2">{selectedShopForSettings.totalOrders}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Member Since:</span>
                      <span className="font-medium ml-2">{format(new Date(selectedShopForSettings.createdAt), 'MMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedShopForSettings(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}