/**
 * Centralized API Client with JWT Authentication
 * Replaces direct fetch calls to ensure consistent JWT token inclusion
 */

interface APIClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class APIClient {
  private getAuthHeaders(): Record<string, string> {
    const authToken = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  }

  async request<T>(url: string, options: APIClientOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true
    } = options;

    // Prepare headers
    const finalHeaders = requireAuth 
      ? { ...this.getAuthHeaders(), ...headers }
      : { 'Content-Type': 'application/json', ...headers };

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: finalHeaders,
      credentials: 'include'
    };

    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Handle authentication errors
      if (response.status === 401) {
        console.error('🚨 API Client: Authentication failed, clearing auth state');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('persistentUserData');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      console.error(`API Client Error for ${method} ${url}:`, error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'GET', requireAuth });
  }

  async post<T>(url: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, requireAuth });
  }

  async patch<T>(url: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body, requireAuth });
  }

  async put<T>(url: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body, requireAuth });
  }

  async delete<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', requireAuth });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export for legacy compatibility
export default apiClient;