import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CustomerDashboard from "@/pages/customer-dashboard";
import ShopDashboard from "@/pages/shop-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/shop-dashboard" component={ShopDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
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
