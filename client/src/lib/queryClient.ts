import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { debug, perf } from '@/utils/debug';
import { DEFAULTS } from '@/constants';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    debug.error(`API Error: ${res.status}`, { url: res.url, status: res.status, text });
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const requestId = `api-${method}-${url}-${Date.now()}`;
  perf.mark(`${requestId}-start`);
  
  debug.log(`API Request: ${method} ${url}`, data);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULTS.TIMEOUTS.API_REQUEST);

  try {
    // 🔥 CRITICAL: Ensure proper URL for API calls
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    // Get JWT token if available
    const authToken = localStorage.getItem('authToken');
    const headers: any = data ? { "Content-Type": "application/json" } : {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    perf.mark(`${requestId}-end`);
    perf.measure(`API Request: ${method} ${url}`, `${requestId}-start`, `${requestId}-end`);

    // Handle 401 errors globally
    if (res.status === 401) {
      handle401Error();
    }

    await throwIfResNotOk(res);
    debug.log(`API Success: ${method} ${url}`, { status: res.status });
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    debug.error(`API Failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // 🔥 CRITICAL: Ensure proper URL for API calls
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    // Get JWT token if available
    const authToken = localStorage.getItem('authToken');
    const headers: any = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Global 401 handler will be triggered by throwIfResNotOk
      handle401Error();
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Global 401 handler for automatic logout and redirect
let authLogoutHandler: (() => void) | null = null;

export const setAuthLogoutHandler = (handler: () => void) => {
  authLogoutHandler = handler;
};

const handle401Error = () => {
  console.log('🚨 Global 401 Handler: Auth token expired, clearing auth state');
  // Clear all auth-related local storage
  localStorage.removeItem('user');
  localStorage.removeItem('persistentUserData');
  localStorage.removeItem('authToken'); // Clear JWT token
  
  // Call auth logout handler if available
  if (authLogoutHandler) {
    authLogoutHandler();
  }
  
  // Redirect to login page
  if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
    window.location.href = '/';
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes for better performance
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      retry: (failureCount, error) => {
        debug.warn(`Query retry attempt ${failureCount}`, error);
        
        // Global 401 handler
        if (error.message.includes('401')) {
          handle401Error();
          return false;
        }
        
        // Don't retry on other 4xx errors
        if (error.message.includes('404') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        debug.warn(`Mutation retry attempt ${failureCount}`, error);
        
        // Global 401 handler
        if (error.message.includes('401')) {
          handle401Error();
          return false;
        }
        
        // Don't retry on other 4xx errors
        if (error.message.includes('404') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});
