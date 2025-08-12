import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface OrderData {
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: string;
  files?: File[];
  walkinTime?: string;
  isUrgent?: boolean;
}

interface OTPOrderState {
  step: 'phone' | 'otp' | 'name' | 'uploading' | 'complete';
  phoneNumber: string;
  isLoading: boolean;
  showOTPModal: boolean;
  showNameModal: boolean;
  tempUser: any;
  orderData: OrderData | null;
}

export function useOTPOrder() {
  const { user, sendWhatsAppOTP, verifyWhatsAppOTP, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState<OTPOrderState>({
    step: 'phone',
    phoneNumber: '',
    isLoading: false,
    showOTPModal: false,
    showNameModal: false,
    tempUser: null,
    orderData: null,
  });

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderData) => {
      const formData = new FormData();
      
      // Add order fields
      formData.append('shopId', orderData.shopId.toString());
      formData.append('type', orderData.type);
      formData.append('title', orderData.title);
      if (orderData.description) formData.append('description', orderData.description);
      if (orderData.specifications) formData.append('specifications', orderData.specifications);
      if (orderData.walkinTime) formData.append('walkinTime', orderData.walkinTime);
      if (orderData.isUrgent) formData.append('isUrgent', orderData.isUrgent.toString());

      // Add files
      if (orderData.files && orderData.files.length > 0) {
        orderData.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Order Created Successfully!",
        description: `Your order #${data.orderNumber} has been submitted`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer'] });
      
      setState(prev => ({ ...prev, step: 'complete', isLoading: false }));
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast({
        title: "Order Creation Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
    },
  });

  const startOTPOrderFlow = async (phoneNumber: string, orderData: OrderData) => {
    setState(prev => ({
      ...prev,
      phoneNumber,
      orderData,
      isLoading: true,
    }));

    try {
      console.log('🔍 OTP Order: Starting smart authentication for', phoneNumber);
      
      // Step 1: Check for existing valid token
      const result = await sendWhatsAppOTP(phoneNumber);
      
      if (result.skipOTP) {
        // User already authenticated, check if name update needed
        console.log('✅ OTP Order: Valid token found, proceeding with order');
        
        if (result.user && result.user.needsNameUpdate) {
          setState(prev => ({
            ...prev,
            step: 'name',
            tempUser: result.user,
            showNameModal: true,
            isLoading: false,
          }));
        } else {
          // User fully authenticated, create order directly
          setState(prev => ({ ...prev, step: 'uploading', isLoading: false }));
          await createOrderMutation.mutateAsync(orderData);
        }
      } else {
        // No valid token, request OTP verification
        console.log('🔍 OTP Order: No valid token, requesting OTP');
        setState(prev => ({
          ...prev,
          step: 'otp',
          showOTPModal: true,
          isLoading: false,
        }));
        
        toast({
          title: "OTP Sent",
          description: "Please check your WhatsApp for the verification code",
        });
      }
    } catch (error) {
      console.error('OTP Order Error:', error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const verifyOTPAndOrder = async (otp: string) => {
    try {
      console.log('🔍 OTP Order: Verifying OTP for', state.phoneNumber);
      const user = await verifyWhatsAppOTP(state.phoneNumber, otp);
      
      setState(prev => ({ ...prev, showOTPModal: false }));
      
      if (user.needsNameUpdate) {
        setState(prev => ({
          ...prev,
          step: 'name',
          tempUser: user,
          showNameModal: true,
        }));
      } else {
        // User fully authenticated, create order
        setState(prev => ({ ...prev, step: 'uploading' }));
        if (state.orderData) {
          await createOrderMutation.mutateAsync(state.orderData);
        }
      }
    } catch (error) {
      console.error('OTP Order Verification Error:', error);
      throw error; // Let the OTP modal handle the error display
    }
  };

  const updateNameAndOrder = async (name: string) => {
    try {
      await updateUser({ name: name.trim() });
      setState(prev => ({ ...prev, showNameModal: false, step: 'uploading' }));
      
      toast({
        title: "Welcome to PrintEasy!",
        description: "Creating your order...",
      });
      
      if (state.orderData) {
        await createOrderMutation.mutateAsync(state.orderData);
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const closeModals = () => {
    setState(prev => ({
      ...prev,
      showOTPModal: false,
      showNameModal: false,
      isLoading: false,
    }));
  };

  const resetFlow = () => {
    setState({
      step: 'phone',
      phoneNumber: '',
      isLoading: false,
      showOTPModal: false,
      showNameModal: false,
      tempUser: null,
      orderData: null,
    });
  };

  return {
    // State
    ...state,
    isCreatingOrder: createOrderMutation.isPending,
    
    // Actions
    startOTPOrderFlow,
    verifyOTPAndOrder,
    updateNameAndOrder,
    closeModals,
    resetFlow,
    
    // Resend OTP function
    resendOTP: async () => {
      await sendWhatsAppOTP(state.phoneNumber);
    },
  };
}