import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { tokenManager } from './TokenManager';
import { Box, Spinner, Center, Text, VStack, useColorModeValue } from '@chakra-ui/react';

interface ProtectedRouteProps {
  redirectTo?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectTo = '/login',
  children
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Track if we've already attempted a reload for persistent race conditions
  const [reloadAttempted, setReloadAttempted] = React.useState<boolean>(false);
  
  // Check token from TokenManager
  const [tokenAnalysis, setTokenAnalysis] = React.useState<any>(null);
  
  React.useEffect(() => {
    const token = tokenManager.getToken();
    
    // Simplified token check
    if (token) {
      try {
        // Just check if token has the expected format
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          
          // Basic check - does it have an expiry?
          const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
          const now = new Date();
          const isExpired = expiresAt ? expiresAt < now : true;
          const timeToExpire = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : 0;
          
          setTokenAnalysis({
            valid: !isExpired && !!payload.sub,
            isExpired,
            timeToExpire,
            userId: payload.sub || null,
            expiryDate: expiresAt?.toISOString()
          });
        } else {
          setTokenAnalysis(null);
        }
      } catch (e) {
        console.error("Error parsing token:", e);
        setTokenAnalysis(null);
      }
    } else {
      setTokenAnalysis(null);
    }
  }, [location.pathname, isLoading, user, isAuthenticated]);
  
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
            if (!user && tokenManager.hasToken()) {
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
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text>Loading user data...</Text>
          
          {tokenAnalysis?.valid && (
            <Text fontSize="sm" color="gray.500">
              Token valid for {tokenAnalysis.timeToExpire ? Math.floor(tokenAnalysis.timeToExpire / 60) : 0} more minutes
            </Text>
          )}
        </VStack>
      </Center>
    );
  }
  
  // Special case: valid token exists but no user data yet
  // This is the race condition we're fixing
  const token = tokenManager.getToken();
  if (token && !user && !isLoading) {
    // Check if token is expired
    if (tokenAnalysis?.isExpired) {
      // Clean up any tokens
      tokenManager.removeToken();
      
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
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
  
  // Redirect to login if not authenticated or no user
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Render child routes or children if authenticated
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;