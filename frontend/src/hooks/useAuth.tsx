import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  reading_preferences?: string[];
  roles?: string[];
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  loginWithGoogle: (customData?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiClient.get<User>('/api/user');
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post<User>('/api/login', credentials);
    if (response.success && response.data) {
      setUser(response.data);
    }
  };

  const loginWithGoogle = async (customData?: Partial<User>) => {
    await apiClient.get('/sanctum/csrf-cookie');
    const payload = {
      email: customData?.email || 'reader@google.com',
      name: customData?.name || 'قارئ أدبي متفاعل',
      google_id: 'google_oauth_' + Math.floor(Math.random() * 1000000),
      avatar: customData?.avatar || null,
    };
    const response = await apiClient.post<{ user: User }>('/api/auth/google', payload);
    if (response.success && response.data) {
      await checkAuth();
    }
  };

  const logout = async () => {
    await apiClient.post('/api/logout', {});
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const can = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, refreshUser, can, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
