import React from 'react';
// Restore Navigate, useLocation
import { Navigate, Outlet, useLocation } from 'react-router-dom'; 
// Revert to relative path after restart
import { useAuth } from '../../context/AuthContext'; 
// Restore Center, Spinner imports
import { Center, Spinner, VStack, Text } from '@chakra-ui/react'; 

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow wrapping specific components like MainLayout
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Auth context values
  const { user, isLoading, isAuthenticated, token } = useAuth();
  const location = useLocation();

  // Track if we've already attempted a reload for persistent race conditions
  const [reloadAttempted, setReloadAttempted] = React.useState<boolean>(false);

  // Check localStorage directly for debugging
  const localStorageToken = localStorage.getItem('knowledge_plane_token');
  
  // Logging for debugging
  console.log(`[ProtectedRoute] Check: isLoading: ${isLoading}, user: ${!!user}, isAuthenticated: ${isAuthenticated}, token exists: ${!!token}`);
  console.log(`[ProtectedRoute] localStorage token:`, localStorageToken ? `present (${localStorageToken.substring(0, 20)}...)` : "missing");
  console.log(`[ProtectedRoute] User object:`, user ? JSON.stringify(user).substring(0, 100) + '...' : 'null');
  
  // Detailed token validation
  let tokenData: {
    isValid: boolean;
    isExpired: boolean;
    userId?: string;
    tenantId?: string;
    expiryDate?: Date;
    timeRemaining?: number;
  } = { isValid: false, isExpired: true };

  // Validate token and extract details if present
  if (localStorageToken) {
    try {
      // Simple JWT payload extract (not validation)
      const tokenParts = localStorageToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('[ProtectedRoute] Token payload:', payload);
        console.log('[ProtectedRoute] Token sub (user id):', payload.sub);
        console.log('[ProtectedRoute] Token tenant_id:', payload.tenant_id);
        console.log('[ProtectedRoute] Token expiry:', new Date(payload.exp * 1000).toISOString());
        console.log('[ProtectedRoute] Current time:', new Date().toISOString());
        
        const expiryTime = payload.exp * 1000;
        const isExpired = expiryTime < Date.now();
        console.log('[ProtectedRoute] Token expired:', isExpired);
        
        tokenData = {
          isValid: true,
          isExpired,
          userId: payload.sub,
          tenantId: payload.tenant_id,
          expiryDate: new Date(expiryTime),
          timeRemaining: Math.floor((expiryTime - Date.now()) / 1000 / 60) // minutes
        };
        
        // If token is valid but user is null, this is our problem case
        if (!isExpired && !user) {
          console.error('[ProtectedRoute] CRITICAL ISSUE: Valid token but no user object - this is our bug');
          console.error('[ProtectedRoute] This confirms a race condition or API error');
          
          // Set up page reload if we haven't tried already and not in loading state
          if (!isLoading && !reloadAttempted) {
            console.log('[ProtectedRoute] Setting up emergency page reload in 3 seconds');
            setTimeout(() => {
              // Only reload if we still have no user but valid token
              if (!user && localStorage.getItem('knowledge_plane_token')) {
                console.log('[ProtectedRoute] Emergency page reload triggered');
                setReloadAttempted(true);
                window.location.reload();
              }
            }, 3000);
          }
        }
      }
    } catch (e) {
      console.error('[ProtectedRoute] Error decoding token:', e);
    }
  }

  // Handle loading state
  if (isLoading) {
    console.log(`[ProtectedRoute] Showing Loading Spinner`);
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading user data...</Text>
          {tokenData.isValid && (
            <Text fontSize="sm" color="gray.500">
              Token valid for {tokenData.timeRemaining} more minutes
            </Text>
          )}
        </VStack>
      </Center>
    );
  }

  // Special case: valid token exists but no user data yet
  // This is the race condition we're fixing
  if (localStorageToken && !user && !isLoading) {
    console.log(`[ProtectedRoute] We have a token but no user, waiting for auth context to catch up`);
    
    // Check if token is expired
    if (tokenData.isValid && tokenData.isExpired) {
      console.log('[ProtectedRoute] Token expired, clearing and redirecting to login');
      localStorage.removeItem('knowledge_plane_token');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Show enhanced loading spinner while we wait for auth to complete
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" colorScheme="blue" />
          <Text fontWeight="medium">Verifying authentication...</Text>
          {tokenData.isValid && (
            <VStack spacing={1}>
              <Text fontSize="sm">Valid token found</Text>
              <Text fontSize="sm" color="gray.500">
                Token expires in {tokenData.timeRemaining} minutes
              </Text>
              <Text fontSize="xs" color="orange.500" mt={2}>
                {reloadAttempted ? "Reload attempted, still recovering..." : "User data synchronizing..."}
              </Text>
            </VStack>
          )}
        </VStack>
      </Center>
    );
  }

  // No user after loading is complete
  if (!user) {
    console.log(`[ProtectedRoute] No user found after load, redirecting to /login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children/Outlet
  console.log(`[ProtectedRoute] User authenticated, rendering children/outlet`);
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;