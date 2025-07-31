import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Lock, ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';
import { Navbar } from '@/components/layout/navbar';

export default function ShopLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect if already authenticated as shop owner
  useEffect(() => {
    if (user?.role === 'shop_owner') {
      navigate('/shop-dashboard');
    } else if (user?.role === 'customer') {
      navigate('/customer-dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({ email: email.toLowerCase().trim(), password });
      
      if (user.role !== 'shop_owner') {
        setError('This account is not registered as a shop owner');
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back to your shop dashboard!",
      });

      navigate('/shop-dashboard');
    } catch (error: any) {
      console.error('Shop login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <PrintEasyLogoNav className="justify-center mb-6" size="lg" />
            <h2 className="text-3xl font-bold text-rich-black">Shop Owner Login</h2>
            <p className="mt-2 text-gray-600">
              Access your shop dashboard to manage orders and customers
            </p>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-brand-yellow text-center py-6">
              <CardTitle className="text-rich-black flex items-center justify-center gap-2">
                <Building2 className="w-6 h-6" />
                Shop Owner Access
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Shop Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-shop@example.com"
                      className="pl-10 h-12 text-base"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 text-base"
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    'Access Shop Dashboard'
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Shop Credentials:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Email:</strong> quickprint@example.com</div>
                  <div><strong>Password:</strong> password123</div>
                </div>
              </div>

              {/* Links */}
              <div className="mt-8 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have a shop account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-brand-yellow hover:text-brand-yellow/80 font-medium"
                      onClick={() => navigate('/apply-shop')}
                    >
                      Register Your Shop
                    </Button>
                  </p>
                </div>
                
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Homepage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}