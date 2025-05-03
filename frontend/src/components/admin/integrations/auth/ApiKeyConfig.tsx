/**
 * ApiKeyConfig.tsx
 * Component for configuring API key authentication for integrations
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
  Select,
  Box,
  Divider,
  Alert,
  AlertIcon,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Code,
  RadioGroup,
  Radio,
  HStack,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { ApiKeyCredentialConfig } from '../models/IntegrationModels';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useToast } from '@chakra-ui/react';

interface ApiKeyConfigProps {
  /**
   * Integration ID
   */
  integrationId: string;
  
  /**
   * Initial credential configuration
   */
  initialConfig?: Partial<ApiKeyCredentialConfig>;
  
  /**
   * Callback when configuration is updated
   */
  onConfigChange: (config: ApiKeyCredentialConfig) => void;
  
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
 * Component for configuring API key authentication for integrations
 */
const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({
  integrationId,
  initialConfig,
  onConfigChange,
  isSubmitting = false,
  onAuthComplete,
}) => {
  // State for configuration
  const [config, setConfig] = useState<Partial<ApiKeyCredentialConfig>>({
    type: 'api_key',
    apiKey: '',
    apiKeyHeader: 'X-API-Key',
    ...initialConfig,
  });
  
  // State for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for authentication status
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success' | 'error'>('none');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // State for showing/hiding API key
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  // State for API key location (header or query parameter)
  const [apiKeyLocation, setApiKeyLocation] = useState<'header' | 'query'>(
    initialConfig?.apiKeyQuery ? 'query' : 'header'
  );
  
  // API client
  const apiClient = useApiClient();
  
  // Toast notifications
  const toast = useToast();
  
  // Update parent component with new config whenever it changes
  useEffect(() => {
    // Only notify if all required fields are filled
    if (config.apiKey) {
      const updatedConfig: ApiKeyCredentialConfig = {
        type: 'api_key',
        apiKey: config.apiKey || '',
        ...(apiKeyLocation === 'header' 
          ? { apiKeyHeader: config.apiKeyHeader } 
          : { apiKeyQuery: config.apiKeyQuery })
      };
      
      onConfigChange(updatedConfig);
    }
  }, [config, onConfigChange, apiKeyLocation]);
  
  // Validates the form and returns true if valid
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // API Key is required
    if (!config.apiKey) {
      newErrors.apiKey = 'API Key is required';
    }
    
    // API Key Header is required if header location is selected
    if (apiKeyLocation === 'header' && !config.apiKeyHeader) {
      newErrors.apiKeyHeader = 'Header name is required';
    }
    
    // API Key Query Parameter is required if query location is selected
    if (apiKeyLocation === 'query' && !config.apiKeyQuery) {
      newErrors.apiKeyQuery = 'Query parameter name is required';
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  
  // Handle API key location change
  const handleLocationChange = (value: string) => {
    setApiKeyLocation(value as 'header' | 'query');
    
    // Clear errors related to location
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.apiKeyHeader;
      delete newErrors.apiKeyQuery;
      return newErrors;
    });
  };
  
  // Toggle showing/hiding API key
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  // Generate a random API key for testing
  const generateTestApiKey = () => {
    const randomKey = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    
    setConfig(prev => ({
      ...prev,
      apiKey: randomKey
    }));
    
    // Clear error for API key
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.apiKey;
      return newErrors;
    });
  };
  
  // Test the API key connection
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
      
      // Prepare API key configuration
      const apiKeyConfig = {
        type: 'api_key',
        api_key: config.apiKey,
        ...(apiKeyLocation === 'header' 
          ? { header_name: config.apiKeyHeader } 
          : { query_param: config.apiKeyQuery })
      };
      
      // Test the connection using the API
      const response = await apiClient.post(`/api/v1/integrations/${integrationId}/test-auth`, apiKeyConfig);
      
      // Check if auth was successful
      if (response.data.status === 'success') {
        setAuthStatus('success');
        
        toast({
          title: 'Connection Successful',
          description: 'API key authentication is valid.',
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
          description: response.data.message || 'API key authentication failed.',
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
      console.error('API key test error:', err);
      setAuthStatus('error');
      setAuthError(err.message || 'An error occurred during authentication');
      
      toast({
        title: 'Connection Error',
        description: err.message || 'An error occurred while testing the API key.',
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
  
  return (
    <VStack spacing={6} align="stretch">
      {/* Authentication status alerts */}
      {authStatus === 'success' && (
        <Alert status="success" variant="subtle" borderRadius="md">
          <AlertIcon as={FiCheckCircle} />
          API key connection successful.
        </Alert>
      )}
      
      {authStatus === 'error' && (
        <Alert status="error" variant="subtle" borderRadius="md">
          <AlertIcon as={FiAlertCircle} />
          {authError || 'API key authentication failed. Please check your key.'}
        </Alert>
      )}
      
      {/* API Key */}
      <FormControl isRequired isInvalid={!!errors.apiKey}>
        <FormLabel>API Key</FormLabel>
        <InputGroup>
          <Input
            name="apiKey"
            value={config.apiKey || ''}
            onChange={handleInputChange}
            placeholder="Enter API key"
            type={showApiKey ? 'text' : 'password'}
            disabled={isSubmitting || authStatus === 'pending'}
          />
          <InputRightElement>
            <IconButton
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              icon={showApiKey ? <FiEyeOff /> : <FiEye />}
              variant="ghost"
              onClick={toggleShowApiKey}
              size="sm"
            />
          </InputRightElement>
        </InputGroup>
        {errors.apiKey ? (
          <FormErrorMessage>{errors.apiKey}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The API key provided by the service
          </FormHelperText>
        )}
      </FormControl>
      
      {/* API Key Location */}
      <FormControl as="fieldset">
        <FormLabel as="legend">API Key Location</FormLabel>
        <RadioGroup
          value={apiKeyLocation}
          onChange={handleLocationChange}
          disabled={isSubmitting || authStatus === 'pending'}
        >
          <HStack spacing={4}>
            <Radio value="header">Request Header</Radio>
            <Radio value="query">Query Parameter</Radio>
          </HStack>
        </RadioGroup>
        <FormHelperText>
          Choose how to send the API key in requests
        </FormHelperText>
      </FormControl>
      
      {/* Header Name (only if header location is selected) */}
      {apiKeyLocation === 'header' && (
        <FormControl isRequired isInvalid={!!errors.apiKeyHeader}>
          <FormLabel>Header Name</FormLabel>
          <Input
            name="apiKeyHeader"
            value={config.apiKeyHeader || ''}
            onChange={handleInputChange}
            placeholder="X-API-Key"
            disabled={isSubmitting || authStatus === 'pending'}
          />
          {errors.apiKeyHeader ? (
            <FormErrorMessage>{errors.apiKeyHeader}</FormErrorMessage>
          ) : (
            <FormHelperText>
              The HTTP header name used for the API key
            </FormHelperText>
          )}
        </FormControl>
      )}
      
      {/* Query Parameter Name (only if query location is selected) */}
      {apiKeyLocation === 'query' && (
        <FormControl isRequired isInvalid={!!errors.apiKeyQuery}>
          <FormLabel>Query Parameter Name</FormLabel>
          <Input
            name="apiKeyQuery"
            value={config.apiKeyQuery || ''}
            onChange={handleInputChange}
            placeholder="api_key"
            disabled={isSubmitting || authStatus === 'pending'}
          />
          {errors.apiKeyQuery ? (
            <FormErrorMessage>{errors.apiKeyQuery}</FormErrorMessage>
          ) : (
            <FormHelperText>
              The query parameter name used for the API key
            </FormHelperText>
          )}
        </FormControl>
      )}
      
      {/* Action buttons */}
      <HStack spacing={4} justify="flex-end" mt={4}>
        <Tooltip label="Generate a random API key for testing">
          <Button
            variant="outline"
            onClick={generateTestApiKey}
            leftIcon={<FiRefreshCw />}
            disabled={isSubmitting || authStatus === 'pending'}
          >
            Generate Test Key
          </Button>
        </Tooltip>
        <Button
          colorScheme="blue"
          onClick={testConnection}
          isLoading={isSubmitting || authStatus === 'pending'}
          leftIcon={authStatus === 'success' ? <FiCheckCircle /> : undefined}
        >
          {authStatus === 'success' ? 'Verified' : 'Test Connection'}
        </Button>
      </HStack>
      
      {/* Additional help information */}
      <Box mt={4} p={4} borderRadius="md" bg="gray.50">
        <Text fontWeight="medium" mb={2}>API Key Configuration</Text>
        <Text fontSize="sm" mb={3}>
          API keys provide a simple way to authenticate with external services.
          Most services will provide documentation on how to properly format
          your API key requests.
        </Text>
        <Divider my={3} />
        {apiKeyLocation === 'header' ? (
          <Box fontSize="sm">
            <Text fontWeight="medium" mb={1}>Example HTTP Request:</Text>
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
              {`GET /api/data HTTP/1.1
Host: example.com
${config.apiKeyHeader || 'X-API-Key'}: ${showApiKey ? config.apiKey || 'your-api-key' : '••••••••••••••••'}`}
            </Code>
          </Box>
        ) : (
          <Box fontSize="sm">
            <Text fontWeight="medium" mb={1}>Example URL:</Text>
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
              {`https://example.com/api/data?${config.apiKeyQuery || 'api_key'}=${showApiKey ? config.apiKey || 'your-api-key' : '••••••••••••••••'}`}
            </Code>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default ApiKeyConfig;