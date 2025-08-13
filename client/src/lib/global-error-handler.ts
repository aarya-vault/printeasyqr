// Global error handler for unhandled promise rejections
let errorHandler: ((error: any) => void) | null = null;

export const setGlobalErrorHandler = (handler: (error: any) => void) => {
  errorHandler = handler;
};

// Setup global error handlers
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's a Vite HMR ping error (most common cause)
    const errorMessage = event.reason?.message || '';
    const errorStack = event.reason?.stack || '';
    
    // Silently ignore Vite HMR connection errors
    if (errorMessage === 'Failed to fetch' || errorMessage.includes('Failed to fetch')) {
      if (errorStack.includes('@vite/client') || 
          errorStack.includes('ping') || 
          errorStack.includes('waitForSuccessfulPing') ||
          errorStack.includes('vite') ||
          event.reason?.toString().includes('TypeError')) {
        // Prevent default and silently ignore Vite HMR errors
        event.preventDefault();
        return;
      }
    }
    
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    
    // Prevent the default handling (which logs to console)
    event.preventDefault();
    
    // Call custom error handler if set
    if (errorHandler) {
      errorHandler(event.reason);
    }
    
    // Handle specific error types
    if (event.reason?.message?.includes('401')) {
      console.log('🔐 Global Error Handler: Authentication error, redirecting...');
      // Let the auth context handle this
      return;
    }
    
    if (event.reason?.message?.includes('Network Error') || 
        event.reason?.message?.includes('fetch')) {
      console.log('🌐 Global Error Handler: Network error detected');
      // Show network error toast or retry mechanism
      return;
    }
    
    // Log other errors for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Unhandled Promise Rejection Details');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
      console.groupEnd();
    }
  });

  // Handle other uncaught errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error);
    
    if (errorHandler) {
      errorHandler(event.error);
    }
  });

  console.log('✅ Global error handling initialized');
};

// Utility to wrap async functions with error handling
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T => {
  return ((...args: Parameters<T>) => {
    return fn(...args).catch((error) => {
      console.error(errorMessage || 'Async operation failed:', error);
      throw error; // Re-throw to maintain error flow
    });
  }) as T;
};

// Safe async wrapper for React components
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage || 'Safe async operation failed:', error);
    return fallback;
  }
};

// Query error handler
export const handleQueryError = (error: any, queryKey?: string[]) => {
  console.error(`Query Error${queryKey ? ` for ${queryKey.join('/')}` : ''}:`, error);
  
  // Handle specific error types
  if (error?.message?.includes('401')) {
    // Auth error - handled by auth context
    return;
  }
  
  if (error?.message?.includes('404')) {
    console.log('Resource not found, this might be expected');
    return;
  }
  
  if (error?.message?.includes('500')) {
    console.error('Server error detected, may need retry');
    return;
  }
};

// Mutation error handler
export const handleMutationError = (error: any, operation?: string) => {
  console.error(`Mutation Error${operation ? ` for ${operation}` : ''}:`, error);
  
  // Handle specific error types similar to query errors
  if (error?.message?.includes('401')) {
    return; // Auth context handles this
  }
  
  if (error?.message?.includes('409')) {
    console.log('Conflict error - resource may already exist or be in use');
    return;
  }
};