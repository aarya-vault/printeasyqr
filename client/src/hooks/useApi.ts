// Centralized API hook for consistent error handling and loading states
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export const useApi = <TData = any, TParams = any>(
  apiFunction: (params: TParams) => Promise<ApiResponse<TData>>,
  options: UseApiOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const { toast } = useToast();

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully'
  } = options;

  const execute = useCallback(async (params: TParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(params);
      
      if (response.success) {
        setData(response.data || null);
        
        if (showSuccessToast) {
          toast({
            title: 'Success',
            description: response.message || successMessage,
            variant: 'default'
          });
        }
        
        return response;
      } else {
        const errorMessage = response.message || response.error || 'Operation failed';
        setError(errorMessage);
        
        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showSuccessToast, showErrorToast, successMessage, toast]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset
  };
};