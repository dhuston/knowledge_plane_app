import React, { ReactNode } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock auth context 
export interface MockAuthContextProps {
  isAuthenticated?: boolean;
  user?: any;
  isLoading?: boolean;
  children: ReactNode;
}

export const MockAuthProvider: React.FC<MockAuthContextProps> = ({ 
  isAuthenticated = false,
  user = null,
  isLoading = false,
  children 
}) => {
  // Create a wrapper that provides preset values
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// All providers used in the app
export const AllProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider>
      <MemoryRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </ChakraProvider>
  );
};

// Route providers for navigation testing
export const RouteProviders: React.FC<{ 
  children: ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}> = ({ 
  children,
  initialEntries = ['/'],
  initialIndex = 0
}) => {
  return (
    <ChakraProvider>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </ChakraProvider>
  );
};

// Render with specific route
export const WithRoute: React.FC<{
  component: ReactNode;
  path?: string;
}> = ({
  component,
  path = '/'
}) => (
  <ChakraProvider>
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={component} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  </ChakraProvider>
);