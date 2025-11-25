"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { resetRefreshAttempts } from '../app/utils/api';

interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  profilePic: string;
  role: string;
  isOnline: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // Check if tokens exist in localStorage first
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        // No token available, user is not authenticated
        setUser(null);
        setLoading(false);
        return;
      }

      // Token exists, verify with backend
      const response = await api.get('/api/users/getCurrentUser');
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/api/users/login', credentials);
      
      if (response.data.success && response.data.data?.user) {
        // Store tokens in localStorage for Authorization header approach
        const { tokens } = response.data.data;
        if (tokens?.accessToken) {
          localStorage.setItem('accessToken', tokens.accessToken);
        }
        if (tokens?.refreshToken) {
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        
        setUser(response.data.data.user);
        resetRefreshAttempts(); // Reset refresh attempts on successful login
        
        console.log('🔑 Tokens stored successfully for Authorization header approach');
      } else {
        throw new Error('Login successful but no user data received');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/users/logout', {});
    } catch {
      // Logout error occurred - continue with cleanup
      console.log('Logout API call failed, but continuing with local cleanup');
    } finally {
      // Always clear local state and tokens
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};