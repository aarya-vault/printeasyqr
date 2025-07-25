import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Package, Users, Clock, FileText, 
  Calendar, BarChart3, Activity
} from 'lucide-react';

interface ShopAnalyticsViewProps {
  shops: any[];
}

export default function ShopAnalyticsView({ shops }: ShopAnalyticsViewProps) {
  // Fetch orders for all shops
  const { data: shopOrders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/shop-orders'],
    queryFn: async () => {
      const response = await fetch('/api/admin/shop-orders');
      if (!response.ok) throw new Error('Failed to fetch shop orders');
      return response.json();
    }
  });

  const getShopAnalytics = (shopId: number) => {
    const orders = shopOrders.filter((order: any) => order.shopId === shopId);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order: any) => order.status === 'completed').length;
    const pendingOrders = orders.filter((order: any) => order.status === 'new' || order.status === 'processing').length;
    const uploadOrders = orders.filter((order: any) => order.type === 'upload').length;
    const walkinOrders = orders.filter((order: any) => order.type === 'walkin').length;
    
    // Calculate completion rate
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';
    
    // Get recent orders
    const recentOrders = orders
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      uploadOrders,
      walkinOrders,
      completionRate,
      recentOrders
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-rich-black">Shop-wise Analytics</h2>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-rich-black">Shop-wise Analytics</h2>
        <Badge variant="outline" className="text-sm">
          {shops.length} Active Shops
        </Badge>
      </div>

      <div className="space-y-6">
        {shops.map((shop) => {
          const analytics = getShopAnalytics(shop.id);
          
          return (
            <Card key={shop.id} className="border-l-4 border-l-brand-yellow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{shop.name}</CardTitle>
                    <p className="text-sm text-medium-gray mt-1">{shop.city}, {shop.state}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">{shop.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-light-gray rounded-lg">
                    <Package className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold text-rich-black">{analytics.totalOrders}</p>
                    <p className="text-xs text-medium-gray">Total Orders</p>
                  </div>
                  
                  <div className="text-center p-4 bg-light-gray rounded-lg">
                    <Activity className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold text-rich-black">{analytics.completionRate}%</p>
                    <p className="text-xs text-medium-gray">Completion Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-light-gray rounded-lg">
                    <Clock className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold text-rich-black">{analytics.pendingOrders}</p>
                    <p className="text-xs text-medium-gray">Pending</p>
                  </div>
                  
                  <div className="text-center p-4 bg-light-gray rounded-lg">
                    <FileText className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold text-rich-black">{analytics.uploadOrders}</p>
                    <p className="text-xs text-medium-gray">Upload Orders</p>
                  </div>
                  
                  <div className="text-center p-4 bg-light-gray rounded-lg">
                    <Users className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                    <p className="text-2xl font-bold text-rich-black">{analytics.walkinOrders}</p>
                    <p className="text-xs text-medium-gray">Walk-in Orders</p>
                  </div>
                </div>

                {/* Recent Orders */}
                {analytics.recentOrders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-rich-black mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-brand-yellow" />
                      Recent Orders
                    </h4>
                    <div className="space-y-2">
                      {analytics.recentOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-light-gray rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{order.title}</p>
                            <p className="text-xs text-medium-gray">
                              {new Date(order.createdAt).toLocaleDateString()} - {order.type}
                            </p>
                          </div>
                          <Badge 
                            className={
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'processing' ? 'bg-brand-yellow/20 text-rich-black' :
                              order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-brand-yellow" />
                    <div>
                      <p className="text-sm text-medium-gray">Completion Rate</p>
                      <p className="font-semibold">{analytics.completionRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-brand-yellow" />
                    <div>
                      <p className="text-sm text-medium-gray">Order Success</p>
                      <p className="font-semibold">{analytics.completedOrders} completed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-brand-yellow" />
                    <div>
                      <p className="text-sm text-medium-gray">Services</p>
                      <p className="font-semibold">{shop.services?.length || 0} available</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}