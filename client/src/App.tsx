import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import NotFound from "@/pages/not-found";
import ProfessionalHome from "@/pages/professional-home";
// Professional Pages
import ProfessionalCustomerDashboard from "@/pages/professional-customer-dashboard";
import ProfessionalShopDashboard from "@/pages/professional-shop-dashboard";
import ProfessionalAdminDashboard from "@/pages/professional-admin-dashboard";

// Legacy pages - gradually being replaced
import CustomerNotifications from "@/pages/customer-notifications";
import CustomerAccountSettings from "@/pages/customer-account-settings";
import CustomerOrders from "@/pages/customer-orders";
import CustomerVisitedShops from "@/pages/customer-visited-shops";
import ShopOrderHistory from "@/pages/shop-order-history";
import ShopOrderDetails from "@/pages/shop-order-details";
import ShopChatSystem from "@/pages/shop-chat-system";
import ComprehensiveShopSettings from "@/components/comprehensive-shop-settings";
// Professional Auth Components
import { PhoneLogin, ShopOwnerLogin, AdminLogin } from "@/components/professional-auth";
// Professional Shop Application
import ProfessionalShopApplication from "@/pages/professional-shop-application";
import ShopOrder from "@/pages/shop-order";
import OrderConfirmation from "@/pages/order-confirmation";
import ShopNotifications from "@/pages/shop-notifications";


function Router() {
  return (
    <Switch>
      <Route path="/" component={ProfessionalHome} />
      {/* Professional Dashboard Routes */}
      <Route path="/customer-dashboard" component={ProfessionalCustomerDashboard} />
      <Route path="/customer/dashboard" component={ProfessionalCustomerDashboard} />
      <Route path="/shop-dashboard" component={ProfessionalShopDashboard} />
      <Route path="/shop/dashboard" component={ProfessionalShopDashboard} />
      <Route path="/admin-dashboard" component={ProfessionalAdminDashboard} />
      <Route path="/admin/dashboard" component={ProfessionalAdminDashboard} />
      
      {/* Legacy Routes - Gradually being replaced */}
      <Route path="/customer-notifications" component={CustomerNotifications} />
      <Route path="/customer/notifications" component={CustomerNotifications} />
      <Route path="/customer-account-settings" component={CustomerAccountSettings} />
      <Route path="/customer/settings" component={CustomerAccountSettings} />
      <Route path="/customer-orders" component={CustomerOrders} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer-visited-shops" component={CustomerVisitedShops} />
      <Route path="/shop-order-history" component={ShopOrderHistory} />
      <Route path="/shop/orders" component={ShopOrderHistory} />
      <Route path="/shop-dashboard/chat/:orderId" component={ShopChatSystem} />
      <Route path="/shop/chat/:orderId" component={ShopChatSystem} />
      <Route path="/shop-dashboard/orders/:orderId" component={ShopOrderDetails} />
      <Route path="/shop/order/:orderId" component={ShopOrderDetails} />
      <Route path="/shop-settings" component={ComprehensiveShopSettings} />
      <Route path="/shop/settings" component={ComprehensiveShopSettings} />
      {/* Authentication Routes */}
      <Route path="/auth/phone" component={PhoneLogin} />
      <Route path="/auth/customer" component={PhoneLogin} />
      <Route path="/auth/shop-owner" component={ShopOwnerLogin} />
      <Route path="/auth/admin" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/apply-shop" component={ProfessionalShopApplication} />
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
