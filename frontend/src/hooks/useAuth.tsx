import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
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
      const response = await apiClient.get('/api/user');
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    // Sanctum CSRF protection
    await apiClient.get('/sanctum/csrf-cookie');
    const response = await apiClient.post('/api/login', credentials);
    if (response.success) {
      setUser(response.data);
    }
  };

  const logout = async () => {
    await apiClient.post('/api/logout', {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
