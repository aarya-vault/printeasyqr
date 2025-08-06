import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Package, TrendingUp, Clock, 
  DollarSign, Star, ArrowUp, ArrowDown, 
  Calendar, UserCheck, Repeat, Eye,
  BarChart3, PieChart, Activity, CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ShopAnalytics {
  shop: {
    id: number;
    name: string;
    city: string;
    state: string;
    rating: number;
    totalOrders: number;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    uniqueCustomers: number;
    completionRate: number;
    repeatCustomerRate: number;
    avgOrderValue: number;
    avgCompletionTime: string;
  };
  orderStats: {
    new: number;
    processing: number;
    ready: number;
    completed: number;
    cancelled: number;
    lastWeek: number;
    lastMonth: number;
  };
  customerStats: {
    total: number;
    active30Days: number;
    active7Days: number;
    repeatCustomers: number;
    repeatRate: number;
  };
  performance: {
    urgentOrders: number;
    walkinOrders: number;
    digitalOrders: number;
    avgCompletionTime: number;
    completionRate: number;
  };
  growth: {
    monthlyOrderGrowth: number;
    trending: 'up' | 'down' | 'stable';
  };
  repeatCustomers: Array<{
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    order_count: number;
    total_spent: number;
    last_order_date: string;
    loyaltyLevel: 'VIP' | 'Regular' | 'New';
  }>;
}

