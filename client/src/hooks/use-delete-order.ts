import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface DeleteOrderResponse {
  message: string;
  orderId: number;
}

// 🔧 FIX: Per-order delete state to prevent global "deleting" state
export const useDeleteOrder = (orderId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: orderId ? ['deleteOrder', orderId] : ['deleteOrder'], // Per-order mutation key
    mutationFn: async (targetOrderId: number): Promise<DeleteOrderResponse> => {
      return await apiClient.delete(`/api/orders/${targetOrderId}`);
    },
    // 🚀 OPTIMISTIC UPDATE: Immediately remove order from UI
    onMutate: async (targetOrderId: number) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/orders'] });

      // Snapshot all order-related queries for potential rollback
      const previousData = {
        customer: queryClient.getQueryData(['/api/orders/customer']),
        shop: queryClient.getQueryData(['/api/orders/shop']),
        all: queryClient.getQueryData(['/api/orders'])
      };

      // Helper to remove order from any data structure
      const removeOrderFromData = (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.filter((order: any) => order.id !== targetOrderId);
        }
        if (oldData.orders && Array.isArray(oldData.orders)) {
          return {
            ...oldData,
            orders: oldData.orders.filter((order: any) => order.id !== targetOrderId)
          };
        }
        return oldData;
      };

      // Optimistically remove the order from all cached queries
      queryClient.setQueryData(['/api/orders/customer'], removeOrderFromData);
      queryClient.setQueryData(['/api/orders/shop'], removeOrderFromData);
      queryClient.setQueryData(['/api/orders'], removeOrderFromData);

      // Show immediate feedback
      toast({
        title: "Deleting Order...",
        description: "Removing order from the system.",
      });

      // Return context for potential rollback
      return { previousData, targetOrderId };
    },
    onError: (error: Error, targetOrderId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/orders/customer'], context.previousData.customer);
        queryClient.setQueryData(['/api/orders/shop'], context.previousData.shop);
        queryClient.setQueryData(['/api/orders'], context.previousData.all);
      }
      
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Success toast (replaces "Deleting..." toast)
      toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted.",
      });
    },
    onSettled: () => {
      // Always refetch after mutation to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/shop'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
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
    // Shop owners can delete any order except 'new' status
    return { canDelete: true };
  }

  return { canDelete: false, reason: "Access denied" };
};