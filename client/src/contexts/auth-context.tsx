import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/types';

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

  useEffect(() => {
    // 🔥 CRITICAL FIX: Check localStorage first to avoid null user state
    const checkSession = async () => {
      try {
        // First check localStorage to maintain user state during session check
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData); // Set user immediately from localStorage
          } catch (e) {
            localStorage.removeItem('user');
          }
        }
        
        // Then verify with server (but don't reset user to null)
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Only clear user if we don't have valid localStorage data
          if (!savedUser) {
            setUser(null);
          }
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Don't clear user state if localStorage has valid data
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          setUser(null);
        }
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
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
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
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
      localStorage.removeItem('user');
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
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
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