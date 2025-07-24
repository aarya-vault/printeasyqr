import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import NotFound from "@/pages/not-found";
import ResponsiveHome from "@/pages/responsive-home";
import ImprovedCustomerDashboard from "@/pages/improved-customer-dashboard";
import EnhancedShopDashboard from "@/pages/enhanced-shop-dashboard";
import EnhancedAdminDashboard from "@/pages/enhanced-admin-dashboard";
import { AdminLogin } from "@/components/auth/admin-login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ResponsiveHome} />
      <Route path="/customer-dashboard" component={ImprovedCustomerDashboard} />
      <Route path="/shop-dashboard" component={EnhancedShopDashboard} />
      <Route path="/admin-dashboard" component={EnhancedAdminDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
