/**
 * AuthSelector.tsx
 * Component for selecting and configuring different authentication methods for integrations
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Text,
  Alert,
  AlertIcon,
  FormHelperText,
  useColorModeValue,
} from '@chakra-ui/react';
import OAuth2Config from './OAuth2Config';
import ApiKeyConfig from './ApiKeyConfig';
import BasicAuthConfig from './BasicAuthConfig';
import { 
  OAuth2CredentialConfig, 
  ApiKeyCredentialConfig, 
  BasicAuthCredentialConfig, 
  CredentialConfig 
} from '../models/IntegrationModels';

interface AuthSelectorProps {
  /**
   * Integration ID
   */
  integrationId: string;
  
  /**
   * Initial credential configuration
   */
  initialConfig?: Partial<CredentialConfig>;
  
  /**
   * Available authentication types for this integration
   */
  availableAuthTypes: ('oauth2' | 'api_key' | 'basic_auth')[];
  
  /**
   * Callback when configuration is updated
   */
  onConfigChange: (config: CredentialConfig) => void;
  
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
 * Component for selecting and configuring different authentication methods
 */
const AuthSelector: React.FC<AuthSelectorProps> = ({
  integrationId,
  initialConfig,
  availableAuthTypes,
  onConfigChange,
  isSubmitting = false,
  onAuthComplete,
}) => {
  // Determine initial auth type
  const determineInitialType = () => {
    // If initial config is provided, use its type
    if (initialConfig?.type) {
      return initialConfig.type;
    }
    
    // Otherwise use the first available type
    if (availableAuthTypes.length > 0) {
      return availableAuthTypes[0];
    }
    
    // Fallback to oauth2
    return 'oauth2';
  };
  
  // State for the selected authentication type
  const [authType, setAuthType] = useState<string>(determineInitialType());
  
  // State for the credentials of each type
  const [oauth2Config, setOAuth2Config] = useState<Partial<OAuth2CredentialConfig>>(
    initialConfig?.type === 'oauth2' ? initialConfig as OAuth2CredentialConfig : {
      type: 'oauth2',
      clientId: '',
      clientSecret: '',
      authorizationUrl: '',
      tokenUrl: '',
      scopes: [],
      redirectUri: `${window.location.origin}/auth/callback`,
      grantType: 'authorization_code',
    }
  );
  
  const [apiKeyConfig, setApiKeyConfig] = useState<Partial<ApiKeyCredentialConfig>>(
    initialConfig?.type === 'api_key' ? initialConfig as ApiKeyCredentialConfig : {
      type: 'api_key',
      apiKey: '',
      apiKeyHeader: 'X-API-Key',
    }
  );
  
  const [basicAuthConfig, setBasicAuthConfig] = useState<Partial<BasicAuthCredentialConfig>>(
    initialConfig?.type === 'basic_auth' ? initialConfig as BasicAuthCredentialConfig : {
      type: 'basic_auth',
      username: '',
      password: '',
    }
  );
  
  // Index of the initially selected tab
  const initialTabIndex = availableAuthTypes.indexOf(authType as any) !== -1 
    ? availableAuthTypes.indexOf(authType as any) 
    : 0;
  
  // Track authentication completed statuses
  const [authCompleted, setAuthCompleted] = useState<Record<string, boolean>>({
    oauth2: false,
    api_key: false,
    basic_auth: false,
  });
  
  // Update the parent whenever the selected auth type or config changes
  useEffect(() => {
    // Only update if the current auth type is among the available ones
    if (availableAuthTypes.includes(authType as any)) {
      let config: CredentialConfig | null = null;
      
      // Get the config for the current auth type
      switch (authType) {
        case 'oauth2':
          if (oauth2Config.clientId && oauth2Config.clientSecret) {
            config = oauth2Config as OAuth2CredentialConfig;
          }
          break;
        case 'api_key':
          if (apiKeyConfig.apiKey) {
            config = apiKeyConfig as ApiKeyCredentialConfig;
          }
          break;
        case 'basic_auth':
          if (basicAuthConfig.username && basicAuthConfig.password) {
            config = basicAuthConfig as BasicAuthCredentialConfig;
          }
          break;
      }
      
      // Notify parent if we have a valid config
      if (config) {
        onConfigChange(config);
      }
    }
  }, [authType, oauth2Config, apiKeyConfig, basicAuthConfig, onConfigChange, availableAuthTypes]);
  
  // Update auth type when tab changes
  const handleTabChange = (index: number) => {
    const newType = availableAuthTypes[index];
    setAuthType(newType);
  };
  
  // Handle OAuth2 config changes
  const handleOAuth2ConfigChange = (config: OAuth2CredentialConfig) => {
    setOAuth2Config(config);
  };
  
  // Handle API key config changes
  const handleApiKeyConfigChange = (config: ApiKeyCredentialConfig) => {
    setApiKeyConfig(config);
  };
  
  // Handle basic auth config changes
  const handleBasicAuthConfigChange = (config: BasicAuthCredentialConfig) => {
    setBasicAuthConfig(config);
  };
  
  // Handle auth completion for any type
  const handleAuthComplete = (type: string, success: boolean) => {
    // Update auth completed status
    setAuthCompleted(prev => ({
      ...prev,
      [type]: success,
    }));
    
    // Call the parent callback if provided
    if (onAuthComplete) {
      onAuthComplete(success);
    }
  };
  
  // Get human-readable name for auth type
  const getAuthTypeName = (type: string): string => {
    switch (type) {
      case 'oauth2':
        return 'OAuth 2.0';
      case 'api_key':
        return 'API Key';
      case 'basic_auth':
        return 'Basic Auth';
      default:
        return type;
    }
  };
  
  // If only one auth type is available and it's not a dropdown selection
  const singleAuthType = availableAuthTypes.length === 1;
  
  return (
    <VStack spacing={6} align="stretch" width="100%">
      {/* Authentication Type Selector - only show if multiple types are available */}
      {!singleAuthType && (
        <FormControl>
          <FormLabel>Authentication Type</FormLabel>
          <Select
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
            isDisabled={isSubmitting}
          >
            {availableAuthTypes.map(type => (
              <option key={type} value={type}>
                {getAuthTypeName(type)}
              </option>
            ))}
          </Select>
          <FormHelperText>
            Select the authentication method required by the service
          </FormHelperText>
        </FormControl>
      )}
      
      {/* Authentication Type Label - only show if single type */}
      {singleAuthType && (
        <Box mb={2}>
          <Text fontWeight="medium">
            Authentication: {getAuthTypeName(availableAuthTypes[0])}
          </Text>
          <Divider mt={2} mb={4} />
        </Box>
      )}
      
      {/* Authentication Configuration - using tabs for multiple types */}
      {!singleAuthType ? (
        <Tabs 
          index={initialTabIndex} 
          onChange={handleTabChange}
          variant="enclosed"
          colorScheme="blue"
          isLazy
        >
          <TabList>
            {availableAuthTypes.map(type => (
              <Tab key={type}>
                {getAuthTypeName(type)}
                {authCompleted[type] && (
                  <Box as="span" ml={2} color="green.500">
                    ✓
                  </Box>
                )}
              </Tab>
            ))}
          </TabList>
          
          <TabPanels>
            {/* OAuth 2.0 Tab */}
            {availableAuthTypes.includes('oauth2') && (
              <TabPanel px={0} pt={4}>
                <OAuth2Config
                  integrationId={integrationId}
                  initialConfig={oauth2Config}
                  onConfigChange={handleOAuth2ConfigChange}
                  isSubmitting={isSubmitting}
                  onAuthComplete={(success) => handleAuthComplete('oauth2', success)}
                />
              </TabPanel>
            )}
            
            {/* API Key Tab */}
            {availableAuthTypes.includes('api_key') && (
              <TabPanel px={0} pt={4}>
                <ApiKeyConfig
                  integrationId={integrationId}
                  initialConfig={apiKeyConfig}
                  onConfigChange={handleApiKeyConfigChange}
                  isSubmitting={isSubmitting}
                  onAuthComplete={(success) => handleAuthComplete('api_key', success)}
                />
              </TabPanel>
            )}
            
            {/* Basic Auth Tab */}
            {availableAuthTypes.includes('basic_auth') && (
              <TabPanel px={0} pt={4}>
                <BasicAuthConfig
                  integrationId={integrationId}
                  initialConfig={basicAuthConfig}
                  onConfigChange={handleBasicAuthConfigChange}
                  isSubmitting={isSubmitting}
                  onAuthComplete={(success) => handleAuthComplete('basic_auth', success)}
                />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      ) : (
        /* Single auth type - no tabs needed */
        <Box>
          {/* OAuth 2.0 */}
          {availableAuthTypes[0] === 'oauth2' && (
            <OAuth2Config
              integrationId={integrationId}
              initialConfig={oauth2Config}
              onConfigChange={handleOAuth2ConfigChange}
              isSubmitting={isSubmitting}
              onAuthComplete={(success) => handleAuthComplete('oauth2', success)}
            />
          )}
          
          {/* API Key */}
          {availableAuthTypes[0] === 'api_key' && (
            <ApiKeyConfig
              integrationId={integrationId}
              initialConfig={apiKeyConfig}
              onConfigChange={handleApiKeyConfigChange}
              isSubmitting={isSubmitting}
              onAuthComplete={(success) => handleAuthComplete('api_key', success)}
            />
          )}
          
          {/* Basic Auth */}
          {availableAuthTypes[0] === 'basic_auth' && (
            <BasicAuthConfig
              integrationId={integrationId}
              initialConfig={basicAuthConfig}
              onConfigChange={handleBasicAuthConfigChange}
              isSubmitting={isSubmitting}
              onAuthComplete={(success) => handleAuthComplete('basic_auth', success)}
            />
          )}
        </Box>
      )}
      
      {/* If no auth types are available */}
      {availableAuthTypes.length === 0 && (
        <Alert status="warning">
          <AlertIcon />
          No authentication methods are available for this integration.
        </Alert>
      )}
    </VStack>
  );
};

export default AuthSelector;