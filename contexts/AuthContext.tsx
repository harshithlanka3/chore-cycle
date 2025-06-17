import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, tokenManager, User } from '../services/api';
import { websocketService } from '../services/websocket';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await tokenManager.getToken();
      if (token) {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await tokenManager.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ username: email, password });
    await tokenManager.setToken(response.access_token);
    
    // Get user data
    const userData = await authApi.getCurrentUser();
    setUser(userData);
    
    // The WebSocket connection will be established in useChores hook
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

  const register = async (email: string, password: string, name: string) => {
    try {
      await authApi.register({ email, password, name });
      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout initiated...');
    
    try {
      // Disconnect websocket first
      websocketService.disconnect();
      console.log('WebSocket disconnected');
      
      // Call server logout (but don't fail if it doesn't work)
      try {
        await authApi.logout();
        console.log('Server logout successful');
      } catch (serverError) {
        console.warn('Server logout failed, continuing with local cleanup:', serverError);
      }
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state
      try {
        await tokenManager.removeToken();
        console.log('Token removed');
      } catch (tokenError) {
        console.error('Failed to remove token:', tokenError);
      }
      
      // Clear user state - this will trigger navigation back to login
      setUser(null);
      console.log('User state cleared - should navigate to login');
      
      // Optional: Clear browser storage on web (but don't reload)
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            console.log('Browser storage cleared');
          }
        } catch (webError) {
          console.error('Web cleanup failed:', webError);
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}