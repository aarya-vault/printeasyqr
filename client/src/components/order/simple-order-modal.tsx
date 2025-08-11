import React, { useState } from 'react';
import { X, Upload, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useOTPOrder } from '@/hooks/use-otp-order';
import { OTPVerificationModal } from '@/components/otp-verification-modal';

interface SimpleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: number;
}

export function SimpleOrderModal({ isOpen, onClose, shopId = 1 }: SimpleOrderModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    orderType: '',
    uploadOrWalkin: '',
    printingDescription: '',
    isUrgent: false,
  });
  
  const { toast } = useToast();
  const { user, getPersistentUserData } = useAuth();
  
  // OTP order integration
  const {
    isLoading,
    phoneNumber,
    setPhoneNumber,
    showOTPModal,
    setShowOTPModal,
    initiateOrderWithOTP,
    handleOTPSuccess,
  } = useOTPOrder();

  // Auto-fill data from user or persistent data
  const persistentData = getPersistentUserData();
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name !== 'Customer' ? user.name : prev.name,
        phoneNumber: user.phone || prev.phoneNumber
      }));
      setPhoneNumber(user.phone || '');
    } else if (persistentData) {
      setFormData(prev => ({
        ...prev,
        name: persistentData.name || prev.name,
        phoneNumber: persistentData.phone || prev.phoneNumber
      }));
      setPhoneNumber(persistentData.phone || '');
    }
  }, [user, persistentData, setPhoneNumber]);

  const handleReset = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      orderType: '',
      uploadOrWalkin: '',
      printingDescription: '',
      isUrgent: false,
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phoneNumber || !/^[6-9][0-9]{9}$/.test(formData.phoneNumber)) {
      toast({
        title: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.orderType) {
      toast({
        title: "Please select an order type",
        variant: "destructive",
      });
      return;
    }

    if (!formData.uploadOrWalkin) {
      toast({
        title: "Please select upload or walk-in",
        variant: "destructive",
      });
      return;
    }

    if (!formData.printingDescription.trim()) {
      toast({
        title: "Please enter printing description",
        variant: "destructive",
      });
      return;
    }

    // Set phone number for OTP
    setPhoneNumber(formData.phoneNumber);

    try {
      const orderData = {
        shopId: shopId,
        type: formData.uploadOrWalkin as 'upload' | 'walkin',
        title: formData.orderType,
        description: formData.printingDescription,
        specifications: {
          customerName: formData.name,
          orderType: formData.orderType,
          uploadOrWalkin: formData.uploadOrWalkin,
          printingDescription: formData.printingDescription,
        },
        isUrgent: formData.isUrgent,
      };

      await initiateOrderWithOTP(orderData);
      
      // Only close if order was placed successfully (no OTP needed)
      if (!showOTPModal) {
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: "Failed to place order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOTPSuccessWrapper = async (userData: any) => {
    await handleOTPSuccess(userData);
    handleClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => !isLoading && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Simple Order Form
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                  }
                }}
                maxLength={10}
              />
              <p className="text-xs text-gray-500">
                WhatsApp OTP will be sent for verification
              </p>
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type *</Label>
              <Select
                value={formData.orderType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, orderType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Document Printing">Document Printing</SelectItem>
                  <SelectItem value="Photo Printing">Photo Printing</SelectItem>
                  <SelectItem value="Business Cards">Business Cards</SelectItem>
                  <SelectItem value="Flyers/Brochures">Flyers/Brochures</SelectItem>
                  <SelectItem value="Binding Service">Binding Service</SelectItem>
                  <SelectItem value="Lamination">Lamination</SelectItem>
                  <SelectItem value="Scanning">Scanning</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload or Walk-in */}
            <div className="space-y-2">
              <Label htmlFor="uploadOrWalkin">Upload or Walk-in *</Label>
              <Select
                value={formData.uploadOrWalkin}
                onValueChange={(value) => setFormData(prev => ({ ...prev, uploadOrWalkin: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload Files (Digital)</SelectItem>
                  <SelectItem value="walkin">Walk-in Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Printing Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Printing Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your printing requirements..."
                value={formData.printingDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, printingDescription: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Urgency Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent"
                checked={formData.isUrgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
              />
              <Label htmlFor="urgent" className="text-sm">
                Is it really urgent?
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
            >
              {isLoading ? "Processing..." : "Submit Order with OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerificationSuccess={handleOTPSuccessWrapper}
        phoneNumber={phoneNumber}
        isLoading={isLoading}
      />
    </>
  );
}