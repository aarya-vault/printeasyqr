import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DeleteOrderResponse {
  message: string;
  orderId: number;
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: number): Promise<DeleteOrderResponse> => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete order');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all order-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Helper function to determine if user can delete order
export const canDeleteOrder = (
  order: any,
  userRole: string,
  userId: number
): { canDelete: boolean; reason?: string } => {
  if (userRole === 'admin') {
    return { canDelete: true };
  }

  if (userRole === 'customer') {
    if (order.customerId !== userId) {
      return { canDelete: false, reason: "Not your order" };
    }
    if (order.status === 'processing' || order.status === 'ready' || order.status === 'completed') {
      return { canDelete: false, reason: "Order is being processed and cannot be cancelled" };
    }
    return { canDelete: true };
  }

  if (userRole === 'shop_owner') {
    if (order.status === 'new') {
      return { canDelete: false, reason: "Customer must cancel new orders" };
    }
    return { canDelete: true };
  }

  return { canDelete: false, reason: "Access denied" };
};