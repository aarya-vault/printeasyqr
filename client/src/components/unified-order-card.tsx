import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  FileText, 
  Clock, 
  CheckCircle,
  Package,
  Star,
  PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: number;
  customerId: number;
  shopId: number;
  type: string;
  title: string;
  description?: string;
  specifications?: any;
  files?: any;
  status: string;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: number;
    name: string;
    phone: string;
    city: string;
  };
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  customerName?: string;
  shopName?: string;
  unreadCount?: number;
}

interface UnifiedOrderCardProps {
  order: Order;
  userRole: 'customer' | 'shop_owner';
  onChatClick: (orderId: number) => void;
  onCallClick?: (phone: string) => void;
  onViewDetails?: (order: Order) => void;
  onStatusUpdate?: (orderId: number, status: string) => void;
  showActions?: boolean;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'new':
      return {
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        icon: PlayCircle,
        label: 'New'
      };
    case 'processing':
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        icon: Package,
        label: 'Processing'
      };
    case 'ready':
      return {
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        icon: CheckCircle,
        label: 'Ready'
      };
    case 'completed':
      return {
        color: 'bg-gray-500',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
        icon: Star,
        label: 'Completed'
      };
    default:
      return {
        color: 'bg-gray-400',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
        icon: Clock,
        label: 'Unknown'
      };
  }
};

const parseFiles = (files: any) => {
  if (!files) return [];
  if (typeof files === 'string') {
    try {
      const parsed = JSON.parse(files);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(files) ? files : [];
};

export default function UnifiedOrderCard({ 
  order, 
  userRole, 
  onChatClick, 
  onCallClick, 
  onViewDetails, 
  onStatusUpdate,
  showActions = true 
}: UnifiedOrderCardProps) {
  const statusInfo = getStatusInfo(order.status);
  const files = parseFiles(order.files);
  const StatusIcon = statusInfo.icon;

  const displayName = userRole === 'customer' 
    ? order.shop?.name || order.shopName || 'Unknown Shop'
    : order.customer?.name || order.customerName || 'Customer';

  const displayPhone = userRole === 'customer' 
    ? order.shop?.phone 
    : order.customer?.phone;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                Order #{order.id}
              </h3>
              {order.isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{order.title}</p>
            <p className="text-xs text-gray-500">{displayName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {order.unreadCount && order.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                {order.unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Type: {order.type === 'upload' ? 'File Upload' : 'Walk-in'}</span>
            <span>{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</span>
          </div>
          
          {files.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <FileText className="w-3 h-3" />
              <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {order.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{order.description}</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChatClick(order.id)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
              {order.unreadCount && order.unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs min-w-[16px] h-4">
                  {order.unreadCount}
                </Badge>
              )}
            </Button>

            {displayPhone && onCallClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCallClick(displayPhone)}
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}

            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(order)}
              >
                View
              </Button>
            )}
          </div>
        )}

        {/* Shop Owner Status Actions */}
        {userRole === 'shop_owner' && onStatusUpdate && order.status !== 'completed' && (
          <div className="mt-3 pt-3 border-t flex gap-2">
            {order.status === 'new' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(order.id, 'processing')}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              >
                Start Processing
              </Button>
            )}
            {order.status === 'processing' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(order.id, 'ready')}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(order.id, 'completed')}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Mark Completed
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}