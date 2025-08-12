import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationModalProps {
  isOpen: boolean;
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void>;
  onClose: () => void;
  onResend: () => Promise<void>;
}

export function OTPVerificationModal({ 
  isOpen, 
  phoneNumber, 
  onVerify, 
  onClose, 
  onResend 
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Countdown timer for resend functionality
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setCountdown(60);
      setCanResend(false);
      setIsVerifying(false);
      setIsResending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otp);
      toast({
        title: "Verification Successful!",
        description: "Welcome to PrintEasy",
      });
    } catch (error) {
      console.error('OTP Verification Error:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setOtp(''); // Clear OTP on failure
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    try {
      await onResend();
      setCountdown(60);
      setCanResend(false);
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your WhatsApp",
      });
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-rich-black">Verify WhatsApp OTP</CardTitle>
          <p className="text-medium-gray">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-rich-black">
            {formatPhoneNumber(phoneNumber)}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-rich-black">Enter OTP</label>
            <Input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setOtp(value);
                }
              }}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>

          <Button 
            onClick={handleVerify}
            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500 font-semibold py-3"
            disabled={otp.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verify OTP
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-medium-gray">
              Didn't receive the code?
            </p>
            
            {canResend ? (
              <Button
                variant="link"
                onClick={handleResend}
                disabled={isResending}
                className="text-brand-yellow hover:text-yellow-600 p-0 h-auto"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center text-sm text-medium-gray">
                <Clock className="w-4 h-4 mr-1" />
                Resend in {countdown}s
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}