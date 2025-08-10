import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, Store, DollarSign, Eye, Zap, 
  BarChart3, Activity, Clock, MapPin, Calendar
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedAnalytics {
  qrCustomerAcquisition: {
    total_customers_via_qr: number;
    shops_unlocked: number;
    total_qr_orders: number;
  };
  monthlyGrowth: Array<{
    month: string;
    new_customers: number;
    new_shops: number;
    total_users: number;
  }>;
  customerEngagement: {
    customers_acquired_via_qr: number;
    customers_who_ordered: number;
    shops_with_qr_unlocks: number;
    qr_to_order_conversion_rate: number;
  };
  customerUnlocks: {
    total_unlocks: number;
    unique_customers: number;
    shops_unlocked: number;
  };
  qrScans: {
    total_scans: number;
    unique_scanners: number;
    shops_scanned: number;
    conversion_rate: number;
  };
  topPerformingShops: Array<{
    id: number;
    name: string;
    city: string;
    unique_customers_acquired: number;
    customers_converted_to_orders: number;
    conversion_rate: number;
  }>;
}

export function EnhancedAdminAnalytics() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: analytics, isLoading, refetch } = useQuery<EnhancedAnalytics>({
    queryKey: ['/api/analytics/admin/enhanced'],
    refetchInterval: refreshInterval,
    retry: 3,
    retryDelay: 1000
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
          <span className="ml-2 text-medium-gray">Loading enhanced analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-medium-gray">No analytics data available</p>
          <Button onClick={() => refetch()} className="mt-4">Retry Loading</Button>
        </CardContent>
      </Card>
    );
  }

  const qrConversionRate = analytics.customerEngagement.customers_acquired_via_qr > 0 
    ? analytics.customerEngagement.qr_to_order_conversion_rate
    : 0;

  return (
    <div className="space-y-6">
      {/* Real-time Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-rich-black">Enhanced Analytics</h2>
          <div className="flex items-center space-x-2 mt-1">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-medium-gray">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Badge variant="outline" className="text-xs bg-green-50">
              Auto-refresh {refreshInterval/1000}s
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRefreshInterval(refreshInterval === 30000 ? 10000 : 30000)}
          >
            <Clock className="w-4 h-4 mr-1" />
            {refreshInterval === 30000 ? 'Fast Refresh' : 'Normal Refresh'}
          </Button>
          <Button onClick={() => refetch()} size="sm">
            <Activity className="w-4 h-4 mr-1" />
            Refresh Now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="performance">Shop Performance</TabsTrigger>
          <TabsTrigger value="scanning">QR & Unlocks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-medium-gray mb-1">QR Customers Acquired</p>
                    <p className="text-2xl font-bold text-rich-black">
                      {analytics.qrCustomerAcquisition.total_customers_via_qr || '0'}
                    </p>
                    <p className="text-xs text-medium-gray mt-1">
                      {analytics.qrCustomerAcquisition.shops_unlocked} shops unlocked
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-medium-gray mb-1">QR to Order Customers</p>
                    <p className="text-2xl font-bold text-rich-black">
                      {analytics.customerEngagement.customers_who_ordered || '0'}
                    </p>
                    <p className="text-xs text-medium-gray mt-1">Converted from QR scans</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-brand-yellow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-medium-gray mb-1">Shop Unlocks</p>
                    <p className="text-2xl font-bold text-rich-black">
                      {analytics.customerUnlocks.total_unlocks}
                    </p>
                    <p className="text-xs text-medium-gray mt-1">
                      {analytics.customerUnlocks.unique_customers} unique customers
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-brand-yellow opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-medium-gray mb-1">QR to Order Rate</p>
                    <p className="text-2xl font-bold text-rich-black">{qrConversionRate}%</p>
                    <p className="text-xs text-medium-gray mt-1">
                      Customer acquisition efficiency
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-yellow" />
                Monthly Growth Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyGrowth.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-brand-yellow" />
                      <span className="font-medium">
                        {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{month.new_customers}</div>
                        <div className="text-xs text-gray-600">New Customers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{month.new_shops}</div>
                        <div className="text-xs text-gray-600">New Shops</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-rich-black">{month.total_users}</div>
                        <div className="text-xs text-gray-600">Total Users</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Active Customers (30 days)</span>
                  <Badge variant="outline">{analytics.customerEngagement.active_customers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Average Order Value</span>
                  <Badge className="bg-green-100 text-green-800">
                    ₹{analytics.customerEngagement.avg_order_value?.toFixed(0) || '0'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Total Orders (30 days)</span>
                  <Badge variant="outline">{analytics.customerEngagement.total_orders_last_30_days}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Active Shops</span>
                  <Badge className="bg-brand-yellow text-rich-black">
                    {analytics.customerEngagement.shops_with_orders}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800 font-medium">Customer Discovery Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {((analytics.customerUnlocks.unique_customers / analytics.customerEngagement.active_customers) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Customers who discovered shops via QR/search
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-800 font-medium">Shop Visibility</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {((analytics.customerUnlocks.shops_unlocked / analytics.topPerformingShops.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Shops being discovered by customers
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-brand-yellow" />
                Top QR Customer Acquisition Shops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPerformingShops.map((shop, index) => (
                  <div key={shop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-brand-yellow text-rich-black' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-rich-black">{shop.name}</div>
                        <div className="flex items-center gap-2 text-xs text-medium-gray">
                          <MapPin className="w-3 h-3" />
                          {shop.city && shop.city !== 'Unknown' ? shop.city : 'Location N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-rich-black">{shop.unique_customers_acquired}</div>
                      <div className="text-xs text-medium-gray">customers acquired</div>
                      <div className="text-xs text-brand-yellow">{shop.conversion_rate}% conversion</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanning" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="w-12 h-12 text-brand-yellow mx-auto mb-3" />
                <p className="text-2xl font-bold text-rich-black">{analytics.qrScans.total_scans}</p>
                <p className="text-sm text-medium-gray">Total QR Scans</p>
                <p className="text-xs text-medium-gray mt-1">
                  {analytics.qrScans.unique_scanners} unique scanners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-2xl font-bold text-rich-black">{analytics.customerUnlocks.total_unlocks}</p>
                <p className="text-sm text-medium-gray">Successful Unlocks</p>
                <p className="text-xs text-medium-gray mt-1">
                  {analytics.customerUnlocks.shops_unlocked} shops unlocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <p className="text-2xl font-bold text-rich-black">{conversionRate}%</p>
                <p className="text-sm text-medium-gray">Conversion Rate</p>
                <p className="text-xs text-medium-gray mt-1">
                  Scans → Unlocks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* QR Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Scan Distribution</h4>
                  <p className="text-sm text-blue-800">
                    {analytics.qrScans.shops_scanned} out of {analytics.topPerformingShops.length} shops have been scanned
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.qrScans.shops_scanned / analytics.topPerformingShops.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Customer Discovery</h4>
                  <p className="text-sm text-green-800">
                    {analytics.customerUnlocks.unique_customers} customers discovered shops via QR
                  </p>
                  <Badge className="bg-green-100 text-green-800 mt-2">
                    High Engagement
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedAdminAnalytics;