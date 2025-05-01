import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define User type (could import from a shared types file later)
export interface User {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  avatar_url?: string | null;
  team_id?: string | null;
  manager_id?: string | null;
  // Add other fields returned by /users/me endpoint
}

interface AuthContextType {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  setToken: (accessToken: string | null, refreshToken: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to set authentication state
  const setAuthenticated = (value: boolean) => {
    console.log(`[AuthContext] Setting authenticated: ${value}`);
    setIsAuthenticated(value);
    if (!value) {
      setUser(null);
      localStorage.removeItem('knowledge_plane_token');
    }
  };

  // Function to handle token storage
  const setToken = (accessToken: string | null, refreshToken: string | null) => {
    console.log(`[AuthContext] Setting tokens: ${!!accessToken}, ${!!refreshToken}`);
    if (accessToken) {
      localStorage.setItem('knowledge_plane_token', accessToken);
      setAuthenticated(true);
    } else {
      localStorage.removeItem('knowledge_plane_token');
      setAuthenticated(false);
    }
  };

  // Logout function - calls backend to clear cookies and removes token
  const logout = async () => {
    try {
      const token = localStorage.getItem('knowledge_plane_token');
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      localStorage.removeItem('knowledge_plane_token');
      setAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the backend call fails, clear the frontend state
      localStorage.removeItem('knowledge_plane_token');
      setAuthenticated(false);
    }
  };

  // Effect to check session status and fetch user on initial load
  useEffect(() => {
    const checkAuthState = async () => {
      setIsLoading(true);
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('knowledge_plane_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if session is valid by requesting current user
        const response = await axios.get<User>(`${API_BASE_URL}/users/me`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 200 && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.warn("[AuthContext] Session check failed, user is not authenticated");
        setIsAuthenticated(false);
        // Clear invalid token
        localStorage.removeItem('knowledge_plane_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthState();
  }, []); // Run only on initial load

  // Effect to fetch user data when authentication state changes
  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && !user) {
        setIsLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('knowledge_plane_token');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await axios.get<User>(`${API_BASE_URL}/users/me`, {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.status === 200) {
            setUser(response.data);
          }
        } catch (error) {
          console.error("[AuthContext] Failed to fetch user data:", error);
          setIsAuthenticated(false);
          localStorage.removeItem('knowledge_plane_token');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUser();
  }, [isAuthenticated, user]);

  const contextValue = { 
    isAuthenticated, 
    setAuthenticated, 
    user, 
    isLoading,
    logout,
    setToken
  };
  
  console.log("[AuthContext] Providing context value:", { 
    isAuthenticated, 
    user: !!user, 
    isLoading 
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Define hook separately from its export for better HMR compatibility
function useAuthValue(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useAuthValue; 