import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Divider,
  Select,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthContext';

interface TenantOption {
  id: string;
  name: string;
  description: string;
}

// Demo tenants - these would typically come from an API
const DEMO_TENANTS: TenantOption[] = [
  { 
    id: '1', 
    name: 'Pharma AI Demo', 
    description: 'Pharmaceutical research organization'
  },
  { 
    id: '2', 
    name: 'Tech Innovations Inc.', 
    description: 'Technology software company'
  },
  { 
    id: '3', 
    name: 'Metropolitan Health System', 
    description: 'Healthcare provider network'
  },
  { 
    id: '4', 
    name: 'Global Financial Group', 
    description: 'Financial services organization'
  },
  { 
    id: '5', 
    name: 'Advanced Manufacturing Corp', 
    description: 'Industrial manufacturing'
  },
  { 
    id: '6', 
    name: 'University Research Alliance', 
    description: 'Academic research institution'
  }
];

export const SimplifiedLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, demoLogin, isAuthenticated, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Update error from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await login(email, password);
      // Navigation will happen in the useEffect above
    } catch (err) {
      console.error('Login submission error:', err);
      // Error is already set by the auth context
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenantId) {
      setError('Please select a demo environment');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await demoLogin(selectedTenantId);
      // Navigation will happen in the useEffect above
    } catch (err) {
      console.error('Demo login submission error:', err);
      // Error is already set by the auth context
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <Heading textAlign="center">Login</Heading>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab>Standard Login</Tab>
            <Tab>Demo Login</Tab>
          </TabList>
          
          <TabPanels>
            {/* Standard Login Panel */}
            <TabPanel>
              <form onSubmit={handleStandardLogin}>
                <VStack spacing={4}>
                  <FormControl id="email" isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>
                  
                  <FormControl id="password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={submitting && !selectedTenantId}
                    loadingText="Logging in..."
                  >
                    Login
                  </Button>
                </VStack>
              </form>
            </TabPanel>
            
            {/* Demo Login Panel */}
            <TabPanel>
              <form onSubmit={handleDemoLogin}>
                <VStack spacing={4}>
                  <FormControl id="tenant" isRequired>
                    <FormLabel>Select Demo Environment</FormLabel>
                    <Select
                      placeholder="Choose a demo environment"
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                    >
                      {DEMO_TENANTS.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </Select>
                    
                    {selectedTenantId && (
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        {DEMO_TENANTS.find(t => t.id === selectedTenantId)?.description}
                      </Text>
                    )}
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="green"
                    width="100%"
                    isLoading={submitting && !!selectedTenantId}
                    loadingText="Entering Demo..."
                  >
                    Enter Demo
                  </Button>
                  
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    Demo environments use pre-configured data for demonstration purposes.
                  </Text>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Divider />
        
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Don't have an account? Contact your administrator.
        </Text>
      </VStack>
    </Box>
  );
};