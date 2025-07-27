import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import NotFound from "@/pages/not-found";
import NewHomepage from "@/pages/new-homepage";
import RefinedCustomerDashboard from "@/pages/refined-customer-dashboard";
import CustomerNotifications from "@/pages/customer-notifications";
import CustomerAccountSettings from "@/pages/customer-account-settings";
import CustomerOrders from "@/pages/customer-orders";
import CustomerVisitedShops from "@/pages/customer-visited-shops";
import BeautifulShopDashboard from "@/pages/beautiful-shop-dashboard";
import ShopOrderHistory from "@/pages/shop-order-history";
import ShopOrderDetails from "@/pages/shop-order-details";
import ShopChatSystem from "@/pages/shop-chat-system";
import ComprehensiveShopSettings from "@/components/comprehensive-shop-settings";
import EnhancedAdminDashboard from "@/pages/enhanced-admin-dashboard";
import { AdminLogin } from "@/components/auth/admin-login";
import SimpleShopApplication from "@/components/simple-shop-application";
import ShopOrder from "@/pages/shop-order";
import OrderConfirmation from "@/pages/order-confirmation";
import ShopNotifications from "@/pages/shop-notifications";
import EnhancedShopOrderHistory from "./pages/enhanced-shop-order-history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={NewHomepage} />
      <Route path="/customer-dashboard" component={RefinedCustomerDashboard} />
      <Route path="/customer-notifications" component={CustomerNotifications} />
      <Route path="/customer-account-settings" component={CustomerAccountSettings} />
      <Route path="/customer-orders" component={CustomerOrders} />
      <Route path="/customer-visited-shops" component={CustomerVisitedShops} />
      <Route path="/shop-dashboard" component={BeautifulShopDashboard} />
      <Route path="/shop-order-history" component={ShopOrderHistory} />
      <Route path="/shop-dashboard/chat/:orderId" component={ShopChatSystem} />
      <Route path="/shop-dashboard/orders/:orderId" component={ShopOrderDetails} />
      <Route path="/shop-settings" component={ComprehensiveShopSettings} />
      <Route path="/admin-dashboard" component={EnhancedAdminDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/apply-shop" component={SimpleShopApplication} />
      <Route path="/shop/:slug" component={ShopOrder} />
      <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
      <Route path="/shop-notifications" component={ShopNotifications} />
      <Route path="/enhanced-shop-order-history" component={EnhancedShopOrderHistory} />
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
