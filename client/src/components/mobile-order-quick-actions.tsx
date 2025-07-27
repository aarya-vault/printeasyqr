import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageCircle,
  Phone,
  Eye,
  MapPin,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';

interface Order {
  id: number;
  type: 'upload' | 'walkin';
  status: 'new' | 'processing' | 'ready' | 'completed';
  description: string;
  customer?: {
    name: string;
    phone: string;
  };
  shop: {
    id: number;
    name: string;
    phone?: string;
  };
  files?: any[];
  createdAt: string;
  unreadMessages: number;
}

interface MobileOrderQuickActionsProps {
  order: Order;
  onChatOpen: () => void;
  className?: string;
}

export default function MobileOrderQuickActions({ 
  order, 
  onChatOpen, 
  className = '' 
}: MobileOrderQuickActionsProps) {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <FileText className="h-3 w-3" />;
      case 'ready':
        return <Eye className="h-3 w-3" />;
      case 'completed':
        return <Eye className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className={`mb-4 border border-gray-200 ${className}`}>
      <CardContent className="p-4">
        {/* Order Header - Mobile Optimized */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-lg text-black">#{order.id}</h4>
              <Badge className={`${getStatusColor(order.status)} text-xs flex items-center gap-1`}>
                {getStatusIcon(order.status)}
                {order.status}
              </Badge>
            </div>
            <p className="text-sm font-medium text-gray-900">{order.shop.name}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
            </p>
          </div>
          {order.unreadMessages > 0 && (
            <Badge variant="destructive" className="ml-2">
              {order.unreadMessages} new
            </Badge>
          )}
        </div>

        {/* Order Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">{order.description}</p>
          {order.files && order.files.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              📎 {order.files.length} file{order.files.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Mobile Action Buttons - Large and Touch-Friendly */}
        <div className="space-y-3">
          {/* Primary Action Button */}
          <Button
            onClick={() => setLocation(`/order-confirmation/${order.id}`)}
            className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-medium py-3 text-base"
            size="lg"
          >
            <Eye className="h-5 w-5 mr-2" />
            View Order Details
          </Button>

          {/* Secondary Actions - Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onChatOpen}
              className="flex-1 py-3 text-sm font-medium border-2"
              size="lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
              {order.unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {order.unreadMessages}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`tel:${order.shop.phone || ''}`)}
              className="flex-1 py-3 text-sm font-medium border-2"
              size="lg"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Shop
            </Button>
          </div>

          {/* Additional Quick Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>View location in order details</span>
            </div>
            <div className="text-xs text-gray-500">
              Order #{order.id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}