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
      console.log('🔍 AuthContext: Checking authentication...');
      const response = await api.get('/api/users/getCurrentUser');
      
      console.log('🔍 AuthContext: checkAuth response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        userData: response.data.data
      });

      if (response.data.success) {
        setUser(response.data.data);
        console.log('✅ AuthContext: User authenticated, state updated');
      } else {
        setUser(null);
        console.log('❌ AuthContext: Authentication failed - no success');
      }
    } catch (error) {
      console.log('❌ AuthContext: Authentication check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    setLoading(true);
    try {
      console.log('🔐 AuthContext: Attempting login with:', { 
        hasUsername: !!credentials.username,
        hasEmail: !!credentials.email,
        hasPassword: !!credentials.password 
      });

      const response = await api.post('/api/users/login', credentials);
      
      console.log('🔐 AuthContext: Login response:', {
        success: response.data.success,
        statusCode: response.data.statusCode,
        hasUserData: !!response.data.data?.user,
        userData: response.data.data?.user
      });

      if (response.data.success && response.data.data?.user) {
        console.log('✅ AuthContext: Setting user data:', response.data.data.user);
        setUser(response.data.data.user);
        resetRefreshAttempts(); // Reset refresh attempts on successful login
        console.log('✅ AuthContext: Login successful, user state updated');
      } else {
        console.log('❌ AuthContext: Login response success but no user data');
        throw new Error('Login successful but no user data received');
      }
    } catch (error) {
      console.log('❌ AuthContext: Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/users/logout', {});
      setUser(null);
    } catch {
      // Logout error occurred
      // Even if logout fails, clear user state
      setUser(null);
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