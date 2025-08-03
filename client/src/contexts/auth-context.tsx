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
    console.log('🚨 Global logout triggered by 401 error');
  };

  useEffect(() => {
    // Set up global 401 handler
    setAuthLogoutHandler(handleGlobalLogout);

    // 🔥 DELAY SESSION CHECK - Only verify after user tries to use the app
    const delayedSessionCheck = async () => {
      console.log('🔍 Auth Context: Checking for existing session...');
      
      // First check localStorage to see if we should verify
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        console.log('❌ No saved user, skipping session verification');
        setIsSessionVerified(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setIsSessionVerified(true);
          console.log('✅ Auth Context: Session verified:', userData.role, userData.id);
        } else {
          setUser(null);
          localStorage.removeItem('user');
          setIsSessionVerified(true);
          console.log('❌ Auth Context: Session expired');
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user');
        setIsSessionVerified(true);
        console.log('❌ Auth Context: Session check failed');
      } finally {
        setIsLoading(false);
      }
    };

    // Delay session check by 1 second to let everything load
    setTimeout(delayedSessionCheck, 1000);
  }, []);

  const login = async (credentials: { phone?: string; email?: string; password?: string; name?: string }): Promise<User> => {
    setIsLoading(true);
    try {
      let endpoint = '/api/auth/login';
      let body: any = {};

      if (credentials.phone) {
        // Customer phone-based login
        endpoint = '/api/auth/phone-login';
        body = { phone: credentials.phone };
        if (credentials.name) {
          body.name = credentials.name;
        }
      } else if (credentials.email && credentials.password) {
        // Shop owner or admin email+password login
        endpoint = '/api/auth/email-login';
        body = { email: credentials.email, password: credentials.password };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await response.json();
      
      // 🔥 CRITICAL FIX: Ensure immediate state update and synchronization
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsSessionVerified(true);
      console.log('✅ Auth Login: User authenticated', userData.role, userData.id);
      
      // Force a small delay to ensure auth state is synchronized before any API calls
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Save persistent user data for auto-fill
      const persistentData: Partial<PersistentUserData> = {};
      if (userData.phone) persistentData.phone = userData.phone;
      if (userData.name) persistentData.name = userData.name;
      if (userData.email) persistentData.email = userData.email;
      savePersistentUserData(persistentData);
      
      return userData;
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
      console.log('✅ Auth Context: User logged out');
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update user error:', error);
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
      
      // 🔥 CRITICAL FIX: Ensure immediate state update and synchronization  
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsSessionVerified(true);
      console.log('✅ Auth Admin Login: User authenticated', userData.role, userData.id);
      
      // Force a small delay to ensure auth state is synchronized before any API calls
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin, 
      logout, 
      updateUser, 
      isLoading,
      isSessionVerified,
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