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
  token: string | null; // Add token getter to the interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define API base URL - ensure it doesn't include /api/v1 suffix
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Debug tracking for auth flow
  const [lastAuthEvent, setLastAuthEvent] = useState<string>("none");
  const logAuthEvent = (event: string) => {
    console.log(`[AUTH EVENT] ${event} @ ${new Date().toISOString()}`);
    setLastAuthEvent(event);
  };

  // Function to set authentication state
  const setAuthenticated = (value: boolean) => {
    logAuthEvent(`setAuthenticated(${value})`);
    setIsAuthenticated(value);
    if (!value) {
      logAuthEvent("clearingUserAndToken");
      setUser(null);
      localStorage.removeItem('knowledge_plane_token');
    }
  };

  // Function to handle token storage
  const setToken = (accessToken: string | null, refreshToken: string | null) => {
    logAuthEvent(`setToken(${accessToken ? 'token-provided' : 'null'})`);
    console.log('AuthContext.setToken called with:', 
                accessToken ? 'token (length ' + accessToken.length + ')' : 'null',
                refreshToken ? 'refresh token (length ' + refreshToken.length + ')' : 'null');
    
    if (accessToken) {
      logAuthEvent("storingToken");
      console.log('Storing token in localStorage under key: knowledge_plane_token');
      
      // RACE CONDITION FIX: Set loading state BEFORE storing token
      // This ensures components know we're in a loading state before any auth checks
      logAuthEvent("settingLoadingBeforeTokenStorage");
      setIsLoading(true);
      
      localStorage.setItem('knowledge_plane_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('knowledge_plane_refresh_token', refreshToken);
      }
      
      // Create a JWT parser to check token
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          logAuthEvent(`tokenParsed:${JSON.stringify(payload)}`);
        }
      } catch (e) {
        logAuthEvent(`tokenParseError:${e}`);
      }
      
      // RACE CONDITION FIX: Don't set authenticated until we have user data
      // The token effect hook will fetch user data and set isAuthenticated=true
      console.log('Token stored, awaiting user data fetch');
    } else {
      logAuthEvent("removingTokens");
      console.log('Removing tokens from localStorage');
      localStorage.removeItem('knowledge_plane_token');
      localStorage.removeItem('knowledge_plane_refresh_token');
      setAuthenticated(false);
    }
    
    // Debug check to confirm token was stored
    setTimeout(() => {
      const storedToken = localStorage.getItem('knowledge_plane_token');
      logAuthEvent(`tokenCheckAfterStore:${storedToken ? 'present' : 'missing'}`);
      console.log('Token in localStorage immediately after storing:', 
                  storedToken ? 'present (length ' + storedToken.length + ')' : 'missing');
    }, 10);
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
      localStorage.removeItem('knowledge_plane_refresh_token');
      setAuthenticated(false);
    } catch (error) {
      // Even if the backend call fails, clear the frontend state
      localStorage.removeItem('knowledge_plane_token');
      localStorage.removeItem('knowledge_plane_refresh_token');
      setAuthenticated(false);
    }
  };

  // Effect to check authentication and fetch user data
  useEffect(() => {
    logAuthEvent("useEffect-authCheck-starting");
    
    const checkAuthAndFetchUser = async () => {
      console.log('AuthContext useEffect running - checkAuthAndFetchUser()');
      logAuthEvent("checkAuthAndFetchUser-start");
      setIsLoading(true);
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('knowledge_plane_token');
      logAuthEvent(`tokenCheck:${token ? 'present' : 'missing'}`);
      console.log('Token in localStorage during auth check:', token ? 'present (length ' + token.length + ')' : 'missing');
      
      if (!token) {
        logAuthEvent("noToken-settingUnauthenticated");
        console.log('No token found, setting isAuthenticated to false');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if session is valid by requesting current user
        // Note: Fixed API path with proper /api/v1 prefix
        logAuthEvent("userDataRequest-starting");
        console.log(`Requesting user data from: ${API_BASE_URL}/api/v1/users/me with token`);
        console.log(`Authorization header: Bearer ${token.substring(0, 10)}...`);
        
        let response;
        try {
          // Create fetch request for better debugging than axios
          logAuthEvent("userDataFetch-attempt");
          
          // First try with basic fetch for debugging
          const fetchResponse = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          logAuthEvent(`fetchResponse-status:${fetchResponse.status}`);
          const responseText = await fetchResponse.text();
          logAuthEvent(`fetchResponse-body:${responseText.substring(0, 50)}...`);
          
          // Now continue with axios as before
          response = await axios.get<User>(`${API_BASE_URL}/api/v1/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          logAuthEvent(`axiosResponse-status:${response.status}`);
          console.log('API response successful:', response.status);
          
          console.log('User data API response:', response.status, response.data ? 'data present' : 'no data');
          console.log('User data details:', response.data);
          
          if (response.status === 200 && response.data) {
            logAuthEvent(`settingUserData:${response.data.email}`);
            console.log('Setting user data:', response.data);
            setUser(response.data); // Set the user data
            setIsAuthenticated(true);
            console.log('User authenticated successfully, user data set');
          } else {
            logAuthEvent("userDataResponse-notOK");
            console.log('User data response not OK, setting isAuthenticated to false');
            setUser(null); // Explicitly clear user
            setIsAuthenticated(false);
          }
        } catch (axiosError: any) {
          logAuthEvent(`userDataRequest-failed:${axiosError.message}`);
          console.error('API request failed:', axiosError.message);
          console.error('API response status:', axiosError.response?.status);
          console.error('API response data:', axiosError.response?.data);
          console.error('API request config:', JSON.stringify({
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: {
              ...axiosError.config?.headers,
              Authorization: 'Bearer [TOKEN_REDACTED]'
            }
          }));
          
          // Clear invalid token
          logAuthEvent("clearingTokenAfterError");
          console.log('API error, clearing token and setting authenticated to false');
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('knowledge_plane_token'); // RACE CONDITION FIX: Clear token on error
          throw axiosError;
        }
      } catch (error: any) {
        logAuthEvent(`errorInMainTryCatch:${error.message}`);
        console.error('Error fetching user data:', error.message, error.response?.status);
        setIsAuthenticated(false);
        setUser(null);
        // Clear invalid token
        console.log('Clearing invalid token from localStorage');
        localStorage.removeItem('knowledge_plane_token');
      } finally {
        logAuthEvent(`authCheckComplete:isAuth=${isAuthenticated},hasUser=${!!user}`);
        setIsLoading(false);
        console.log('Auth loading complete, isAuthenticated =', isAuthenticated);
      }
    };
    
    checkAuthAndFetchUser();
    
    // Set up an interval to periodically check token validity
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('knowledge_plane_token');
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            // If token is about to expire in the next 5 minutes, clear it
            if (payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
              console.log('Token is expired or about to expire, clearing');
              localStorage.removeItem('knowledge_plane_token');
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } catch (e) {
          console.error('Error checking token expiry:', e);
        }
      }
    }, 60000); // Check every minute
    
    // Clean up interval on unmount
    return () => clearInterval(checkInterval);
  }, []); // No dependencies to prevent unnecessary re-runs

  // Get current token from storage - always check localStorage directly to avoid stale state
  const token = localStorage.getItem('knowledge_plane_token');

  // Immediate user fetch on token change - critical fix for race condition
  useEffect(() => {
    const immediateUserFetch = async () => {
      logAuthEvent("immediateUserFetch-tokenChanged");
      
      // RACE CONDITION FIX: Always try to fetch user if token exists but no user
      // This is the critical fix - we fetch user whenever token changes OR when token
      // exists but user doesn't
      if (token) {
        logAuthEvent("immediateUserFetch-fetchingUser");
        
        // Ensure we mark loading state
        setIsLoading(true);
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            logAuthEvent(`immediateUserFetch-success:${userData.email}`);
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // If user fetch fails with a token present, clear auth state
            logAuthEvent(`immediateUserFetch-failedWithStatus:${response.status}`);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('knowledge_plane_token'); // Clear bad token
          }
        } catch (err) {
          logAuthEvent(`immediateUserFetch-failed:${err}`);
        } finally {
          setIsLoading(false);
        }
      } else if (!token && (user || isAuthenticated)) {
        // RACE CONDITION FIX: If token is gone but we still have user/auth state,
        // clear the auth state to maintain consistency
        logAuthEvent("tokenGoneButUserPresent-clearingState");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    
    immediateUserFetch();
  }, [token]); // This effect runs when token changes
  
  const contextValue = { 
    isAuthenticated, 
    setAuthenticated, 
    user, 
    isLoading,
    logout,
    setToken,
    token
  };

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