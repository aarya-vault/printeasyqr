import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/professional-layout';
import { ProfessionalLoading, ButtonLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  ArrowRight,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Phone Authentication Component
export const PhoneLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    try {
      await login({ phone });
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully."
      });
      setLocation('/customer/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your phone number and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Customer Login">
      <form onSubmit={handlePhoneLogin} className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-lg mb-4">
            <Phone className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-gray-600">
            Enter your phone number to access your account or create a new one.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-black font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="input-professional mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to identify your account and orders.
            </p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="btn-primary w-full"
          disabled={isLoading || phone.length !== 10}
        >
          {isLoading ? (
            <ButtonLoading message="Signing in..." />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            New to PrintEasy? Your account will be created automatically.
          </p>
        </div>

        <Separator className="my-6" />

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Are you a shop owner or admin?
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setLocation('/auth/shop-owner')}
              className="btn-outline"
            >
              Shop Owner Login
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => setLocation('/auth/admin')}
              className="btn-outline"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

// Shop Owner Email Login
export const ShopOwnerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleShopOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      await login({ email, password, role: 'shop_owner' });
      toast({
        title: "Welcome back!",
        description: "Access your shop dashboard to manage orders."
      });
      setLocation('/shop/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your email and password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Shop Owner Login">
      <form onSubmit={handleShopOwnerLogin} className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-lg mb-4">
            <User className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-gray-600">
            Access your shop dashboard to manage orders and settings.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-black font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your shop email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-professional mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-black font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-professional mt-1"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="btn-primary w-full"
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading ? (
            <ButtonLoading message="Signing in..." />
          ) : (
            <>
              Sign In to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have a shop account?{' '}
            <button
              type="button"
              onClick={() => setLocation('/apply-shop')}
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Apply for your shop
            </button>
          </p>
        </div>

        <Separator className="my-6" />

        <div className="text-center">
          <Button 
            type="button"
            variant="outline"
            onClick={() => setLocation('/auth/phone')}
            className="btn-outline"
          >
            Customer Login
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

// Admin Login Component
export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      await login({ email, password, role: 'admin' });
      toast({
        title: "Admin access granted",
        description: "Welcome to the PrintEasy admin dashboard."
      });
      setLocation('/admin/dashboard');
    } catch (error) {
      toast({
        title: "Access denied",
        description: "Invalid admin credentials.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Admin Login">
      <form onSubmit={handleAdminLogin} className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-lg mb-4">
            <Shield className="h-6 w-6 text-yellow-600" />
          </div>
          <Badge variant="outline" className="mb-4 border-yellow-200 text-yellow-700">
            Admin Access Required
          </Badge>
          <p className="text-gray-600">
            Secure login for platform administrators only.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-email" className="text-black font-medium">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@printeasy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-professional mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="admin-password" className="text-black font-medium">
              Admin Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-professional mt-1"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="btn-primary w-full"
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading ? (
            <ButtonLoading message="Verifying access..." />
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Access Admin Dashboard
            </>
          )}
        </Button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Admin Credentials
            </span>
          </div>
          <p className="text-xs text-yellow-700">
            Default: admin@printeasy.com / admin123
          </p>
        </div>

        <Separator className="my-6" />

        <div className="text-center">
          <Button 
            type="button"
            variant="outline"
            onClick={() => setLocation('/auth/phone')}
            className="btn-outline mr-2"
          >
            Customer Login
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={() => setLocation('/auth/shop-owner')}
            className="btn-outline"
          >
            Shop Owner Login
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

// Name Collection Modal (for new customers)
export const NameCollectionModal: React.FC<{
  isOpen: boolean;
  onClose: (name?: string) => void;
  phone: string;
}> = ({ isOpen, onClose, phone }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onClose(name.trim() || undefined);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="card-professional max-w-md w-full">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-50 rounded-lg mb-4 mx-auto">
            <User className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-bold text-black">
            Welcome to PrintEasy!
          </CardTitle>
          <CardDescription>
            We've created your account with {phone}. Please provide your name to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customer-name" className="text-black font-medium">
                Your Name (Optional)
              </Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-professional mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps shops provide personalized service.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                className="btn-outline flex-1"
                disabled={isLoading}
              >
                Skip for Now
              </Button>
              <Button 
                type="submit" 
                className="btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ButtonLoading message="Saving..." />
                ) : (
                  <>
                    Continue
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};