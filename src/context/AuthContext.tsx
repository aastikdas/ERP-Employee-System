import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dob?: string;
  dateOfJoining: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  baseSalary: number;
  avatar?: string;
  departmentId?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  managerId?: number;
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('erp_token');
      if (storedToken) {
        try {
          // Fetch current profile
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to load user profile on startup', error);
          // Token is invalid/expired
          localStorage.removeItem('erp_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: loggedUser } = response.data;
      
      localStorage.setItem('erp_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
    } catch (error: any) {
      localStorage.removeItem('erp_token');
      setToken(null);
      setUser(null);
      throw new Error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const { token: receivedToken, user: registeredUser } = response.data;
      
      localStorage.setItem('erp_token', receivedToken);
      setToken(receivedToken);
      setUser(registeredUser);
    } catch (error: any) {
      localStorage.removeItem('erp_token');
      setToken(null);
      setUser(null);
      throw new Error(error.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    setToken(null);
    setUser(null);
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
