import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import NotFound from "@/pages/not-found";
import NewHomepage from "@/pages/new-homepage";
import UnifiedCustomerDashboard from "@/pages/unified-customer-dashboard";
import CustomerNotifications from "@/pages/customer-notifications";
import CustomerAccountSettings from "@/pages/customer-account-settings";
import CustomerAccount from "@/pages/customer-account";
import CustomerOrders from "@/pages/customer-orders";
import CustomerVisitedShops from "@/pages/customer-visited-shops";
import BrowseShops from "@/pages/browse-shops";
import RedesignedShopOwnerDashboard from "@/pages/redesigned-shop-owner-dashboard";
import ShopOrderHistory from "@/pages/shop-order-history";
import ShopOrderDetails from "@/pages/shop-order-details";

import RedesignedShopSettings from "@/pages/redesigned-shop-settings";
import EnhancedAdminDashboard from "@/pages/enhanced-admin-dashboard";
import { AdminLogin } from "@/components/auth/admin-login";
import SimpleShopApplication from "@/components/simple-shop-application";
import ShopOrder from "@/pages/shop-order";
import OrderConfirmation from "@/pages/order-confirmation";
import ShopNotifications from "@/pages/shop-notifications";
import ShopLoginPage from "@/pages/shop-login";


function Router() {
  return (
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
