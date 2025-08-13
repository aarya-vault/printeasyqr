// Disable Vite HMR client-side to prevent connection errors
// This intercepts and mocks Vite's ping requests to prevent network errors

if (typeof window !== 'undefined') {
  // Store original fetch immediately
  const originalFetch = window.fetch;
  let interceptCount = 0;
  
  // Override fetch to intercept HMR ping requests
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Extract URL from various input types
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as Request).url;
    }
    
    // Check if this is a Vite ping request (happens every second)
    // Vite pings the root URL to check if server is alive
    const isVitePing = (
      url === '/' ||
      url === '' ||
      url.endsWith('/__vite_ping') ||
      (init?.headers && JSON.stringify(init.headers).includes('ping'))
    );
    
    if (isVitePing) {
      interceptCount++;
      // Return mock successful response to satisfy Vite
      return Promise.resolve(new Response('ok', { 
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'text/plain',
          'X-Intercepted': 'true'
        })
      }));
    }
    
    // Let all other requests through normally
    return originalFetch.call(window, input, init);
  };
  
  // Also disable HMR if it exists
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {});
    // @ts-ignore - Nullify HMR
    import.meta.hot = null;
  }
  
  // Log that interception is active (for debugging)
  console.log('✅ Vite HMR ping interceptor activated');
}

export {};