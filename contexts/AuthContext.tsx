import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User, RegisterRequest, LoginRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        apiService.setToken(storedToken);
        setToken(storedToken);
        
        // Verify token is still valid
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Clear invalid stored auth
      await AsyncStorage.removeItem('auth_token');
      apiService.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (request: LoginRequest) => {
    try {
      const response = await apiService.login(request);
      const { access_token, user: userData } = response;
      
      await AsyncStorage.setItem('auth_token', access_token);
      apiService.setToken(access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      // Transform error for better display
      const errorMessage = getErrorMessage(error);
      const customError = new Error(errorMessage);
      throw customError;
    }
  };

  const register = async (request: RegisterRequest) => {
    try {
      const response = await apiService.register(request);
      const { access_token, user: userData } = response;
      
      await AsyncStorage.setItem('auth_token', access_token);
      apiService.setToken(access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      console.error('Register error:', error);
      // Transform error for better display
      const errorMessage = getErrorMessage(error);
      const customError = new Error(errorMessage);
      throw customError;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      apiService.setToken(null);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user && !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper function to extract readable error messages
function getErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    // Handle FastAPI validation errors
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
        .join(', ');
    }
    return error.response.data.detail;
  }
  
  if (error.response?.status === 422) {
    return 'Please check your input and try again';
  }
  
  if (error.response?.status === 401) {
    return 'Invalid credentials';
  }
  
  if (error.response?.status === 400) {
    return 'Bad request - please check your input';
  }
  
  return error.message || 'An error occurred';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}