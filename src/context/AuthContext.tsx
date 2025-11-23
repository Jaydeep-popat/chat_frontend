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
      const response = await api.get('/api/users/getCurrentUser');
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/api/users/login', credentials);
      
      if (response.data.success) {
        setUser(response.data.data.user);
        resetRefreshAttempts(); // Reset refresh attempts on successful login
      }
    } catch (error) {
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