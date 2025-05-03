/**
 * IntegrationDashboard.tsx
 * Main dashboard view for integration management
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { useApiClient } from '../../../hooks/useApiClient';
import { Integration, IntegrationType, IntegrationCategory } from './models/IntegrationModels';
import IntegrationCard from './IntegrationCard';
import NewIntegrationModal from './modals/NewIntegrationModal';
import IntegrationDetailModal from './modals/IntegrationDetailModal';

/**
 * Integration Dashboard component for displaying and managing integrations
 */
const IntegrationDashboard: React.FC = () => {
  // State management
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationTypes, setIntegrationTypes] = useState<IntegrationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // API client
  const apiClient = useApiClient();
  
  // Toast notifications
  const toast = useToast();
  
  // Modal controls
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose
  } = useDisclosure();
  
  const {
    isOpen: isDetailModalOpen,
    onOpen: onDetailModalOpen,
    onClose: onDetailModalClose
  } = useDisclosure();
  
  // Load integrations and integration types
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load integration types
      const typesResponse = await apiClient.get<IntegrationType[]>('/api/v1/integration-types/');
      setIntegrationTypes(typesResponse.data);
      
      // Load integrations
      const integrationsResponse = await apiClient.get<Integration[]>('/api/v1/integrations/');
      setIntegrations(integrationsResponse.data);
    } catch (err: any) {
      console.error('Failed to load integrations:', err);
      setError(err.message || 'An error occurred while loading integrations');
      
      toast({
        title: 'Error',
        description: 'Failed to load integrations. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, toast]);
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Handle adding a new integration
  const handleAddIntegration = async (newIntegration: Partial<Integration>) => {
    try {
      // Create API payload
      const payload = {
        name: newIntegration.name,
        type: newIntegration.type,
        config: newIntegration.config || {},
        is_enabled: newIntegration.status === 'active',
      };
      
      // Call API to create integration
      const response = await apiClient.post<Integration>('/api/v1/integrations/', payload);
      
      // Add the new integration to the list
      setIntegrations([...integrations, response.data]);
      
      toast({
        title: 'Integration Added',
        description: `${newIntegration.name} was successfully added.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Failed to add integration:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to add integration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle updating an integration
  const handleUpdateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      // Create API payload
      const payload = {
        name: updates.name,
        is_enabled: updates.status === 'active',
        config: updates.config,
      };
      
      // Call API to update integration
      await apiClient.put<Integration>(`/api/v1/integrations/${id}`, payload);
      
      // Update the integration in the list
      setIntegrations(integrations.map(integration => 
        integration.id === id ? { ...integration, ...updates } : integration
      ));
      
      toast({
        title: 'Integration Updated',
        description: 'Changes were saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error(`Failed to update integration ${id}:`, err);
      
      toast({
        title: 'Error',
        description: 'Failed to update integration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle deleting an integration
  const handleDeleteIntegration = async (id: string) => {
    try {
      // Call API to delete integration
      await apiClient.delete(`/api/v1/integrations/${id}`);
      
      // Remove the integration from the list
      setIntegrations(integrations.filter(integration => integration.id !== id));
      
      toast({
        title: 'Integration Deleted',
        description: 'The integration was successfully removed.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Close the detail modal if it's open
      onDetailModalClose();
    } catch (err: any) {
      console.error(`Failed to delete integration ${id}:`, err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete integration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle refreshing an integration (running it manually)
  const handleRefreshIntegration = async (id: string) => {
    try {
      // Call API to run integration
      await apiClient.post(`/api/v1/integrations/${id}/run`, {
        incremental: true,
      });
      
      toast({
        title: 'Sync Started',
        description: 'Integration sync process has been initiated.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error(`Failed to run integration ${id}:`, err);
      
      toast({
        title: 'Error',
        description: 'Failed to start sync process. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle opening the detail modal
  const handleOpenDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    onDetailModalOpen();
  };
  
  // Group integration types by category
  const categories = React.useMemo(() => {
    const categoryMap: Record<string, IntegrationCategory> = {};
    
    integrationTypes.forEach(type => {
      const category = type.category;
      
      if (!categoryMap[category]) {
        categoryMap[category] = {
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          types: []
        };
      }
      
      categoryMap[category].types.push(type);
    });
    
    return Object.values(categoryMap);
  }, [integrationTypes]);
  
  // Filter integrations by selected category
  const filteredIntegrations = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return integrations;
    }
    
    return integrations.filter(integration => {
      const integrationType = integrationTypes.find(type => type.id === integration.type);
      return integrationType?.category === selectedCategory;
    });
  }, [integrations, integrationTypes, selectedCategory]);
  
  // Lookup integration type by ID
  const getIntegrationType = (typeId: string): IntegrationType | undefined => {
    return integrationTypes.find(type => type.id === typeId);
  };
  
  // Handle error state
  if (error) {
    return (
      <Box p={6}>
        <Alert 
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="md"
          p={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error loading integrations
          </AlertTitle>
          <AlertDescription maxWidth="sm" mb={4}>
            {error}
          </AlertDescription>
          <Button onClick={loadData} leftIcon={<FiRefreshCw />}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <Box p={6} display="flex" alignItems="center" justifyContent="center" height="400px">
        <Spinner size="xl" color="blue.500" mr={4} />
        <Text fontSize="xl">Loading integrations...</Text>
      </Box>
    );
  }
  
  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Integrations</Heading>
        <Button
          colorScheme="blue"
          leftIcon={<FiPlus />}
          onClick={onAddModalOpen}
        >
          Add Integration
        </Button>
      </Flex>
      
      {/* Category filters */}
      <HStack mb={6} spacing={4} overflowX="auto" pb={2}>
        <Button
          size="sm"
          variant={selectedCategory === 'all' ? 'solid' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          colorScheme={selectedCategory === 'all' ? 'blue' : 'gray'}
        >
          All
        </Button>
        
        {categories.map(category => (
          <Button
            key={category.id}
            size="sm"
            variant={selectedCategory === category.id ? 'solid' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            colorScheme={selectedCategory === category.id ? 'blue' : 'gray'}
          >
            {category.name}
          </Button>
        ))}
      </HStack>
      
      {filteredIntegrations.length === 0 ? (
        // Empty state
        <Card p={6} textAlign="center">
          <Heading size="md" mb={2}>No integrations found</Heading>
          <Text mb={4}>
            {selectedCategory === 'all'
              ? 'You have not added any integrations yet.'
              : `You have not added any ${selectedCategory} integrations yet.`}
          </Text>
          <Button colorScheme="blue" onClick={onAddModalOpen}>
            Add Integration
          </Button>
        </Card>
      ) : (
        // Integration cards
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredIntegrations.map(integration => {
            const integrationType = getIntegrationType(integration.type);
            
            // Skip if type definition not found
            if (!integrationType) return null;
            
            return (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                integrationType={integrationType}
                onSyncNow={handleRefreshIntegration}
                onConfigure={handleOpenDetails}
                onClick={handleOpenDetails}
              />
            );
          })}
        </SimpleGrid>
      )}
      
      {/* Add Integration Modal */}
      <NewIntegrationModal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        onAddIntegration={handleAddIntegration}
        availableTypes={integrationTypes}
      />
      
      {/* Integration Detail Modal */}
      <IntegrationDetailModal
        isOpen={isDetailModalOpen}
        onClose={onDetailModalClose}
        integration={selectedIntegration}
        onUpdateIntegration={handleUpdateIntegration}
        onDeleteIntegration={handleDeleteIntegration}
      />
    </Box>
  );
};

export default IntegrationDashboard;