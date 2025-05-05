import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { LogLevel, logAuthEvent, analyzeJwtToken } from '../utils/authDebugger';

// Define User type (could import from a shared types file later)
export interface User {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  avatar_url?: string | null;
  team_id?: string | null;
  manager_id?: string | null;
  is_superuser?: boolean;
  is_admin?: boolean;
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
  authStatus: AuthStatus; // Add auth status for debugging
}

// Define status object to track auth state issues
export interface AuthStatus {
  lastAuthCheck: string | null;
  lastTokenRefresh: string | null;
  lastError: string | null;
  tokenStatus: {
    exists: boolean;
    valid?: boolean;
    expiresAt?: string;
    userId?: string;
    tenantId?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define API base URL
// IMPORTANT: this must be consistent with other files like api/client.ts
// API_BASE_URL should NOT include "/api/v1" as it's added in specific requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize auth status object for tracking and debugging
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    lastAuthCheck: null,
    lastTokenRefresh: null,
    lastError: null,
    tokenStatus: {
      exists: false
    }
  });
  
  // Update auth status with current token information
  const updateAuthStatus = (
    update: Partial<AuthStatus> = {}, 
    error: Error | null = null,
    token: string | null = null
  ) => {
    setAuthStatus(prev => {
      // Analyze token if provided
      const tokenAnalysis = token ? analyzeJwtToken(token) : null;
      
      // Build updated token status
      const tokenStatus = tokenAnalysis ? {
        exists: true,
        valid: tokenAnalysis.valid,
        expiresAt: tokenAnalysis.expiryDate,
        userId: tokenAnalysis.userId,
        tenantId: tokenAnalysis.tenantId
      } : token ? { exists: true } : { exists: false };
      
      return {
        ...prev,
        ...update,
        lastError: error ? error.message : prev.lastError,
        tokenStatus: tokenStatus
      };
    });
  };
  
  // Enhanced debug tracking for auth flow - disabled to prevent re-renders
  const logAuthContextEvent = (event: string, details?: Record<string, any>, level: LogLevel = LogLevel.INFO) => {
    // Disabled logging to prevent re-renders
    // logAuthEvent(level, "AuthContext", event, details);
    
    // Update last auth check timestamp if this is an auth check
    if (event.includes('auth') || event.includes('token')) {
      updateAuthStatus({
        lastAuthCheck: new Date().toISOString()
      });
    }
  };

  // Function to set authentication state
  const setAuthenticated = (value: boolean) => {
    console.log(`[LOOP DEBUG] setAuthenticated(${value}) called`);
    
    logAuthContextEvent(`setAuthenticated(${value})`, {
      previousValue: isAuthenticated,
      newValue: value
    });
    
    setIsAuthenticated(value);
    
    if (!value) {
      logAuthContextEvent("clearingUserAndToken", {
        hadUser: !!user,
        userId: user?.id,
        userName: user?.name
      });
      
      setUser(null);
      
      // Get token before removal for debugging
      const tokenBeforeRemoval = localStorage.getItem('knowledge_plane_token');
      const tokenStatus = tokenBeforeRemoval ? 
        `exists (${tokenBeforeRemoval.substring(0, 15)}...)` : 'none';
      
      console.log(`[LOOP DEBUG] Removing token in setAuthenticated(false): ${tokenStatus}`);
      
      logAuthContextEvent("removingToken", {
        tokenPresent: !!tokenBeforeRemoval,
        tokenLength: tokenBeforeRemoval?.length
      }, LogLevel.INFO);
      
      try {
        localStorage.removeItem('knowledge_plane_token');
        localStorage.removeItem('knowledge_plane_refresh_token');
        
        // LOOP FIX: Update token state directly to avoid second re-render
        setTokenState(null);
        
        // Verify token was removed
        const tokenAfterRemoval = localStorage.getItem('knowledge_plane_token');
        
        if (tokenAfterRemoval) {
          logAuthContextEvent("tokenRemovalFailed", {
            tokenStillPresent: true
          }, LogLevel.ERROR);
        } else {
          logAuthContextEvent("tokenRemovedSuccessfully", {}, LogLevel.INFO);
        }
        
        // Update auth status to reflect token removal
        updateAuthStatus({}, null, null);
        
      } catch (e) {
        logAuthContextEvent("tokenRemovalError", {
          error: (e as Error).message
        }, LogLevel.ERROR);
        
        updateAuthStatus({}, e as Error, null);
      }
    }
  };

  // Function to handle token storage
  const setToken = (accessToken: string | null, refreshToken: string | null) => {
    console.log(`[LOOP DEBUG] setToken called with accessToken length: ${accessToken?.length}`);
    
    logAuthContextEvent("setToken", {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length,
      hasRefreshToken: !!refreshToken
    });
    
    if (accessToken) {
      // First analyze the token
      const tokenAnalysis = analyzeJwtToken(accessToken);
      
      logAuthContextEvent("tokenAnalysis", {
        valid: tokenAnalysis.valid,
        userId: tokenAnalysis.userId,
        tenantId: tokenAnalysis.tenantId,
        expiresAt: tokenAnalysis.expiryDate,
        timeToExpire: tokenAnalysis.timeToExpire
      });
      
      // Update auth status with token details
      updateAuthStatus({
        lastTokenRefresh: new Date().toISOString()
      }, null, accessToken);
      
      // RACE CONDITION FIX: Set loading state BEFORE storing token
      logAuthContextEvent("settingLoadingBeforeTokenStorage");
      setIsLoading(true);
      
      // Storage diagnostic - check if we can use localStorage
      try {
        const testKey = 'auth_storage_test';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (testValue !== 'test') {
          logAuthContextEvent("localStorageMalfunction", {
            canWrite: true,
            canRead: false,
            testValue
          }, LogLevel.ERROR);
        }
      } catch (e) {
        logAuthContextEvent("localStorageUnavailable", {
          error: (e as Error).message
        }, LogLevel.ERROR);
        
        // Try to use sessionStorage as fallback
        try {
          sessionStorage.setItem('knowledge_plane_token', accessToken);
          if (refreshToken) {
            sessionStorage.setItem('knowledge_plane_refresh_token', refreshToken);
          }
          logAuthContextEvent("usingSessionStorageFallback", {}, LogLevel.WARN);
        } catch (e) {
          logAuthContextEvent("allStorageUnavailable", {
            error: (e as Error).message
          }, LogLevel.ERROR);
        }
      }
      
      // Store token with comprehensive error handling
      try {
        // Try to clear any existing token first
        localStorage.removeItem('knowledge_plane_token');
        
        // Store the new token
        localStorage.setItem('knowledge_plane_token', accessToken);
        
        if (refreshToken) {
          localStorage.setItem('knowledge_plane_refresh_token', refreshToken);
        }
        
        logAuthContextEvent("tokenStoredSuccessfully", {
          accessTokenLength: accessToken.length,
          refreshTokenPresent: !!refreshToken
        });
        
        // Verify token was properly stored
        const storedToken = localStorage.getItem('knowledge_plane_token');
        
        if (!storedToken) {
          logAuthContextEvent("tokenStorageVerificationFailed", {
            attempted: true,
            stored: false
          }, LogLevel.ERROR);
        } else if (storedToken !== accessToken) {
          logAuthContextEvent("tokenStorageMismatch", {
            attemptedLength: accessToken.length,
            storedLength: storedToken.length,
            match: false
          }, LogLevel.ERROR);
        }
        
        // LOOP FIX: Update our local state directly to avoid a second re-render cycle
        console.log('[LOOP DEBUG] Updating token state directly to avoid storage re-read');
        setTokenState(accessToken);
      } catch (e) {
        logAuthContextEvent("tokenStorageError", {
          error: (e as Error).message
        }, LogLevel.ERROR);
        
        updateAuthStatus({}, e as Error, null);
      }
      
      // Don't set authenticated flag - wait for user data to be fetched
      logAuthContextEvent("awaitingUserDataFetch");
    } else {
      // No token provided - clear authentication
      logAuthContextEvent("clearingTokensAndAuth", {
        reason: "null token provided to setToken"
      });
      
      try {
        localStorage.removeItem('knowledge_plane_token');
        localStorage.removeItem('knowledge_plane_refresh_token');
        
        // Update auth status
        updateAuthStatus({}, null, null);
        
        logAuthContextEvent("tokensRemovedSuccessfully");
        
        // LOOP FIX: Update our local state directly to avoid a second re-render cycle
        console.log('[LOOP DEBUG] Clearing token state directly');
        setTokenState(null);
      } catch (e) {
        logAuthContextEvent("tokenRemovalError", {
          error: (e as Error).message
        }, LogLevel.ERROR);
        
        updateAuthStatus({}, e as Error, null);
      }
      
      setAuthenticated(false);
    }
    
    // Verification with timeout to catch race conditions
    setTimeout(() => {
      const storedToken = localStorage.getItem('knowledge_plane_token');
      
      logAuthContextEvent("verifyingTokenStorage", {
        tokenPresent: !!storedToken,
        tokenLength: storedToken?.length,
        expectedPresent: !!accessToken
      });
      
      if (!!accessToken !== !!storedToken) {
        logAuthContextEvent("tokenStorageStateMismatch", {
          expected: !!accessToken,
          actual: !!storedToken
        }, LogLevel.ERROR);
        
        // If there's a mismatch, fix our state to match reality
        console.log('[LOOP DEBUG] Token storage mismatch detected - synchronizing state');
        setTokenState(storedToken);
      }
      
      // Update status one more time
      updateAuthStatus({}, null, storedToken);
    }, 50);
  };

  // Logout function - calls backend to clear cookies and removes token
  const logout = async () => {
    logAuthContextEvent("logoutRequested", {
      userId: user?.id,
      userName: user?.name,
      isAuthenticated
    });
    
    const token = localStorage.getItem('knowledge_plane_token');
    
    try {
      logAuthContextEvent("callingBackendLogout", {
        hasToken: !!token,
        endpoint: `${API_BASE_URL}/auth/logout`
      });
      
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      logAuthContextEvent("backendLogoutSuccess", {
        status: response.status
      });
    } catch (error) {
      logAuthContextEvent("backendLogoutError", {
        message: (error as Error).message,
        isAxiosError: axios.isAxiosError(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      }, LogLevel.ERROR);
    } finally {
      // Always clear frontend state regardless of backend result
      try {
        localStorage.removeItem('knowledge_plane_token');
        localStorage.removeItem('knowledge_plane_refresh_token');
        
        logAuthContextEvent("frontendLogoutComplete");
        
        // Update auth status
        updateAuthStatus({}, null, null);
      } catch (e) {
        logAuthContextEvent("frontendLogoutError", {
          error: (e as Error).message
        }, LogLevel.ERROR);
      }
      
      setAuthenticated(false);
    }
  };

  // Effect to check authentication and fetch user data
  useEffect(() => {
    logAuthContextEvent("useEffect-authCheck-starting");
    
    const checkAuthAndFetchUser = async () => {
      logAuthContextEvent("checkAuthAndFetchUser-start", {
        currentIsAuthenticated: isAuthenticated,
        currentHasUser: !!user
      });
      
      setIsLoading(true);
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('knowledge_plane_token');
      
      // Also check sessionStorage in case we had to use it as a fallback
      const sessionToken = sessionStorage.getItem('knowledge_plane_token');
      
      // Use token from localStorage, fallback to sessionStorage if needed
      const effectiveToken = token || sessionToken;
      
      // Log the token status
      logAuthContextEvent("tokenCheck", {
        localStorageToken: !!token,
        sessionStorageToken: !!sessionToken,
        effectiveTokenAvailable: !!effectiveToken,
        tokenLength: effectiveToken?.length
      });
      
      // If we're using sessionStorage as fallback, log a warning
      if (!token && sessionToken) {
        logAuthContextEvent("usingSessionStorageToken", {
          reason: "localStorage token not available"
        }, LogLevel.WARN);
      }
      
      // If token exists, analyze its contents
      if (effectiveToken) {
        // Use our token analyzer utility
        const tokenAnalysis = analyzeJwtToken(effectiveToken);
        
        logAuthContextEvent("existingTokenAnalysis", {
          valid: tokenAnalysis.valid,
          isExpired: tokenAnalysis.isExpired,
          expiresAt: tokenAnalysis.expiryDate,
          timeToExpire: tokenAnalysis.timeToExpire,
          userId: tokenAnalysis.userId,
          tenantId: tokenAnalysis.tenantId
        });
        
        // Update auth status with token info
        updateAuthStatus({
          lastAuthCheck: new Date().toISOString()
        }, null, effectiveToken);
        
        // If token is expired, clear it now
        if (tokenAnalysis.isExpired) {
          logAuthContextEvent("expiredTokenDetected", {
            expiredAt: tokenAnalysis.expiryDate,
            currentTime: new Date().toISOString()
          }, LogLevel.WARN);
          
          try {
            localStorage.removeItem('knowledge_plane_token');
            localStorage.removeItem('knowledge_plane_refresh_token');
            sessionStorage.removeItem('knowledge_plane_token');
            sessionStorage.removeItem('knowledge_plane_refresh_token');
            
            updateAuthStatus({
              lastError: "Token expired"
            }, null, null);
            
            logAuthContextEvent("expiredTokenCleared");
            
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          } catch (e) {
            logAuthContextEvent("errorClearingExpiredToken", {
              error: (e as Error).message
            }, LogLevel.ERROR);
          }
        }
      }
      
      // If no token exists, clear authentication state
      if (!effectiveToken) {
        logAuthContextEvent("noToken-settingUnauthenticated");
        
        updateAuthStatus({
          lastAuthCheck: new Date().toISOString()
        }, null, null);
        
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // At this point, we have a valid token - let's try to fetch the user data
      try {
        // First log the API request details
        logAuthContextEvent("userDataRequest-starting", {
          url: `${API_BASE_URL}/api/v1/users/me`,
          tokenPreview: effectiveToken.substring(0, 10) + '...'
        });
        
        // Use a performance mark to measure timing
        performance.mark('user-fetch-start');
        
        try {
          // Use built-in fetch first for diagnostics
          const fetchStartTime = performance.now();
          
          const fetchResponse = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${effectiveToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          const fetchTime = performance.now() - fetchStartTime;
          
          logAuthContextEvent("fetchResponseReceived", {
            status: fetchResponse.status,
            time: fetchTime,
            ok: fetchResponse.ok,
            statusText: fetchResponse.statusText,
            headers: Object.fromEntries([...fetchResponse.headers.entries()])
          });
          
          // Try to parse response for more diagnostic info if needed
          let responseData = null;
          try {
            const responseText = await fetchResponse.text();
            try {
              responseData = JSON.parse(responseText);
              
              if (!fetchResponse.ok) {
                logAuthContextEvent("fetchResponseError", {
                  status: fetchResponse.status,
                  data: responseData,
                  detail: responseData?.detail
                }, LogLevel.ERROR);
                
                // Update the auth status with the error
                updateAuthStatus({
                  lastError: responseData?.detail || `HTTP error ${fetchResponse.status}`
                }, null, effectiveToken);
              }
            } catch (parseError) {
              logAuthContextEvent("fetchResponseParseError", {
                error: (parseError as Error).message,
                responseText: responseText.substring(0, 100)
              }, LogLevel.ERROR);
            }
          } catch (textError) {
            logAuthContextEvent("fetchResponseReadError", {
              error: (textError as Error).message
            }, LogLevel.ERROR);
          }
          
          // If fetch response is not OK, early-out
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error ${fetchResponse.status}: ${fetchResponse.statusText}`);
          }
          
          // If fetch was successful, move on to axios for actual data parsing
          // This helps us diagnose whether the issue is with fetch or axios specifically
          const axiosStartTime = performance.now();
          
          const response = await axios.get<User>(`${API_BASE_URL}/api/v1/users/me`, {
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          const axiosTime = performance.now() - axiosStartTime;
          
          logAuthContextEvent("axiosResponseReceived", {
            status: response.status,
            time: axiosTime,
            dataPresent: !!response.data
          });
          
          performance.mark('user-fetch-end');
          performance.measure('user-fetch', 'user-fetch-start', 'user-fetch-end');
          const measure = performance.getEntriesByName('user-fetch')[0];
          
          // If we got a successful response with user data, update auth state
          if (response.status === 200 && response.data) {
            logAuthContextEvent("userDataLoaded", {
              email: response.data.email,
              userId: response.data.id,
              hasTeam: !!response.data.team_id,
              fetchTime: measure.duration
            });
            
            // Set user data and authenticate
            setUser(response.data);
            setIsAuthenticated(true);
            
            // Update auth status with successful fetch
            updateAuthStatus({
              lastAuthCheck: new Date().toISOString()
            }, null, effectiveToken);
          } else {
            logAuthContextEvent("userDataResponseEmpty", {
              status: response.status
            }, LogLevel.ERROR);
            
            setUser(null);
            setIsAuthenticated(false);
            
            // Update auth status with error
            updateAuthStatus({
              lastError: "Empty user data response"
            }, null, effectiveToken);
          }
        } catch (axiosError: any) {
          // Handle axios errors
          const isAxiosError = axios.isAxiosError(axiosError);
          
          logAuthContextEvent("userDataRequestFailed", {
            message: axiosError.message,
            isAxiosError,
            status: isAxiosError ? axiosError.response?.status : undefined,
            statusText: isAxiosError ? axiosError.response?.statusText : undefined,
            data: isAxiosError ? axiosError.response?.data : undefined
          }, LogLevel.ERROR);
          
          // Clear invalid token
          if (isAxiosError && axiosError.response?.status === 401) {
            logAuthContextEvent("clearingInvalidToken", {
              reason: "401 Unauthorized response"
            }, LogLevel.WARN);
            
            localStorage.removeItem('knowledge_plane_token');
            sessionStorage.removeItem('knowledge_plane_token');
            
            // Update auth status
            updateAuthStatus({
              lastError: "Invalid authentication token",
              tokenStatus: { exists: false }
            }, axiosError);
          }
          
          setIsAuthenticated(false);
          setUser(null);
          
          throw axiosError;
        }
      } catch (error: any) {
        // This is the outer catch for any other errors
        logAuthContextEvent("authCheckFailed", {
          message: error.message,
          name: error.name
        }, LogLevel.ERROR);
        
        // For connection errors to non-essential services like notifications or WebSockets,
        // don't invalidate the authentication - just log the error but keep the user logged in
        if (error.message && (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('notifications') ||
          error.message.includes('socket') ||
          error.message.includes('ai-proxy')
        )) {
          // These are non-critical endpoints, just log the error
          logAuthContextEvent("nonCriticalError", {
            message: error.message,
            action: "continuing with valid authentication"
          }, LogLevel.WARN);
          
          // Keep the authenticated state if we have a user and token
          if (user && token) {
            logAuthContextEvent("maintainingAuthenticationDespiteError", {
              userId: user.id,
              reason: "Error in non-critical service"
            });
            
            // Don't invalidate auth state for non-critical errors
            setIsLoading(false);
            return;
          }
        }
        
        // For critical errors, invalidate authentication
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear invalid token only for auth-related errors
        if (error.message && (
          error.message.includes('401') || 
          error.message.includes('auth') || 
          error.message.includes('token') || 
          error.message.includes('unauthorized')
        )) {
          logAuthContextEvent("clearingInvalidToken", {
            reason: "Auth-related error"
          });
          
          localStorage.removeItem('knowledge_plane_token');
          sessionStorage.removeItem('knowledge_plane_token');
          
          // Update auth status
          updateAuthStatus({
            lastError: error.message
          }, error as Error, null);
        }
      } finally {
        // Always complete the loading state
        logAuthContextEvent("authCheckCompleted", {
          isAuthenticated,
          hasUser: !!user,
          timeTaken: performance.getEntriesByName('user-fetch')[0]?.duration
        });
        
        setIsLoading(false);
        performance.clearMarks();
        performance.clearMeasures();
      }
    };
    
    checkAuthAndFetchUser();
    
    // Set up an interval to periodically check token validity
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('knowledge_plane_token') || 
                    sessionStorage.getItem('knowledge_plane_token');
      
      if (token) {
        const tokenAnalysis = analyzeJwtToken(token);
        
        if (tokenAnalysis.timeToExpire && tokenAnalysis.timeToExpire < 300) {  // Less than 5 minutes
          logAuthContextEvent("tokenExpiryWarning", {
            expiresAt: tokenAnalysis.expiryDate,
            timeToExpire: tokenAnalysis.timeToExpire,
            userId: tokenAnalysis.userId
          }, LogLevel.WARN);
          
          if (tokenAnalysis.isExpired) {
            logAuthContextEvent("expiredTokenDetected-interval", {
              action: "clearing_token"
            });
            
            localStorage.removeItem('knowledge_plane_token');
            sessionStorage.removeItem('knowledge_plane_token');
            setIsAuthenticated(false);
            setUser(null);
            
            // Update auth status
            updateAuthStatus({
              lastError: "Token expired during session"
            }, null, null);
          }
        }
      }
    }, 60000); // Check every minute
    
    // Clean up interval on unmount
    return () => {
      logAuthContextEvent("authCheckIntervalCleanup");
      clearInterval(checkInterval);
    };
  }, []); // No dependencies to prevent unnecessary re-runs

  // Get current token from storage - checking both localStorage and sessionStorage
  // We'll use React state for the token instead of re-reading from storage on each render
  // This helps prevent unnecessary token state updates and potential infinite loops
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem('knowledge_plane_token') || 
    sessionStorage.getItem('knowledge_plane_token') || 
    null
  );
  
  // Effect to update token state when localStorage changes (e.g. from other tabs)
  useEffect(() => {
    // Function to read token from storage
    const getTokenFromStorage = () => {
      return localStorage.getItem('knowledge_plane_token') || 
             sessionStorage.getItem('knowledge_plane_token') || 
             null;
    };
    
    // Function to handle storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'knowledge_plane_token') {
        const newToken = getTokenFromStorage();
        console.log('[LOOP DEBUG] Storage event detected - token changed externally');
        setTokenState(newToken);
      }
    };
    
    // Listen for storage events (changes from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Immediate user fetch on token change - critical fix for race condition
  useEffect(() => {
    // Use a stable counter that won't be reset between component renders
    if (typeof window.__tokenEffectCounter === 'undefined') {
      window.__tokenEffectCounter = 0;
    }
    window.__tokenEffectCounter++;
    
    // Use localStorage to track if we've already attempted a fetch with this token
    // to prevent infinite loops when clearing browser cache doesn't reset this state
    const getTokenLoopKey = (token: string | null) => {
      return token ? `token_fetch_${token.substring(0, 8)}` : 'token_fetch_none';
    };
    
    // Check if we've already attempted to fetch data with this exact token
    const currentTokenKey = getTokenLoopKey(token);
    const lastFetchTime = localStorage.getItem(currentTokenKey);
    const now = Date.now();
    const recentFetchTimeThreshold = 2000; // ms
    
    // If we've very recently tried to fetch with this same token, prevent infinite loop
    if (lastFetchTime && (now - parseInt(lastFetchTime)) < recentFetchTimeThreshold) {
      console.log(`[LOOP PREVENTION] Skipping duplicate fetch for token - last attempt was ${now - parseInt(lastFetchTime)}ms ago`);
      return; // Exit early to prevent infinite loop
    }
    
    // Record that we're attempting a fetch with this token
    if (token) {
      localStorage.setItem(currentTokenKey, now.toString());
    }
    
    // Clean up old token fetch tracking entries (keep only recent ones)
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('token_fetch_') && key !== currentTokenKey) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Error cleaning token fetch tracking:", e);
    }
    
    const immediateUserFetch = async () => {
      const effectId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      
      if (token) {
        // First, analyze the token to check if it's valid
        const tokenAnalysis = analyzeJwtToken(token);
        
        // If token is expired, clear it
        if (tokenAnalysis.isExpired) {
          localStorage.removeItem('knowledge_plane_token');
          sessionStorage.removeItem('knowledge_plane_token');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          
          updateAuthStatus({
            lastError: "Token expired during fetch"
          }, null, null);
          
          return;
        }
        
        // Check if we've been looping too many times - possible infinite loop protection
        if (window.__tokenEffectCounter > 5) {
          console.warn(`[LOOP PREVENTION] Potential infinite loop detected! Counter: ${window.__tokenEffectCounter}`);
          console.warn('[LOOP PREVENTION] Breaking potential infinite loop. Will not fetch user data.');
          
          // Skip user fetch in potential loop scenario but maintain auth state
          // Don't update any state to break the potential loop
          return;
        }
        
        // Ensure we mark loading state
        setIsLoading(true);
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            // Add cache busting parameter to prevent browser cache issues
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            // Check if we already have this same user - prevent unnecessary state updates
            if (user?.id === userData.id) {
              console.log(`[LOOP DEBUG] User data unchanged, skipping state update`);
            } else {
              setUser(userData);
              setIsAuthenticated(true);
            }
            
            // Update auth status with successful fetch
            updateAuthStatus({
              lastAuthCheck: new Date().toISOString()
            }, null, token);
          } else {
            // Clear auth state on auth error
            setIsAuthenticated(false);
            setUser(null);
            
            // Only clear token for auth-related errors
            if (response.status === 401 || response.status === 403) {
              localStorage.removeItem('knowledge_plane_token');
              sessionStorage.removeItem('knowledge_plane_token');
              
              // Update auth status
              updateAuthStatus({
                lastError: `Authentication failed: HTTP ${response.status}`
              }, null, null);
            } else {
              // For other errors, keep token but update error status
              updateAuthStatus({
                lastError: `User fetch failed: HTTP ${response.status}`
              }, null, token);
            }
          }
        } catch (err) {
          // Update auth status with error
          updateAuthStatus({
            lastError: (err as Error).message
          }, err as Error, token);
        } finally {
          setIsLoading(false);
        }
      } else if (!token && (user || isAuthenticated)) {
        // Token is gone but we still have user/auth state - clear it
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        
        // Update auth status
        updateAuthStatus({
          lastError: "Token disappeared while user was logged in"
        }, null, null);
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
    token,
    authStatus  // Added auth status for debugging
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