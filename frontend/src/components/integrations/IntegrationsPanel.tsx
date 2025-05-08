import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
  IconButton,
  Tooltip,
  CloseButton
} from '@chakra-ui/react';
import { FaPlus, FaSync, FaTools } from 'react-icons/fa';
import { useApiClient } from '../../hooks/useApiClient';

// Define types for integration data
interface IntegrationType {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastSync?: string;
}

const IntegrationsPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationTypes, setIntegrationTypes] = useState<IntegrationType[]>([]);
  const apiClient = useApiClient();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load integrations on component mount
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // This would be a real API call in a fully connected application
        // For now, we'll simulate the data
        // const response = await apiClient.get('/integrations');
        // setIntegrations(response);
        
        // Mock data while endpoint is being implemented
        const mockIntegrations: Integration[] = [
          {
            id: '1',
            name: 'Google Calendar',
            type: 'calendar',
            status: 'active',
            lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
          },
          {
            id: '2',
            name: 'GitHub',
            type: 'source_control',
            status: 'active',
            lastSync: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
          },
          {
            id: '3',
            name: 'Slack',
            type: 'messaging',
            status: 'configuring'
          }
        ];

        // Simulate API delay
        setTimeout(() => {
          setIntegrations(mockIntegrations);
          setIsLoading(false);
        }, 500);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load integrations');
        setIsLoading(false);
      }
    };

    // Also fetch available integration types
    const fetchIntegrationTypes = async () => {
      try {
        // const response = await apiClient.get('/integrations/types');
        // setIntegrationTypes(response);
        
        // Mock data for now
        const mockTypes: IntegrationType[] = [
          {
            id: 'calendar',
            name: 'Calendar',
            description: 'Sync calendar events and meetings'
          },
          {
            id: 'source_control',
            name: 'Source Control',
            description: 'Connect to code repositories'
          },
          {
            id: 'messaging',
            name: 'Messaging',
            description: 'Connect to team messaging platforms'
          },
          {
            id: 'project_management',
            name: 'Project Management',
            description: 'Sync with project management tools'
          }
        ];
        
        setIntegrationTypes(mockTypes);
      } catch (err) {
        // Non-critical error, don't show to user
        console.error('Failed to load integration types');
      }
    };

    fetchIntegrations();
    fetchIntegrationTypes();
  }, []);

  // Handler for syncing an integration
  const handleSync = (id: string) => {
    // This would trigger a sync in a real application
    console.log(`Syncing integration ${id}`);
    
    // Update the lastSync time in our local state
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, lastSync: new Date().toISOString() } 
          : integration
      )
    );
  };

  return (
    <Box
      position="absolute"
      right="20px"
      top="80px"
      width="350px"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="md"
      p={4}
      zIndex={10}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Data Integrations</Heading>
        <CloseButton size="md" />
      </Flex>

      {isLoading ? (
        <Flex justifyContent="center" py={8}>
          <Spinner size="lg" />
        </Flex>
      ) : error ? (
        <Box bg="red.50" color="red.700" p={3} borderRadius="md">
          <Text>{error}</Text>
          <Button mt={2} size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      ) : integrations.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text mb={4}>No integrations configured</Text>
          <Button leftIcon={<FaPlus />} colorScheme="blue">
            Add Integration
          </Button>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {integrations.map((integration) => (
            <Box
              key={integration.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              borderColor={borderColor}
              _hover={{ borderColor: 'blue.300' }}
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">{integration.name}</Text>
                  <Flex align="center" mt={1}>
                    <Badge
                      colorScheme={
                        integration.status === 'active'
                          ? 'green'
                          : integration.status === 'error'
                          ? 'red'
                          : 'yellow'
                      }
                      mr={2}
                    >
                      {integration.status}
                    </Badge>
                    {integration.lastSync && (
                      <Text fontSize="xs" color="gray.500">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </Text>
                    )}
                  </Flex>
                </Box>
                <Tooltip label="Sync now">
                  <IconButton
                    aria-label="Sync integration"
                    icon={<FaSync />}
                    size="sm"
                    onClick={() => handleSync(integration.id)}
                    isDisabled={integration.status !== 'active'}
                  />
                </Tooltip>
              </Flex>
            </Box>
          ))}

          <Button
            leftIcon={<FaPlus />}
            size="sm"
            mt={2}
            width="full"
            colorScheme="blue"
            variant="outline"
          >
            Add Integration
          </Button>
        </VStack>
      )}
    </Box>
  );
};

export default IntegrationsPanel;