export default function ShopOwnerAnalytics() {
  const { user } = useAuth();
  
  // Get current shop for this user
  const { data: userShops, isLoading: shopsLoading } = useQuery({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id && user?.role === 'shop_owner'
  });

  const currentShop = Array.isArray(userShops) && userShops.length > 0 ? userShops[0] : null;

  // Get shop analytics
  const { data: analytics, isLoading: analyticsLoading, error } = useQuery<ShopAnalytics>({
    queryKey: [`/api/shop-owner/shop/${currentShop?.id}/analytics`],
    enabled: !!currentShop?.id,
    retry: 3,
    retryDelay: 1000
  });

  const isLoading = shopsLoading || analyticsLoading;

  // Get customer insights
  const { data: customerInsights, isLoading: insightsLoading } = useQuery({
    queryKey: [`/api/shop-owner/shop/${currentShop?.id}/customer-insights`],
    enabled: !!currentShop?.id
  });

  // Enhanced loading state with better UX
  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg font-semibold text-rich-black mb-2">Loading Analytics</p>
          <p className="text-gray-600 text-sm">
            {!currentShop ? 'Finding your shop...' : 'Processing business metrics...'}
          </p>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• Calculating order statistics</p>
            <p>• Analyzing customer data</p>
            <p>• Preparing performance insights</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🔍 ANALYTICS - Frontend error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Analytics Temporarily Unavailable</p>
          <p className="text-gray-600 text-sm mb-4">Your shop analytics are currently being processed. This is normal for:</p>
          <ul className="text-xs text-gray-500 text-left mb-4 space-y-1">
            <li>• New shops setting up analytics</li>
            <li>• System updates and maintenance</li>
            <li>• High traffic periods</li>
          </ul>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string, growth: number) => {
    if (trend === 'up' || growth > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down' || growth < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend: string, growth: number) => {
    if (trend === 'up' || growth > 0) return 'text-green-600';
    if (trend === 'down' || growth < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-rich-black">Shop Analytics</h1>
          <p className="text-medium-gray mt-1">
            Comprehensive performance insights for {analytics.shop.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {analytics.shop.city}, {analytics.shop.state}
            </Badge>
            <Badge variant="secondary" className="bg-brand-yellow/10 text-rich-black">
              {analytics.summary.totalOrders} Total Orders
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-rich-black">
              ₹{analytics.summary.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-medium-gray">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-brand-yellow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-medium-gray mb-1">Unique Customers</p>
                <p className="text-3xl font-bold text-rich-black">
                  {analytics.summary.uniqueCustomers}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-success-green">
                    {analytics.customerStats.active7Days} active this week
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-brand-yellow opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-medium-gray mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-rich-black">
                  {analytics.summary.completionRate}%
                </p>
                <p className="text-xs text-medium-gray mt-1">
                  {analytics.orderStats.completed} completed orders
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-medium-gray mb-1">Repeat Customers</p>
                <p className="text-3xl font-bold text-rich-black">
                  {analytics.summary.repeatCustomerRate}%
                </p>
                <p className="text-xs text-medium-gray mt-1">
                  {analytics.customerStats.repeatCustomers} loyal customers
                </p>
              </div>
              <Repeat className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-medium-gray mb-1">Avg Order Value</p>
                <p className="text-3xl font-bold text-rich-black">
                  ₹{Math.round(analytics.summary.avgOrderValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(analytics.growth.trending, analytics.growth.monthlyOrderGrowth)}
                  <span className={`text-xs ${getTrendColor(analytics.growth.trending, analytics.growth.monthlyOrderGrowth)}`}>
                    {Math.abs(analytics.growth.monthlyOrderGrowth)}% this month
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-yellow" />
              Order Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                <p className="text-2xl font-bold text-brand-yellow">{analytics.orderStats.new}</p>
                <p className="text-sm text-medium-gray">New Orders</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <p className="text-2xl font-bold text-blue-600">{analytics.orderStats.processing}</p>
                <p className="text-sm text-medium-gray">Processing</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <p className="text-2xl font-bold text-green-600">{analytics.orderStats.ready}</p>
                <p className="text-sm text-medium-gray">Ready</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border">
                <p className="text-2xl font-bold text-gray-600">{analytics.orderStats.completed}</p>
                <p className="text-sm text-medium-gray">Completed</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-medium-gray">Last 7 days</span>
                <Badge variant="outline">{analytics.orderStats.lastWeek} orders</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-medium-gray">Last 30 days</span>
                <Badge variant="outline">{analytics.orderStats.lastMonth} orders</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-yellow" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-medium-gray">Average Completion Time</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-brand-yellow" />
                  <span className="font-medium">{analytics.summary.avgCompletionTime} hours</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-medium-gray">Walk-in Orders</span>
                <Badge variant="secondary">{analytics.performance.walkinOrders}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-medium-gray">Digital Orders</span>
                <Badge variant="secondary">{analytics.performance.digitalOrders}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-medium-gray">Urgent Orders</span>
                <Badge variant="destructive" className="bg-red-100 text-red-700">
                  {analytics.performance.urgentOrders}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="bg-brand-yellow/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-brand-yellow" />
                <span className="font-medium text-rich-black">Monthly Growth</span>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(analytics.growth.trending, analytics.growth.monthlyOrderGrowth)}
                <span className={`text-lg font-bold ${getTrendColor(analytics.growth.trending, analytics.growth.monthlyOrderGrowth)}`}>
                  {analytics.growth.monthlyOrderGrowth > 0 ? '+' : ''}{analytics.growth.monthlyOrderGrowth}%
                </span>
                <span className="text-sm text-medium-gray ml-1">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-yellow" />
            Loyal Customers ({analytics.repeatCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.repeatCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-medium-gray">No repeat customers yet</p>
              <p className="text-sm text-medium-gray">Focus on great service to build loyalty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.repeatCustomers.slice(0, 10).map((customer) => (
                <div key={customer.customer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-rich-black">
                        {customer.customer_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-rich-black">{customer.customer_name}</p>
                      <p className="text-sm text-medium-gray">{customer.customer_phone}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={customer.loyaltyLevel === 'VIP' ? 'default' : 'secondary'}>
                        {customer.loyaltyLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-medium-gray mt-1">
                      {customer.order_count} orders • ₹{Math.round(customer.total_spent)}
                    </p>
                    <p className="text-xs text-medium-gray">
                      Last order: {format(parseISO(customer.last_order_date), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}