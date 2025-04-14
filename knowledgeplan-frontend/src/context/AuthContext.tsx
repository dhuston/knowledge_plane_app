import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client'; // Import API client
// import { useNavigate, useLocation } from 'react-router-dom'; // No longer needed here

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
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  user: User | null; // Add user state
  isLoading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // const navigate = useNavigate(); // No longer needed here
  // const location = useLocation(); // No longer needed here
  const [token, setTokenState] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('knowledge_plane_token');
    console.log(`[AuthContext] Initializing token state from localStorage: ${storedToken ? storedToken.substring(0, 10)+'...' : 'null'}`);
    return storedToken;
  });
  const [user, setUser] = useState<User | null>(null);
  // Start loading ONLY if a token exists initially
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  // Function to set token (called by AuthCallback or logout)
  const setToken = (newToken: string | null) => {
    // console.log(`[AuthContext] setToken called with: ${newToken ? newToken.substring(0, 10)+'...' : 'null'}`);
    if (newToken) {
      localStorage.setItem('knowledge_plane_token', newToken);
    } else {
      localStorage.removeItem('knowledge_plane_token');
      setUser(null); // Clear user on logout
    }
    setTokenState(newToken); // Update state
    setIsLoading(!!newToken); // Start loading if token is set, stop if cleared
  };

  // Effect to fetch user when token state changes (and is not null)
  useEffect(() => {
    const fetchUser = async () => {
      // console.log(`[AuthContext] User fetch effect. Token state: ${token ? token.substring(0, 10)+'...' : 'null'}`);
      if (token) {
        // Ensure loading is true when we start fetching
        if (!isLoading) setIsLoading(true);
        try {
          // console.log("[AuthContext] Fetching user data...");
          const userData = await apiClient.get<User>('/users/me');
          setUser(userData);
          // console.log("[AuthContext] Fetched user data successfully.");
        } catch /* (error) */ {
          // Error fetching user, likely invalid token
          // console.error("[AuthContext] Failed to fetch user:", error); 
          setToken(null); // Clear the invalid token
        } finally {
          // Always set loading to false after attempt completes
          // console.log("[AuthContext] User fetch attempt finished, setting isLoading false.");
          setIsLoading(false);
        }
      } else {
        // If token is null, ensure user is null and loading is false
        if (user) setUser(null);
        if (isLoading) setIsLoading(false);
      }
    };
    fetchUser();
  }, [token]); // Dependency: token state

  // REMOVED Navigation effect - navigation is now handled by AuthCallbackPage
  // useEffect(() => {
  //   ...
  // }, [isLoading, user, navigate, location]); 

  // Determine final isAuthenticated status AFTER loading is complete
  const isAuthenticated = !isLoading && !!user;
  const contextValue = { token, setToken, isAuthenticated, user, isLoading };
  
  // console.log("[AuthContext] Providing context value:", { ...contextValue, token: token ? token.substring(0,10)+'...' : null });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 