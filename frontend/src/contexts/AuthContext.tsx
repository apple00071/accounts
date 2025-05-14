import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

interface Business {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  business: Business | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  register: (
    businessName: string,
    ownerName: string,
    email: string,
    phoneNumber: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedBusiness = localStorage.getItem('business');
        const storedAdmin = localStorage.getItem('admin');

        if (storedToken) {
          setToken(storedToken);
          if (storedBusiness) {
            setBusiness(JSON.parse(storedBusiness));
          }
          if (storedAdmin) {
            setAdmin(JSON.parse(storedAdmin));
          }
        } else {
          // Clear everything if no token
          localStorage.removeItem('token');
          localStorage.removeItem('business');
          localStorage.removeItem('admin');
          setToken(null);
          setBusiness(null);
          setAdmin(null);
        }
      } catch (error) {
        // If there's an error parsing stored data, clear everything
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('business');
        localStorage.removeItem('admin');
        setToken(null);
        setBusiness(null);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/business/login', { email, password });
      const { token: newToken, business: businessData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('business', JSON.stringify(businessData));
      
      setToken(newToken);
      setBusiness(businessData);
      setAdmin(null);
      
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to login');
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const { token: newToken, admin: adminData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      setToken(newToken);
      setAdmin(adminData);
      setBusiness(null);
      
      navigate('/admin/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to login as admin');
    }
  };

  const register = async (
    businessName: string,
    ownerName: string,
    email: string,
    phoneNumber: string,
    password: string
  ) => {
    try {
      const response = await api.post('/business/register', {
        name: businessName,
        ownerName,
        email,
        phoneNumber,
        password,
      });
      const { token: newToken, business: businessData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('business', JSON.stringify(businessData));
      
      setToken(newToken);
      setBusiness(businessData);
      setAdmin(null);
      
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to register');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('business');
    localStorage.removeItem('admin');
    setToken(null);
    setBusiness(null);
    setAdmin(null);
    navigate('/login');
  };

  const value = {
    token,
    business,
    admin,
    isAuthenticated: !!token,
    isAdmin: !!admin,
    isLoading,
    login,
    loginAsAdmin,
    register,
    logout,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for protected routes
export const useRequireAuth = (requireAdmin = false) => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate(requireAdmin ? '/admin/login' : '/login');
    } else if (requireAdmin && !auth.isAdmin) {
      navigate('/login');
    }
  }, [auth.isAuthenticated, auth.isAdmin, navigate, requireAdmin]);

  return auth;
}; 