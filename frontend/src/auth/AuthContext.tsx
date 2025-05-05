import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authClient, User } from './AuthClient';
import { tokenManager } from './TokenManager';

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have a token
        if (!tokenManager.hasToken()) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Token exists, get user profile
        const userData = await authClient.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsAuthenticated(false);
        setUser(null);
        
        // Only show error if token exists but is invalid
        if (tokenManager.hasToken()) {
          setError('Session expired. Please login again.');
          // Clean up invalid token
          tokenManager.removeToken();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call login API
      const response = await authClient.login({ username: email, password });
      
      // Store token
      tokenManager.storeToken(response.access_token);
      
      // Get user data
      const userData = await authClient.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials.');
      setIsAuthenticated(false);
      setUser(null);
      tokenManager.removeToken();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Demo Login function
  const demoLogin = async (tenantId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call demo login API
      const response = await authClient.demoLogin(tenantId);
      
      // Store token
      tokenManager.storeToken(response.access_token);
      
      // Get user data
      const userData = await authClient.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Demo login failed:', err);
      setError('Demo login failed. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
      tokenManager.removeToken();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authClient.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Always clear state and token, even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      tokenManager.removeToken();
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    demoLogin,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};