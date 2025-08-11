import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Phone } from 'lucide-react';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (userData: any) => void;
  phoneNumber: string;
  isLoading?: boolean;
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  onVerificationSuccess,
  phoneNumber,
  isLoading = false
}: OTPVerificationModalProps) {
  const [otp, setOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (isOpen && phoneNumber && !otpSent) {
      handleSendOTP();
    }
  }, [isOpen, phoneNumber]);

  const handleSendOTP = async () => {
    if (!phoneNumber) return;

    setIsSendingOTP(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.skipOTP) {
          // User already authenticated, skip OTP
          onVerificationSuccess(result.user);
          toast({
            title: "Welcome back!",
            description: "You're already logged in.",
          });
          return;
        }

        setOtpSent(true);
        setCountdown(60); // 60 seconds cooldown
        toast({
          title: "OTP Sent",
          description: `WhatsApp OTP sent to ${formatPhoneNumber(phoneNumber)}`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          otp: otp 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store JWT token
        localStorage.setItem('authToken', result.token);
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }

        onVerificationSuccess(result.user);
        toast({
          title: "Verification successful!",
          description: "You are now logged in.",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      setOtpSent(false);
      setOTP('');
      handleSendOTP();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{formatPhoneNumber(phoneNumber)}</span>
            </div>
            
            {!otpSent ? (
              <p className="text-sm text-gray-500">
                We'll send you a verification code via WhatsApp
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Enter the 6-digit code sent to your WhatsApp
              </p>
            )}
          </div>

          {otpSent && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setOTP(value);
                    }
                  }}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  disabled={isVerifying}
                />
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={isVerifying || otp.length !== 6}
                className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isSendingOTP}
                  className="text-sm"
                >
                  {countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : isSendingOTP ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              </div>
            </div>
          )}

          {!otpSent && (
            <Button
              onClick={handleSendOTP}
              disabled={isSendingOTP}
              className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send WhatsApp OTP
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}