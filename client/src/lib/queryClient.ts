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
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const requestId = `api-${method}-${url}-${Date.now()}`;
  perf.mark(`${requestId}-start`);
  
  debug.log(`API Request: ${method} ${url}`, data);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULTS.TIMEOUTS.API_REQUEST);

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    perf.mark(`${requestId}-end`);
    perf.measure(`API Request: ${method} ${url}`, `${requestId}-start`, `${requestId}-end`);

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
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
        // Don't retry on 4xx errors
        if (error.message.includes('401') || error.message.includes('404') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        debug.warn(`Mutation retry attempt ${failureCount}`, error);
        // Don't retry on 4xx errors
        if (error.message.includes('401') || error.message.includes('404') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});
