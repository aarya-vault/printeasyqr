import React, { useState } from 'react';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { validatePhoneNumber } from '@/lib/validation';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface PhoneLoginProps {
  onShopLogin?: () => void;
  onShopApplication?: () => void;
}

export function PhoneLogin({ onShopLogin, onShopApplication }: PhoneLoginProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ phone });
      toast({
        title: "Welcome to PrintEasy!",
        description: "You have been successfully logged in.",
      });
      
      // Automatically navigate to customer dashboard after successful login
      if (user.role === 'customer') {
        navigate('/customer-dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-rich-black mb-2">Get Started Now</h2>
        <p className="text-medium-gray">Enter your phone number to begin your printing journey</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="w-5 h-5 text-medium-gray" />
            <span className="ml-2 text-medium-gray">+91</span>
          </div>
          <Input
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={phone}
            onChange={handlePhoneChange}
            className="pl-16 pr-4 py-3 h-12 focus:ring-2 focus:ring-brand-yellow"
            maxLength={10}
            disabled={isLoading}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400 h-12 font-semibold"
          disabled={isLoading || !phone}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Start Printing</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
      
      <div className="text-center mt-6">
        <div className="flex items-center justify-center mb-3">
          <ShieldCheck className="w-4 h-4 text-success-green mr-1" />
          <span className="text-sm text-medium-gray">Apply for Shop Partnership</span>
        </div>
        <p className="text-sm text-medium-gray">
          Already a Shop Owner?{' '}
          <button 
            onClick={onShopLogin}
            className="text-brand-yellow hover:underline font-medium"
          >
            Login Here
          </button>
        </p>
      </div>
    </div>
  );
}
