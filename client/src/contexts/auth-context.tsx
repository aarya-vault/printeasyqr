import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/types';
import { setAuthLogoutHandler } from '@/lib/queryClient';

// Persistent user data interface for auto-fill
interface PersistentUserData {
  phone?: string;
  name?: string;
  email?: string;
  lastLoginTime?: number;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { phone?: string; email?: string; password?: string; name?: string }) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isSessionVerified: boolean;
  // WhatsApp OTP methods
  sendWhatsAppOTP: (phone: string) => Promise<{ skipOTP: boolean; user?: User }>;
  verifyWhatsAppOTP: (phone: string, otp: string) => Promise<User>;
  // New persistent data methods
  getPersistentUserData: () => PersistentUserData | null;
  savePersistentUserData: (data: Partial<PersistentUserData>) => void;
  clearPersistentUserData: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  // Global logout handler for 401 interceptor
  const handleGlobalLogout = () => {
    setUser(null);
    setIsSessionVerified(false);
    localStorage.removeItem('user');
    localStorage.removeItem('persistentUserData');
    localStorage.removeItem('authToken'); // Clear JWT token
    console.log('🚨 Global logout triggered by 401 error');
  };

  useEffect(() => {
    // Set up global 401 handler
    setAuthLogoutHandler(handleGlobalLogout);

    // 🔥 OPTIMIZED JWT AUTHENTICATION CHECK - PREVENTS UNNECESSARY API CALLS
    const checkAuth = async () => {
      try {
        console.log('🔍 Auth Context: Checking JWT authentication...');
        
        // Get JWT token from localStorage
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          console.log('✅ Auth Context: No JWT token found - skipping API call');
          setUser(null);
          localStorage.removeItem('user');
          setIsSessionVerified(true);
          setIsLoading(false);
          return; // ✅ EXIT EARLY - No token = no API call needed
        }
        
        // Only make API call if we have a token
        console.log('🔑 Auth Context: JWT token found, verifying with server...');
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` // Send JWT token
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ Auth Context: User verified via JWT:', userData.role);
        } else {
          // Token is invalid, clear everything
          console.log('❌ Auth Context: JWT token invalid, clearing auth state');
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('❌ Auth Context: Auth check error:', error);
        // Only clear auth if we actually had a token to check
        const hadToken = localStorage.getItem('authToken');
        if (hadToken) {
          console.log('🧹 Auth Context: Clearing invalid auth state after error');
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } finally {
        setIsSessionVerified(true);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 🚀 SIMPLIFIED LOGIN - DIRECT PHONE AND EMAIL LOGIN
  const login = async (credentials: { phone?: string; email?: string; password?: string; name?: string }): Promise<User> => {
    setIsLoading(true);
    try {
      // Handle phone-based login directly
      if (credentials.phone) {
        console.log('📱 Phone Login: Creating account for', credentials.phone);
        const response = await fetch('/api/auth/phone-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            phone: credentials.phone,
            name: credentials.name || 'Customer'
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Phone login failed');
        }

        const userData = await response.json();
        
        // Store JWT token if provided
        if (userData.token) {
          localStorage.setItem('authToken', userData.token);
          console.log('🔑 JWT Token stored');
        }
        
        // Set user immediately
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsSessionVerified(true);
        console.log('✅ Phone Login Success:', userData.role, userData.phone);
        
        return userData;
      }

      // Only allow email+password login for shop owners and admins
      if (credentials.email && credentials.password) {
        const response = await fetch('/api/auth/email-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const userData = await response.json();
        
        // Store JWT token if provided
        if (userData.token) {
          localStorage.setItem('authToken', userData.token);
          console.log('🔑 JWT Token stored');
        }
        
        // Set user immediately
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsSessionVerified(true);
        console.log('✅ Email Login Success:', userData.role, userData.email);
        
        return userData;
      }

      throw new Error('Invalid login credentials');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsSessionVerified(false);
      localStorage.removeItem('user');
      localStorage.removeItem('persistentUserData');
      localStorage.removeItem('authToken'); // Clear JWT token
      console.log('✅ Auth Context: User logged out');
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      console.error('❌ UpdateUser: No user found');
      return;
    }

    try {
      // Get JWT token for authentication
      const authToken = localStorage.getItem('authToken');
      console.log('🔍 UpdateUser: Token check -', authToken ? 'Present' : 'Missing');
      
      if (!authToken) {
        console.error('❌ UpdateUser: No JWT token found in localStorage');
        throw new Error('No authentication token found');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      console.log('🔍 UpdateUser: Making request to', `/api/users/${user.id}`);
      console.log('🔍 UpdateUser: Headers -', Object.keys(headers));
      console.log('🔍 UpdateUser: Updates -', updates);
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      console.log('🔍 UpdateUser: Response status -', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ UpdateUser: Request failed -', response.status, errorText);
        throw new Error(`Failed to update user: ${response.status} ${errorText}`);
      }

      const updatedUser = await response.json();
      
      // Update the user state and localStorage with fresh data
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Also update persistent data if name was changed
      if (updates.name) {
        const persistentData = getPersistentUserData() || {};
        savePersistentUserData({ ...persistentData, name: updates.name });
      }
      
      console.log('✅ User updated successfully:', updatedUser.name);
    } catch (error) {
      console.error('❌ Update user error:', error);
      throw error;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await response.json();
      
      // Store JWT token if provided
      if (userData.token) {
        localStorage.setItem('authToken', userData.token);
        console.log('🔑 JWT Token stored for admin');
      }
      
      // 🔥 IMMEDIATE STATE UPDATE
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsSessionVerified(true);
      console.log('✅ Admin Login Success:', userData.role);
      
      return userData;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Persistent user data methods for auto-fill functionality
  const getPersistentUserData = (): PersistentUserData | null => {
    try {
      const stored = localStorage.getItem('persistentUserData');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting persistent user data:', error);
      return null;
    }
  };

  const savePersistentUserData = (data: Partial<PersistentUserData>) => {
    try {
      const existing = getPersistentUserData() || {};
      const updated = {
        ...existing,
        ...data,
        lastLoginTime: Date.now()
      };
      localStorage.setItem('persistentUserData', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving persistent user data:', error);
    }
  };

  const clearPersistentUserData = () => {
    try {
      localStorage.removeItem('persistentUserData');
    } catch (error) {
      console.error('Error clearing persistent user data:', error);
    }
  };

  // 🚀 SMART JWT-FIRST WhatsApp OTP authentication
  const sendWhatsAppOTP = async (phone: string): Promise<{ skipOTP: boolean; user?: User }> => {
    try {
      console.log('🔍 Auth Context: Sending WhatsApp OTP for', phone);
      
      // Get current JWT token to include in request
      const authToken = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Include JWT token if available for validation
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔍 Auth Context: Including JWT token in OTP request');
      }
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.skipOTP || result.bypassMode) {
          // User authenticated via valid JWT token OR bypass mode
          setUser(result.user);
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('authToken', result.token);
          if (result.refreshToken) {
            localStorage.setItem('refreshToken', result.refreshToken);
          }
          setIsSessionVerified(true);
          console.log('🔑 Fresh JWT Token stored');
          
          if (result.bypassMode) {
            console.log('🚨 BYPASS MODE: User authenticated automatically via bypass mode');
          } else {
            console.log('✅ Login Success via Token:', result.user.role, result.user.phone);
          }
          
          return { skipOTP: true, user: result.user };
        } else {
          console.log('🔍 Auth Context: Valid token not found, OTP will be sent');
        }
        return { skipOTP: false };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Send WhatsApp OTP Error:', error);
      throw error;
    }
  };

  const verifyWhatsAppOTP = async (phone: string, otp: string): Promise<User> => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const result = await response.json();

      if (result.success) {
        // Store authentication data
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('authToken', result.token);
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }
        setIsSessionVerified(true);

        // Update persistent data
        savePersistentUserData({
          phone: result.user.phone,
          name: result.user.name !== 'Customer' ? result.user.name : undefined,
          lastLoginTime: Date.now()
        });

        return result.user;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Verify WhatsApp OTP Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin, 
      logout, 
      updateUser, 
      isLoading,
      isSessionVerified,
      sendWhatsAppOTP,
      verifyWhatsAppOTP,
      getPersistentUserData,
      savePersistentUserData,
      clearPersistentUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}