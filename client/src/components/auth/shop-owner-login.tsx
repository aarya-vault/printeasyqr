import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Store, ArrowLeft } from 'lucide-react';

export function ShopOwnerLogin({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const user = await login({ email, password });
      
      if (user.role === 'shop_owner') {
        navigate('/shop-dashboard');
      } else {
        throw new Error('Invalid credentials for shop owner login');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-rich-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-rich-black">Shop Owner Login</CardTitle>
          <p className="text-medium-gray">Access your print shop dashboard</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-rich-black">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="owner@digitalprint.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-rich-black">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500 font-semibold py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="text-center text-sm text-medium-gray">
            <p>Demo Credentials:</p>
            <p className="font-mono">owner@digitalprint.com / password</p>
          </div>

          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}