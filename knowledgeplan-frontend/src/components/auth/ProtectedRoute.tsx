import React from 'react';
// Restore Navigate, useLocation
import { Navigate, Outlet, useLocation } from 'react-router-dom'; 
// Revert to relative path after restart
import { useAuth } from '../../context/AuthContext'; 
// Restore Center, Spinner imports
import { Center, Spinner } from '@chakra-ui/react'; 

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow wrapping specific components like MainLayout
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Uncomment auth logic
  const { user, isLoading } = useAuth();
  const location = useLocation(); // Uncomment location

  console.log(`[ProtectedRoute] Check: isLoading: ${isLoading}, user: ${!!user}`); // Add clearer log

  // Uncomment isLoading check
  if (isLoading) {
    console.log(`[ProtectedRoute] Showing Loading Spinner`);
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Uncomment user check
  if (!user) {
    console.log(`[ProtectedRoute] No user found after load, redirecting to /login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children/Outlet
  console.log(`[ProtectedRoute] User authenticated, rendering children/outlet`);
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 