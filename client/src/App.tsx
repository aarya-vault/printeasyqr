import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { DashboardLoading } from "@/components/ui/loading-spinner";

// Lazy load all pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const NewHomepage = lazy(() => import("@/pages/new-homepage"));
const UnifiedCustomerDashboard = lazy(() => import("@/pages/unified-customer-dashboard"));
const CustomerNotifications = lazy(() => import("@/pages/customer-notifications"));
const CustomerAccountSettings = lazy(() => import("@/pages/customer-account-settings"));
const CustomerAccount = lazy(() => import("@/pages/customer-account"));
const CustomerOrders = lazy(() => import("@/pages/customer-orders"));
const CustomerVisitedShops = lazy(() => import("@/pages/customer-visited-shops"));
const BrowseShops = lazy(() => import("@/pages/browse-shops"));
const RedesignedShopOwnerDashboard = lazy(() => import("@/pages/redesigned-shop-owner-dashboard"));
const ShopOrderHistory = lazy(() => import("@/pages/shop-order-history"));
const ShopOrderDetails = lazy(() => import("@/pages/shop-order-details"));
const RedesignedShopSettings = lazy(() => import("@/pages/redesigned-shop-settings"));
const EnhancedAdminDashboard = lazy(() => import("@/pages/enhanced-admin-dashboard"));
const AdminLogin = lazy(() => import("@/components/auth/admin-login").then(m => ({ default: m.AdminLogin })));
const SimpleShopApplication = lazy(() => import("@/components/simple-shop-application"));
const ShopOrder = lazy(() => import("@/pages/shop-order"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const ShopNotifications = lazy(() => import("@/pages/shop-notifications"));
const ShopLoginPage = lazy(() => import("@/pages/shop-login"));


function Router() {
  return (
    <Suspense fallback={<DashboardLoading title="Loading..." subtitle="Please wait while we load the page" />}>
      <Switch>
        <Route path="/" component={NewHomepage} />
        <Route path="/customer-dashboard" component={UnifiedCustomerDashboard} />
        <Route path="/customer-notifications" component={CustomerNotifications} />
        <Route path="/customer-account-settings" component={CustomerAccountSettings} />
        <Route path="/customer-account" component={CustomerAccount} />
        <Route path="/customer-orders" component={CustomerOrders} />
        <Route path="/customer-visited-shops" component={CustomerVisitedShops} />
        <Route path="/browse-shops" component={BrowseShops} />
        <Route path="/shop-dashboard" component={RedesignedShopOwnerDashboard} />
        <Route path="/shop-order-history" component={ShopOrderHistory} />

        <Route path="/shop-dashboard/orders/:orderId" component={ShopOrderDetails} />
        <Route path="/shop-settings" component={RedesignedShopSettings} />
        <Route path="/admin-dashboard" component={EnhancedAdminDashboard} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/shop-login" component={ShopLoginPage} />
        <Route path="/apply-shop" component={SimpleShopApplication} />
        <Route path="/shop/:slug" component={ShopOrder} />
        <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
        <Route path="/shop-notifications" component={ShopNotifications} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
