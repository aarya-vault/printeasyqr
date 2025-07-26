import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  CheckCircle, Phone, MessageSquare, FileText, 
  MapPin, Clock, Home, ShoppingBag
} from 'lucide-react';

interface OrderDetails {
  id: number;
  customerId: number;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: any;
  files?: string[];
  status: string;
  isUrgent: boolean;
  walkinTime?: string;
  createdAt: string;
  shop: {
    id: number;
    name: string;
    address: string;
    phone: string;
    publicOwnerName?: string;
  };
  customer: {
    id: number;
    name: string;
    phone: string;
  };
}

export default function OrderConfirmation() {
  const [, params] = useRoute('/order-confirmation/:orderId');
  const [, navigate] = useLocation();
  const { user, login } = useAuth();

  // Get order details
  const { data: orderData, isLoading } = useQuery<{ order: OrderDetails }>({
    queryKey: [`/api/orders/${params?.orderId}/details`],
    enabled: !!params?.orderId,
  });

  const order = orderData?.order;

  const handleCallShop = () => {
    if (order?.shop.phone) {
      window.location.href = `tel:${order.shop.phone}`;
    }
  };

  const handleChatWithShop = async () => {
    if (!user && order) {
      // Auto-login the customer
      try {
        await login(order.customer.phone, undefined, 'customer');
        setTimeout(() => {
          navigate(`/customer-dashboard/chat/${order.id}`);
        }, 100);
      } catch (error) {
        console.error('Login failed:', error);
        navigate(`/customer-dashboard/chat/${order.id}`);
      }
    } else {
      navigate(`/customer-dashboard/chat/${order.id}`);
    }
  };

  const handleGoToDashboard = async () => {
    if (!user && order) {
      // Auto-login the customer
      try {
        await login(order.customer.phone, undefined, 'customer');
        setTimeout(() => {
          navigate('/customer-dashboard');
        }, 100);
      } catch (error) {
        console.error('Login failed:', error);
      }
    } else {
      navigate('/customer-dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} className="bg-brand-yellow text-rich-black">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success Card */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-rich-black mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Your order #{order.id} has been successfully placed
            </p>
            <Badge variant={order.isUrgent ? 'destructive' : 'default'} className="text-sm">
              {order.isUrgent ? 'Urgent Order' : 'Regular Order'}
            </Badge>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <div className="flex items-center gap-2">
                  {order.type === 'upload' ? (
                    <>
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">File Upload</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Walk-in Order</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant="secondary">{order.status}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium">{order.customer.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Contact Number</p>
                <p className="font-medium">{order.customer.phone}</p>
              </div>
            </div>

            {order.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Requirements</p>
                <p className="text-gray-700">{order.description}</p>
              </div>
            )}

            {order.files && order.files.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Uploaded Files</p>
                <div className="space-y-1">
                  {order.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{order.shop.name}</h3>
              {order.shop.publicOwnerName && (
                <p className="text-sm text-gray-600">Owner: {order.shop.publicOwnerName}</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">{order.shop.address}</p>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">{order.shop.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCallShop}
            className="w-full bg-green-500 text-white hover:bg-green-600"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Shop Owner
          </Button>

          <Button
            onClick={handleChatWithShop}
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Shop Owner
          </Button>

          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Go to Your Dashboard
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}