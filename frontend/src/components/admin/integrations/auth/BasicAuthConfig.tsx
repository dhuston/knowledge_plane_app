/**
 * BasicAuthConfig.tsx
 * Component for configuring basic authentication for integrations
 */
import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  Box,
  Divider,
  Alert,
  AlertIcon,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Code,
  Switch,
  FormControlLabel,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { BasicAuthCredentialConfig } from '../models/IntegrationModels';
import { useApiClient } from '../../../../hooks/useApiClient';

interface BasicAuthConfigProps {
  /**
   * Integration ID
   */
  integrationId: string;
  
  /**
   * Initial credential configuration
   */
  initialConfig?: Partial<BasicAuthCredentialConfig>;
  
  /**
   * Callback when configuration is updated
   */
  onConfigChange: (config: BasicAuthCredentialConfig) => void;
  
  /**
   * Whether the form is being submitted
   */
  isSubmitting?: boolean;
  
  /**
   * Callback when auth flow is completed
   */
  onAuthComplete?: (success: boolean) => void;
}

/**
 * Component for configuring basic authentication for integrations
 */
const BasicAuthConfig: React.FC<BasicAuthConfigProps> = ({
  integrationId,
  initialConfig,
  onConfigChange,
  isSubmitting = false,
  onAuthComplete,
}) => {
  // State for configuration
  const [config, setConfig] = useState<Partial<BasicAuthCredentialConfig>>({
    type: 'basic_auth',
    username: '',
    password: '',
    ...initialConfig,
  });
  
  // State for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for authentication status
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success' | 'error'>('none');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // State for showing/hiding password
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // API client
  const apiClient = useApiClient();
  
  // Toast notifications
  const toast = useToast();
  
  // Update parent component with new config whenever it changes
  useEffect(() => {
    // Only notify if all required fields are filled
    if (config.username && config.password) {
      const updatedConfig: BasicAuthCredentialConfig = {
        type: 'basic_auth',
        username: config.username,
        password: config.password,
      };
      
      onConfigChange(updatedConfig);
    }
  }, [config, onConfigChange]);
  
  // Validates the form and returns true if valid
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Username is required
    if (!config.username) {
      newErrors.username = 'Username is required';
    }
    
    // Password is required
    if (!config.password) {
      newErrors.password = 'Password is required';
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Toggle showing/hiding password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  // Test the basic auth connection
  const testConnection = async () => {
    // Validate form first
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setAuthStatus('pending');
      setAuthError(null);
      
      // Prepare basic auth configuration
      const authConfig = {
        type: 'basic_auth',
        username: config.username,
        password: config.password,
      };
      
      // Test the connection using the API
      const response = await apiClient.post(`/api/v1/integrations/${integrationId}/test-auth`, authConfig);
      
      // Check if auth was successful
      if (response.data.status === 'success') {
        setAuthStatus('success');
        
        toast({
          title: 'Connection Successful',
          description: 'Basic authentication is valid.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Notify parent
        if (onAuthComplete) {
          onAuthComplete(true);
        }
      } else {
        setAuthStatus('error');
        setAuthError(response.data.message || 'Authentication failed');
        
        toast({
          title: 'Connection Failed',
          description: response.data.message || 'Basic authentication failed.',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
        
        // Notify parent
        if (onAuthComplete) {
          onAuthComplete(false);
        }
      }
    } catch (err: any) {
      console.error('Basic auth test error:', err);
      setAuthStatus('error');
      setAuthError(err.message || 'An error occurred during authentication');
      
      toast({
        title: 'Connection Error',
        description: err.message || 'An error occurred while testing the connection.',
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
      
      // Notify parent
      if (onAuthComplete) {
        onAuthComplete(false);
      }
    }
  };
  
  // Calculate encoded value for Basic Auth header
  const getEncodedCredentials = () => {
    try {
      if (config.username && config.password) {
        return btoa(`${config.username}:${config.password}`);
      }
      return 'dXNlcm5hbWU6cGFzc3dvcmQ='; // username:password encoded
    } catch (err) {
      // Fall back to dummy value if btoa is not available (SSR)
      return 'dXNlcm5hbWU6cGFzc3dvcmQ=';
    }
  };
  
  return (
    <VStack spacing={6} align="stretch">
      {/* Authentication status alerts */}
      {authStatus === 'success' && (
        <Alert status="success" variant="subtle" borderRadius="md">
          <AlertIcon as={FiCheckCircle} />
          Basic authentication successful.
        </Alert>
      )}
      
      {authStatus === 'error' && (
        <Alert status="error" variant="subtle" borderRadius="md">
          <AlertIcon as={FiAlertCircle} />
          {authError || 'Authentication failed. Please check your credentials.'}
        </Alert>
      )}
      
      {/* Username */}
      <FormControl isRequired isInvalid={!!errors.username}>
        <FormLabel>Username</FormLabel>
        <Input
          name="username"
          value={config.username || ''}
          onChange={handleInputChange}
          placeholder="Enter username"
          disabled={isSubmitting || authStatus === 'pending'}
        />
        {errors.username ? (
          <FormErrorMessage>{errors.username}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The username for basic authentication
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Password */}
      <FormControl isRequired isInvalid={!!errors.password}>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            name="password"
            value={config.password || ''}
            onChange={handleInputChange}
            placeholder="Enter password"
            type={showPassword ? 'text' : 'password'}
            disabled={isSubmitting || authStatus === 'pending'}
          />
          <InputRightElement>
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              icon={showPassword ? <FiEyeOff /> : <FiEye />}
              variant="ghost"
              onClick={toggleShowPassword}
              size="sm"
            />
          </InputRightElement>
        </InputGroup>
        {errors.password ? (
          <FormErrorMessage>{errors.password}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The password for basic authentication
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Action buttons */}
      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button
          colorScheme="blue"
          onClick={testConnection}
          isLoading={isSubmitting || authStatus === 'pending'}
          leftIcon={authStatus === 'success' ? <FiCheckCircle /> : undefined}
        >
          {authStatus === 'success' ? 'Verified' : 'Test Connection'}
        </Button>
      </Box>
      
      {/* Additional help information */}
      <Box mt={4} p={4} borderRadius="md" bg="gray.50">
        <Text fontWeight="medium" mb={2}>Basic Authentication</Text>
        <Text fontSize="sm" mb={3}>
          Basic authentication sends your credentials with each request using the
          HTTP Authorization header. The username and password are combined with a
          colon, encoded in base64, and prefixed with "Basic ".
        </Text>
        <Divider my={3} />
        <Box fontSize="sm">
          <Text fontWeight="medium" mb={1}>Example HTTP Request:</Text>
          <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
            {`GET /api/data HTTP/1.1
Host: example.com
Authorization: Basic ${getEncodedCredentials()}`}
          </Code>
        </Box>
        <Box mt={4} fontSize="sm">
          <Text fontWeight="medium" color="orange.500" mb={2}>Security Note:</Text>
          <Text>
            Basic authentication sends credentials in an easily decoded format.
            We recommend using HTTPS/SSL to ensure credentials are encrypted during transit.
          </Text>
        </Box>
      </Box>
    </VStack>
  );
};

export default BasicAuthConfig;