import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext'; 
import { Center, Spinner, VStack, Text, Box, Code, useColorModeValue } from '@chakra-ui/react'; 
import { LogLevel, logAuthEvent, analyzeJwtToken } from '../../utils/authDebugger';

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow wrapping specific components like MainLayout
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Auth context values
  const { user, isLoading, isAuthenticated, token, authStatus } = useAuth();
  const location = useLocation();

  // Track if we've already attempted a reload for persistent race conditions
  const [reloadAttempted, setReloadAttempted] = React.useState<boolean>(false);
  
  // Record routing decision events for analysis (disabled to prevent re-renders)
  const [routingEvents, setRoutingEvents] = React.useState<Array<{ 
    time: string; 
    event: string; 
    details?: Record<string, any>;
  }>>([]);
  
  // Add a routing event to the log - NOOP to prevent re-renders
  const logRoutingEvent = (event: string, details?: Record<string, any>) => {
    // Disabled to prevent re-renders
    // Log directly to console only in development if needed
    if (process.env.NODE_ENV === 'development') {
      // console.log(`[ProtectedRoute] ${event}`, details);
    }
    
    // Do not update state to prevent re-renders
    // setRoutingEvents(prev => [...prev, { time: new Date().toISOString(), event, details }].slice(-10));
  };

  // Check all storage locations for tokens - move inside a useEffect
  const [effectiveToken, setEffectiveToken] = React.useState<string | null>(null);
  const [tokenAnalysis, setTokenAnalysis] = React.useState<any>(null);
  
  // Use a ref for checking if a log event was already sent
  const logSentRef = React.useRef<{[key: string]: boolean}>({});
  
  React.useEffect(() => {
    const localStorageToken = localStorage.getItem('knowledge_plane_token');
    const sessionStorageToken = sessionStorage.getItem('knowledge_plane_token');
    const currentEffectiveToken = localStorageToken || sessionStorageToken;
    
    setEffectiveToken(currentEffectiveToken);
    
    // Disabled to prevent re-renders
    // const logKey = `${location.pathname}-${isLoading}-${!!user}-${isAuthenticated}-${!!token}`;
    
    // Only log if we haven't recently logged this exact state
    // if (!logSentRef.current[logKey]) {
    //   // Log comprehensive debug info
    //   logAuthEvent(LogLevel.INFO, "ProtectedRoute", "routeCheck", {
    //     path: location.pathname,
    //     isLoading,
    //     hasUser: !!user,
    //     isAuthenticated,
    //     hasToken: !!token,
    //     localStorageToken: !!localStorageToken,
    //     sessionStorageToken: !!sessionStorageToken,
    //     authStatus: {
    //       lastAuthCheck: authStatus.lastAuthCheck,
    //       lastError: authStatus.lastError,
    //       tokenValid: authStatus.tokenStatus.valid
    //     }
    //   });
      
    //   // Mark this state as logged
    //   logSentRef.current[logKey] = true;
      
    //   // Clear old entries from the ref to prevent memory leaks
    //   const keys = Object.keys(logSentRef.current);
    //   if (keys.length > 20) { // Keep only last 20 states
    //     const oldestKey = keys[0];
    //     delete logSentRef.current[oldestKey];
    //   }
    // }
    
    // Analyze token in detail
    if (currentEffectiveToken) {
      const analysis = analyzeJwtToken(currentEffectiveToken);
      setTokenAnalysis(analysis);
    } else {
      setTokenAnalysis(null);
    }
  }, [location.pathname, isLoading, user, isAuthenticated, token, authStatus]);
  
  // Track reload attempts in localStorage to prevent reload loops across page refreshes
  React.useEffect(() => {
    // Use localStorage to track reload attempts persistently
    const reloadAttemptTime = localStorage.getItem('auth_reload_attempt_time');
    const now = Date.now();
    const reloadThreshold = 10000; // 10 seconds
    
    if (tokenAnalysis) {
      // Handle edge case: valid token but no user data
      if (tokenAnalysis.valid && !tokenAnalysis.isExpired && !user) {
        // Only reload if we haven't recently attempted a reload (either in this session or previous)
        if (!isLoading && !reloadAttempted && 
            (!reloadAttemptTime || (now - parseInt(reloadAttemptTime)) > reloadThreshold)) {
          
          // Set both session state and persistent localStorage state
          setReloadAttempted(true);
          localStorage.setItem('auth_reload_attempt_time', now.toString());
          
          // Add a random delay to prevent synchronized reload loops (0-500ms)
          const randomDelay = Math.floor(Math.random() * 500);
          
          setTimeout(() => {
            // Double-check that we still need to reload
            if (!user && (localStorage.getItem('knowledge_plane_token') || sessionStorage.getItem('knowledge_plane_token'))) {
              console.log("[AUTH] Attempting page reload to recover user session");
              // Add cache busting parameter to the URL
              window.location.href = window.location.pathname + '?reload=' + Date.now();
            }
          }, 2000 + randomDelay);
        }
      } else {
        // If conditions don't match, clear the reload attempt time
        localStorage.removeItem('auth_reload_attempt_time');
      }
    }
  }, [tokenAnalysis, user, isLoading, reloadAttempted]);

  // Handle loading state
  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4} maxW="90%" w="400px">
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text>Loading user data...</Text>
          
          {tokenAnalysis?.valid && (
            <Text fontSize="sm" color="gray.500">
              Token valid for {tokenAnalysis.timeToExpire ? Math.floor(tokenAnalysis.timeToExpire / 60) : 0} more minutes
            </Text>
          )}
          
          {/* Add a debug box with auth status */}
          <Box 
            p={3} 
            bg={useColorModeValue('gray.100', 'gray.700')} 
            borderRadius="md" 
            fontSize="xs" 
            mt={4} 
            maxW="100%" 
            overflow="auto"
          >
            <Text fontWeight="bold">Auth Debug Info:</Text>
            <Text mt={1}>Last Check: {authStatus.lastAuthCheck ? new Date(authStatus.lastAuthCheck).toLocaleTimeString() : 'None'}</Text>
            {authStatus.lastError && (
              <Text color="red.500">Error: {authStatus.lastError}</Text>
            )}
          </Box>
        </VStack>
      </Center>
    );
  }

  // Special case: valid token exists but no user data yet
  // This is the race condition we're fixing
  if (effectiveToken && !user && !isLoading) {
    // Check if token is expired
    if (tokenAnalysis?.isExpired) {
      // Clean up any tokens
      localStorage.removeItem('knowledge_plane_token');
      sessionStorage.removeItem('knowledge_plane_token');
      
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Show enhanced loading spinner while we wait for auth to complete
    return (
      <Center h="100vh">
        <VStack spacing={4} maxW="90%" w="450px">
          <Spinner size="xl" colorScheme="blue" thickness="4px" />
          <Text fontWeight="medium">Verifying authentication...</Text>
          
          {tokenAnalysis?.valid && (
            <VStack spacing={1}>
              <Text fontSize="sm">Valid token found</Text>
              <Text fontSize="sm" color="gray.500">
                Token expires in {tokenAnalysis.timeToExpire ? Math.floor(tokenAnalysis.timeToExpire / 60) : 0} minutes
              </Text>
              <Text fontSize="xs" color="orange.500" mt={2}>
                {reloadAttempted ? "Reload attempted, still recovering..." : "User data synchronizing..."}
              </Text>
            </VStack>
          )}
          
          {/* Simplified debug info - removed dynamic events list to prevent re-renders */}
          <Box 
            p={3} 
            bg={useColorModeValue('gray.100', 'gray.700')} 
            borderRadius="md" 
            fontSize="xs" 
            mt={4} 
            maxW="100%"
            overflow="auto"
          >
            <Text fontWeight="bold">Auth Status:</Text>
            <Text my={1}>Verifying authentication...</Text>
            {tokenAnalysis?.valid && (
              <Text my={1} color="green.500">Valid token detected</Text>
            )}
          </Box>
        </VStack>
      </Center>
    );
  }

  // No user after loading is complete
  if (!user) {
    // Removed logging to prevent re-renders
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated - removed logging to prevent re-renders
  
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;