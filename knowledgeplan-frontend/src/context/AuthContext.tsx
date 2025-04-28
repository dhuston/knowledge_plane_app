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
  token: string | null; // Access token
  setToken: (accessToken: string | null, refreshToken?: string | null) => void;
  isAuthenticated: boolean;
  user: User | null; // Add user state
  isLoading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define keys for localStorage
const ACCESS_TOKEN_KEY = 'knowledge_plane_token';
const REFRESH_TOKEN_KEY = 'knowledge_plane_refresh_token';

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // const navigate = useNavigate(); // No longer needed here
  // const location = useLocation(); // No longer needed here
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    console.log(`[AuthContext] Initializing access token state: ${storedToken ? 'present' : 'null'}`);
    return storedToken;
  });
  // No need to store refresh token in state, localStorage is enough
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!accessToken);

  // Function to set token (called by AuthCallback or logout)
  const setToken = (newAccessToken: string | null, newRefreshToken?: string | null) => {
    console.log(`[AuthContext] setToken called with: ${newAccessToken ? 'accessToken' : 'null'}, ${newRefreshToken ? 'refreshToken' : 'null'}`);
    if (newAccessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      // Store refresh token only if provided
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
    } else {
      // Clear both tokens on logout
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null); // Clear user on logout
    }
    setAccessTokenState(newAccessToken); // Update access token state
    setIsLoading(!!newAccessToken); 
  };

  // Effect to fetch user when access token state changes (and is not null)
  useEffect(() => {
    const fetchUser = async () => {
      if (accessToken) {
        if (!isLoading) setIsLoading(true);
        try {
          const userData = await apiClient.get<User>('/users/me');
          setUser(userData);
        } catch /* (error) */ {
          // If /users/me fails, the useApiClient interceptor should have already
          // attempted a refresh if it was a 401. If it still fails after that,
          // or fails for a different reason, we should clear the tokens.
          console.warn("[AuthContext] /users/me failed after potential refresh attempt. Clearing tokens.");
          setToken(null, null);
        } finally {
          setIsLoading(false);
        }
      } else {
        if (user) setUser(null);
        if (isLoading) setIsLoading(false);
      }
    };
    fetchUser();
  }, [accessToken]); // Dependency: accessToken state

  // REMOVED Navigation effect - navigation is now handled by AuthCallbackPage
  // useEffect(() => {
  //   ...
  // }, [isLoading, user, navigate, location]); 

  const isAuthenticated = !isLoading && !!user;
  // Expose only the access token as 'token' for compatibility with useApiClient
  const contextValue = { token: accessToken, setToken, isAuthenticated, user, isLoading }; 
  
  console.log("[AuthContext] Providing context value:", { isAuthenticated, user: !!user, isLoading, token: accessToken ? 'present' : 'null' });

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