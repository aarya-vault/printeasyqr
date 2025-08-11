// Custom hook for OTP-integrated order placement
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface OrderFormData {
  shopId: number;
  type: 'upload' | 'walkin';
  title?: string;
  description?: string;
  specifications?: any;
  isUrgent?: boolean;
  estimatedPages?: number;
  estimatedBudget?: number;
}

interface UseOTPOrderResult {
  isLoading: boolean;
  otpRequired: boolean;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  showOTPModal: boolean;
  setShowOTPModal: (show: boolean) => void;
  initiateOrderWithOTP: (orderData: OrderFormData, files?: File[]) => Promise<void>;
  handleOTPSuccess: (userData: any) => Promise<void>;
  pendingOrderData: { orderData: OrderFormData; files?: File[] } | null;
}

export function useOTPOrder(): UseOTPOrderResult {
  const { user, sendWhatsAppOTP, verifyWhatsAppOTP, getPersistentUserData } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<{ orderData: OrderFormData; files?: File[] } | null>(null);

  // Auto-fill phone from persistent data or current user
  const getPhoneNumber = (): string => {
    if (phoneNumber) return phoneNumber;
    if (user?.phone) return user.phone;
    const persistentData = getPersistentUserData();
    return persistentData?.phone || '';
  };

  const submitOrder = async (orderData: OrderFormData, files?: File[]) => {
    try {
      const formData = new FormData();
      
      // Add order data
      formData.append('shopId', orderData.shopId.toString());
      formData.append('orderType', orderData.type);
      formData.append('instructions', JSON.stringify({
        title: orderData.title,
        description: orderData.description,
        specifications: orderData.specifications,
        isUrgent: orderData.isUrgent,
        estimatedPages: orderData.estimatedPages,
        estimatedBudget: orderData.estimatedBudget
      }));

      // Add files if present
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const result = await response.json();
      
      toast({
        title: "Order placed successfully!",
        description: `Order #${result.orderNumber} created. You'll receive updates soon.`,
      });

      return result;

    } catch (error: any) {
      console.error('Order submission error:', error);
      throw error;
    }
  };

  const initiateOrderWithOTP = async (orderData: OrderFormData, files?: File[]) => {
    const phone = getPhoneNumber();
    
    if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store pending order data
      setPendingOrderData({ orderData, files });
      
      // Check if OTP is needed
      const otpResult = await sendWhatsAppOTP(phone);
      
      if (otpResult.skipOTP && otpResult.user) {
        // User already authenticated, submit order directly
        await submitOrder(orderData, files);
        setPendingOrderData(null);
      } else {
        // Show OTP modal
        setOtpRequired(true);
        setShowOTPModal(true);
        setPhoneNumber(phone);
      }
      
    } catch (error: any) {
      console.error('Initiate order error:', error);
      toast({
        title: "Failed to start order process",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setPendingOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async (userData: any) => {
    if (!pendingOrderData) {
      toast({
        title: "No pending order found",
        variant: "destructive",
      });
      return;
    }

    try {
      setShowOTPModal(false);
      setIsLoading(true);
      
      // Submit the pending order
      await submitOrder(pendingOrderData.orderData, pendingOrderData.files);
      
      // Clean up
      setPendingOrderData(null);
      setOtpRequired(false);
      
    } catch (error: any) {
      console.error('Order submission after OTP error:', error);
      toast({
        title: "Failed to place order",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    otpRequired,
    phoneNumber: getPhoneNumber(),
    setPhoneNumber,
    showOTPModal,
    setShowOTPModal,
    initiateOrderWithOTP,
    handleOTPSuccess,
    pendingOrderData
  };
}