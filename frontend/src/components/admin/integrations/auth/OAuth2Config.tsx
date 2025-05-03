/**
 * OAuth2Config.tsx
 * Component for configuring OAuth 2.0 authentication for integrations
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
  HStack,
  Box,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  Badge,
  Text,
  useToast,
  Switch,
  InputGroup,
  InputRightElement,
  IconButton,
  useDisclosure,
  Tooltip,
  Link,
  Code,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiExternalLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { OAuth2CredentialConfig } from '../models/IntegrationModels';
import { useApiClient } from '../../../../hooks/useApiClient';

interface OAuth2ConfigProps {
  /**
   * Integration ID
   */
  integrationId: string;
  
  /**
   * Initial credential configuration
   */
  initialConfig?: Partial<OAuth2CredentialConfig>;
  
  /**
   * Callback when configuration is updated
   */
  onConfigChange: (config: OAuth2CredentialConfig) => void;
  
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
 * Component for configuring OAuth 2.0 authentication for integrations
 */
const OAuth2Config: React.FC<OAuth2ConfigProps> = ({
  integrationId,
  initialConfig,
  onConfigChange,
  isSubmitting = false,
  onAuthComplete,
}) => {
  // Default redirect URI
  const defaultRedirectUri = `${window.location.origin}/auth/callback`;
  
  // State for configuration
  const [config, setConfig] = useState<Partial<OAuth2CredentialConfig>>({
    type: 'oauth2',
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    scopes: [],
    redirectUri: defaultRedirectUri,
    grantType: 'authorization_code',
    ...initialConfig,
  });
  
  // Convert scopes array to string for input field
  const [scopesString, setScopesString] = useState<string>(
    Array.isArray(initialConfig?.scopes) ? initialConfig.scopes.join(' ') : ''
  );
  
  // State for showing/hiding secrets
  const [showClientSecret, setShowClientSecret] = useState<boolean>(false);
  
  // State for form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for authentication status
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success' | 'error'>('none');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // API client
  const apiClient = useApiClient();
  
  // Toast notifications
  const toast = useToast();
  
  // Update the credential configuration whenever form values change
  useEffect(() => {
    // Convert scopes string to array and remove empty values
    const scopesArray = scopesString
      .split(/[\s,]+/) // Split by whitespace or commas
      .filter(Boolean); // Remove empty strings
    
    // Update the configuration with the new scopes
    const updatedConfig: OAuth2CredentialConfig = {
      ...config as OAuth2CredentialConfig,
      scopes: scopesArray,
    };
    
    // Notify parent component
    onConfigChange(updatedConfig);
  }, [config, scopesString, onConfigChange]);
  
  // Validates the form and returns true if valid
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields for all grant types
    if (!config.clientId) {
      newErrors.clientId = 'Client ID is required';
    }
    
    if (!config.clientSecret) {
      newErrors.clientSecret = 'Client Secret is required';
    }
    
    // Validate authorization URL for authorization code grant
    if (config.grantType === 'authorization_code' && !config.authorizationUrl) {
      newErrors.authorizationUrl = 'Authorization URL is required for Authorization Code grant';
    }
    
    // Validate token URL
    if (!config.tokenUrl) {
      newErrors.tokenUrl = 'Token URL is required';
    } else if (!/^https:\/\//.test(config.tokenUrl)) {
      newErrors.tokenUrl = 'Token URL must use HTTPS';
    }
    
    // Validate redirect URI
    if (config.grantType === 'authorization_code' && !config.redirectUri) {
      newErrors.redirectUri = 'Redirect URI is required for Authorization Code grant';
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for scopes
    if (name === 'scopes') {
      setScopesString(value);
    } else {
      setConfig(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Toggle showing/hiding client secret
  const toggleShowClientSecret = () => {
    setShowClientSecret(!showClientSecret);
  };
  
  // Initiate OAuth flow
  const initiateOAuthFlow = async () => {
    // Validate form first
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before continuing.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setAuthStatus('pending');
      setAuthError(null);
      
      // For authorization_code grant, we need to redirect the user
      if (config.grantType === 'authorization_code') {
        // First save the current config so we can resume after redirect
        await apiClient.post(`/api/v1/integrations/${integrationId}/temp-credentials`, {
          type: 'oauth2',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          authorization_url: config.authorizationUrl,
          token_url: config.tokenUrl,
          scopes: config.scopes,
          redirect_uri: config.redirectUri,
          grant_type: config.grantType,
        });
        
        // Generate a state parameter for security
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem(`oauth_state_${integrationId}`, state);
        
        // Build authorization URL with parameters
        const authUrl = new URL(config.authorizationUrl as string);
        authUrl.searchParams.append('client_id', config.clientId as string);
        authUrl.searchParams.append('redirect_uri', config.redirectUri as string);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', state);
        
        if (config.scopes && config.scopes.length > 0) {
          authUrl.searchParams.append('scope', config.scopes.join(' '));
        }
        
        // Redirect to authentication URL
        window.location.href = authUrl.toString();
      } else if (config.grantType === 'client_credentials') {
        // For client_credentials, we can test the connection directly
        const response = await apiClient.post(`/api/v1/integrations/${integrationId}/test-auth`, {
          type: 'oauth2',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          token_url: config.tokenUrl,
          scopes: config.scopes,
          grant_type: config.grantType,
        });
        
        // Check if auth was successful
        if (response.data.status === 'success') {
          setAuthStatus('success');
          
          // Update the config with the token
          setConfig(prev => ({
            ...prev,
            accessToken: response.data.access_token,
            expiresAt: response.data.expires_at,
          }));
          
          toast({
            title: 'Authentication Successful',
            description: 'OAuth credentials have been verified.',
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
            title: 'Authentication Failed',
            description: response.data.message || 'Failed to authenticate with provided credentials.',
            status: 'error',
            duration: 8000,
            isClosable: true,
          });
          
          // Notify parent
          if (onAuthComplete) {
            onAuthComplete(false);
          }
        }
      }
    } catch (err: any) {
      console.error('OAuth flow error:', err);
      setAuthStatus('error');
      setAuthError(err.message || 'An error occurred during authentication');
      
      toast({
        title: 'Authentication Error',
        description: err.message || 'An error occurred during the authentication process.',
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
          Authentication successful. OAuth token acquired.
        </Alert>
      )}
      
      {authStatus === 'error' && (
        <Alert status="error" variant="subtle" borderRadius="md">
          <AlertIcon as={FiAlertCircle} />
          {authError || 'Authentication failed. Please check your credentials.'}
        </Alert>
      )}
      
      {/* OAuth 2.0 Grant Type */}
      <FormControl>
        <FormLabel>Grant Type</FormLabel>
        <Select 
          name="grantType" 
          value={config.grantType} 
          onChange={handleInputChange}
          disabled={isSubmitting || authStatus === 'pending'}
        >
          <option value="authorization_code">Authorization Code</option>
          <option value="client_credentials">Client Credentials</option>
        </Select>
        <FormHelperText>
          {config.grantType === 'authorization_code' 
            ? 'User will be redirected to authorize access' 
            : 'Server-to-server authentication without user interaction'}
        </FormHelperText>
      </FormControl>
      
      {/* Client ID */}
      <FormControl isRequired isInvalid={!!errors.clientId}>
        <FormLabel>Client ID</FormLabel>
        <Input 
          name="clientId" 
          value={config.clientId || ''} 
          onChange={handleInputChange}
          placeholder="Enter client ID"
          disabled={isSubmitting || authStatus === 'pending'}
        />
        {errors.clientId ? (
          <FormErrorMessage>{errors.clientId}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The client ID provided by the service
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Client Secret */}
      <FormControl isRequired isInvalid={!!errors.clientSecret}>
        <FormLabel>Client Secret</FormLabel>
        <InputGroup>
          <Input 
            name="clientSecret" 
            value={config.clientSecret || ''} 
            onChange={handleInputChange}
            placeholder="Enter client secret"
            type={showClientSecret ? 'text' : 'password'}
            disabled={isSubmitting || authStatus === 'pending'}
          />
          <InputRightElement>
            <IconButton
              aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
              icon={showClientSecret ? <FiEyeOff /> : <FiEye />}
              variant="ghost"
              onClick={toggleShowClientSecret}
              size="sm"
            />
          </InputRightElement>
        </InputGroup>
        {errors.clientSecret ? (
          <FormErrorMessage>{errors.clientSecret}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The client secret provided by the service
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Authorization URL - only for authorization_code grant */}
      {config.grantType === 'authorization_code' && (
        <FormControl isRequired isInvalid={!!errors.authorizationUrl}>
          <FormLabel>Authorization URL</FormLabel>
          <Input 
            name="authorizationUrl" 
            value={config.authorizationUrl || ''} 
            onChange={handleInputChange}
            placeholder="https://example.com/oauth/authorize"
            disabled={isSubmitting || authStatus === 'pending'}
          />
          {errors.authorizationUrl ? (
            <FormErrorMessage>{errors.authorizationUrl}</FormErrorMessage>
          ) : (
            <FormHelperText>
              The URL to redirect users to for authorization
            </FormHelperText>
          )}
        </FormControl>
      )}
      
      {/* Token URL */}
      <FormControl isRequired isInvalid={!!errors.tokenUrl}>
        <FormLabel>Token URL</FormLabel>
        <Input 
          name="tokenUrl" 
          value={config.tokenUrl || ''} 
          onChange={handleInputChange}
          placeholder="https://example.com/oauth/token"
          disabled={isSubmitting || authStatus === 'pending'}
        />
        {errors.tokenUrl ? (
          <FormErrorMessage>{errors.tokenUrl}</FormErrorMessage>
        ) : (
          <FormHelperText>
            The URL to exchange authorization code for tokens
          </FormHelperText>
        )}
      </FormControl>
      
      {/* Scopes */}
      <FormControl>
        <FormLabel>Scopes</FormLabel>
        <Input 
          name="scopes" 
          value={scopesString} 
          onChange={handleInputChange}
          placeholder="read:data write:data"
          disabled={isSubmitting || authStatus === 'pending'}
        />
        <FormHelperText>
          Space-separated list of permission scopes
        </FormHelperText>
      </FormControl>
      
      {/* Redirect URI - only for authorization_code grant */}
      {config.grantType === 'authorization_code' && (
        <FormControl isInvalid={!!errors.redirectUri}>
          <FormLabel>Redirect URI</FormLabel>
          <Input 
            name="redirectUri" 
            value={config.redirectUri || defaultRedirectUri} 
            onChange={handleInputChange}
            disabled={isSubmitting || authStatus === 'pending'}
          />
          <FormHelperText>
            The URI to redirect back to after authorization
          </FormHelperText>
        </FormControl>
      )}
      
      {/* Authenticate button */}
      <Flex justify="flex-end" mt={4}>
        <Button
          colorScheme="blue"
          onClick={initiateOAuthFlow}
          isLoading={isSubmitting || authStatus === 'pending'}
          leftIcon={authStatus === 'success' ? <FiCheckCircle /> : undefined}
        >
          {authStatus === 'success' ? 'Authenticated' : 'Authenticate'}
        </Button>
      </Flex>
      
      {/* Additional help information */}
      <Box mt={4} p={4} borderRadius="md" bg="gray.50">
        <Text fontWeight="medium" mb={2}>OAuth 2.0 Information</Text>
        <Text fontSize="sm" mb={3}>
          When setting up OAuth 2.0, you'll need to configure the following in your OAuth provider:
        </Text>
        <VStack align="start" spacing={2} fontSize="sm" ml={2}>
          <HStack>
            <Text fontWeight="medium">Redirect URI:</Text>
            <Code>{config.redirectUri || defaultRedirectUri}</Code>
          </HStack>
          <HStack>
            <Text fontWeight="medium">Grant Type:</Text>
            <Badge>{config.grantType === 'authorization_code' ? 'Authorization Code' : 'Client Credentials'}</Badge>
          </HStack>
        </VStack>
        <Divider my={3} />
        <Link href="#" color="blue.500" fontSize="sm" isExternal>
          Learn more about OAuth configuration <FiExternalLink style={{ display: 'inline' }} />
        </Link>
      </Box>
    </VStack>
  );
};

export default OAuth2Config;