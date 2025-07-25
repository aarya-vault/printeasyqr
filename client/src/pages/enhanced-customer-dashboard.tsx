import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Upload, Clock, CheckCircle2, AlertCircle, 
  User, LogOut, Plus, Search, Filter, Star, MapPin, Phone 
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  services: string[];
  isOnline: boolean;
}

interface Order {
  id: number;
  title: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  shopName: string;
  createdAt: string;
  estimatedBudget?: number;
  files?: string[];
}

export default function EnhancedCustomerDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [orderForm, setOrderForm] = useState({
    title: '',
    description: '',
    specifications: '',
    estimatedPages: '',
    estimatedBudget: '',
    isUrgent: false
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/shops'],
    queryFn: async () => {
      const response = await fetch('/api/shops');
      if (!response.ok) throw new Error('Failed to fetch shops');
      return response.json();
    }
  });

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/customer', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/customer/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders'); 
      return response.json();
    },
    enabled: !!user?.id
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: FormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: orderData,
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer', user?.id] });
      setOrderForm({
        title: '',
        description: '',
        specifications: '',
        estimatedPages: '',
        estimatedBudget: '',
        isUrgent: false
      });
      setFiles(null);
      setSelectedShop(null);
      toast({
        title: "Order Created Successfully!",
        description: "Your printing order has been submitted to the shop.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !user) return;

    const formData = new FormData();
    formData.append('customerId', user.id.toString());
    formData.append('shopId', selectedShop.id.toString());
    formData.append('type', 'file_upload');
    formData.append('title', orderForm.title);
    formData.append('description', orderForm.description);
    formData.append('specifications', orderForm.specifications);
    formData.append('estimatedPages', orderForm.estimatedPages);
    formData.append('estimatedBudget', orderForm.estimatedBudget);
    formData.append('isUrgent', orderForm.isUrgent.toString());

    if (files) {
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }

    createOrderMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'processing': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'ready': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredShops = shops.filter((shop: Shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-rich-black mb-4">Please login to continue</h2>
          <Button onClick={() => window.location.href = '/'}>Go to Login</Button>
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
                <User className="w-6 h-6 text-rich-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Customer Dashboard</h1>
                <p className="text-sm text-medium-gray">Welcome back, {user.name || user.phone}</p>
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
        <Tabs defaultValue="shops" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit">
            <TabsTrigger value="shops" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Find Shops</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>My Orders</span>
            </TabsTrigger>
            <TabsTrigger value="new-order" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </TabsTrigger>
          </TabsList>

          {/* Find Shops Tab */}
          <TabsContent value="shops" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search shops by name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>

            {shopsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop: Shop) => (
                  <Card key={shop.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-rich-black mb-1">{shop.name}</h3>
                          <div className="flex items-center space-x-1 text-sm text-medium-gray">
                            <MapPin className="w-4 h-4" />
                            <span>{shop.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{shop.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-medium-gray mb-4 line-clamp-2">{shop.address}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {shop.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {shop.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{shop.services.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-medium-gray">
                            {shop.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedShop(shop)}
                          className="bg-brand-yellow text-rich-black hover:bg-yellow-400"
                        >
                          Select Shop
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-rich-black">My Orders</h2>
              <Badge variant="outline" className="text-sm">
                {orders.length} Total Orders
              </Badge>
            </div>

            {ordersLoading ? (
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
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">No orders yet</h3>
                  <p className="text-medium-gray mb-6">Start by finding a print shop and placing your first order</p>
                  <Button onClick={() => document.querySelector('[value="shops"]')?.click()}>
                    Find Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(order.status)}
                            <h3 className="text-lg font-semibold text-rich-black">{order.title}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-medium-gray mb-2">Shop: {order.shopName}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-medium-gray">
                            <span>Order #{order.id}</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.estimatedBudget && (
                              <span>Budget: ₹{order.estimatedBudget}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {order.status === 'ready' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Mark Collected
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* New Order Tab */}
          <TabsContent value="new-order" className="space-y-6">
            {!selectedShop ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-rich-black mb-2">Select a Print Shop First</h3>
                  <p className="text-medium-gray mb-6">Choose a print shop from the "Find Shops" tab to create a new order</p>
                  <Button onClick={() => document.querySelector('[value="shops"]')?.click()}>
                    Browse Print Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Selected Shop: {selectedShop.name}</span>
                    </CardTitle>
                    <p className="text-medium-gray">{selectedShop.address}</p>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Create New Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleOrderSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-rich-black mb-2">
                            Order Title *
                          </label>
                          <Input
                            placeholder="e.g., Business Card Printing"
                            value={orderForm.title}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-rich-black mb-2">
                            Estimated Pages
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            value={orderForm.estimatedPages}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, estimatedPages: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Description *
                        </label>
                        <Textarea
                          placeholder="Describe what you need to print..."
                          value={orderForm.description}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Specifications
                        </label>
                        <Textarea
                          placeholder="Paper size, color preferences, binding requirements, etc."
                          value={orderForm.specifications}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, specifications: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-rich-black mb-2">
                          Upload Files
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-yellow transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                            onChange={(e) => setFiles(e.target.files)}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-sm text-medium-gray">
                              Click to upload files or drag and drop
                            </span>
                            <p className="text-xs text-medium-gray mt-1">
                              PDF, DOC, DOCX, JPG, PNG, TXT (Max 50MB each)
                            </p>
                          </label>
                          {files && files.length > 0 && (
                            <div className="mt-4 text-sm text-rich-black">
                              {files.length} file(s) selected
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-rich-black mb-2">
                            Estimated Budget (₹)
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            value={orderForm.estimatedBudget}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <input
                            type="checkbox"
                            id="urgent"
                            checked={orderForm.isUrgent}
                            onChange={(e) => setOrderForm(prev => ({ ...prev, isUrgent: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="urgent" className="text-sm text-rich-black">
                            Urgent Order (Express Processing)
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setSelectedShop(null)}
                        >
                          Change Shop
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createOrderMutation.isPending}
                          className="bg-rich-black text-white hover:bg-gray-800"
                        >
                          {createOrderMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Order
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}