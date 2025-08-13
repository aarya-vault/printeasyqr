// Disable Vite HMR client-side to prevent connection errors
// This runs before Vite's client code loads

// Override the global HMR object to prevent connection attempts
if (typeof window !== 'undefined') {
  // Disable Vite's built-in HMR client
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {});
    // @ts-ignore
    import.meta.hot = null;
  }
  
  // Override fetch to prevent HMR ping requests
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    // Block HMR ping requests that cause the errors
    const url = typeof input === 'string' ? input : 
                input instanceof URL ? input.href : 
                (input as Request).url;
    if (url.includes('/@vite/client') || 
        url.includes('/vite/ping') || 
        url.includes('__vite_ping')) {
      // Return a resolved promise instead of making the request
      return Promise.resolve(new Response('blocked', { status: 200 }));
    }
    return originalFetch(input, init);
  };
}

export {};