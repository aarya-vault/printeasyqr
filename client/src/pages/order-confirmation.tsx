import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import UnifiedChatSystem from '@/components/unified-chat-system';
import { 
  CheckCircle, Phone, MessageSquare, FileText, 
  MapPin, Clock, Home, ShoppingBag, Calendar,
  AlertCircle, Star, ArrowRight, Info, User
} from 'lucide-react';

interface OrderDetails {
  id: number;
  customerId: number;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: any;
  files?: Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
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
  const [showChat, setShowChat] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get order details
  const { data: orderData, isLoading, error } = useQuery<{ order: OrderDetails }>({
    queryKey: [`/api/orders/${params?.orderId}/details`],
    enabled: !!params?.orderId && mounted,
  });

  const order = orderData?.order;

  const handleCallShop = () => {
    if (order?.shop.phone) {
      window.location.href = `tel:${order.shop.phone}`;
    }
  };

  const handleChatWithShop = async () => {
    if (!user && order) {
      try {
        await login({ phone: order.customer.phone });
        setShowChat(true);
      } catch (error) {
        console.error('Login failed:', error);
        setShowChat(true);
      }
    } else {
      setShowChat(true);
    }
  };

  const handleGoToDashboard = async () => {
    if (!user && order) {
      try {
        await login({ phone: order.customer.phone });
        setTimeout(() => {
          navigate('/customer-dashboard');
        }, 100);
      } catch (error) {
        console.error('Login failed:', error);
        navigate('/customer-dashboard');
      }
    } else {
      navigate('/customer-dashboard');
    }
  };

  // Helper function to get customer-friendly status
  const getCustomerFriendlyStatus = (status: string) => {
    switch (status) {
      case 'new':
        return {
          text: 'Order Received',
          description: 'Your order has been received and the shop will start processing it soon.',
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="w-4 h-4" />
        };
      case 'processing':
        return {
          text: 'Being Prepared',
          description: 'The shop is currently working on your order.',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <FileText className="w-4 h-4" />
        };
      case 'ready':
        return {
          text: 'Ready for Pickup',
          description: 'Your order is ready! Please visit the shop to collect it.',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'completed':
        return {
          text: 'Completed',
          description: 'Order successfully completed and collected.',
          color: 'bg-gray-100 text-gray-800',
          icon: <CheckCircle className="w-4 h-4" />
        };
      default:
        return {
          text: status,
          description: 'Order status update.',
          color: 'bg-gray-100 text-gray-800',
          icon: <Info className="w-4 h-4" />
        };
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error ? 'Failed to load order details.' : 'The order you\'re looking for doesn\'t exist.'}
            </p>
            <Button onClick={() => navigate('/')} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getCustomerFriendlyStatus(order?.status || 'new');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-yellow-400 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-black hover:bg-black hover:text-yellow-400 p-2"
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-black">Order Confirmation</h1>
            <div className="w-9" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-black mb-2">Order Confirmed!</h2>
            <p className="text-gray-700 mb-3">
              Order #{order.id} has been successfully placed with {order.shop.name}
            </p>
            {order.isUrgent && (
              <Badge className="bg-red-100 text-red-800">
                Priority Order
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{statusInfo.text}</h3>
                <p className="text-gray-600 text-sm mb-3">{statusInfo.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Ordered {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-black">{order.shop.name}</h3>
              {order.shop.publicOwnerName && (
                <p className="text-sm text-gray-600">Contact: {order.shop.publicOwnerName}</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-700">{order.shop.address}</p>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-700">{order.shop.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Type</p>
                <div className="flex items-center gap-2">
                  {order.type === 'upload' ? (
                    <>
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">File Upload Order</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Walk-in Order</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Order Title</p>
                <p className="font-medium">{order.title}</p>
              </div>
            </div>

            {order.description && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500 mb-2">Requirements</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{order.description}</p>
              </div>
            )}

            {order.files && order.files.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-500 mb-2">Uploaded Files ({order.files.length})</p>
                <div className="space-y-2">
                  {order.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-50 p-2 rounded">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        {typeof file === 'string' ? file : file.originalName || file.filename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleChatWithShop}
            className="w-full bg-yellow-400 text-black hover:bg-black hover:text-yellow-400 font-semibold"
            size="lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat with Shop Owner
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCallShop}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Shop
            </Button>

            <Button
              onClick={handleGoToDashboard}
              className="bg-black text-white hover:bg-gray-800"
            >
              <User className="w-4 h-4 mr-2" />
              My Orders
            </Button>
          </div>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
        </div>
      </div>

      {/* Unified Chat System */}
      {showChat && order && (
        <UnifiedChatSystem
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          initialOrderId={order.id}
          userRole="customer"
        />
      )}
    </div>
  );
}