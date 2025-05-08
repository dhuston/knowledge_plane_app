import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  SimpleGrid, 
  Stack,
  Badge,
  useDisclosure
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

import IntegrationCard from './IntegrationCard';
import IntegrationModal from './IntegrationModal';
import IntegrationApiSwitch from './IntegrationApiSwitch';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { useIntegrations } from '../../hooks/useIntegrations';
import { Integration } from '../../types/integration';

const IntegrationsPage: React.FC = () => {
  const { isLoading, error, data: integrations, refetch } = useIntegrations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const handleAddNew = () => {
    setSelectedIntegration(null);
    onOpen();
  };

  const handleEdit = (integration: Integration) => {
    setSelectedIntegration(integration);
    onOpen();
  };

  const handleModalClose = (refreshNeeded: boolean = false) => {
    onClose();
    if (refreshNeeded) {
      refetch();
    }
  };

  // Group integrations by type
  const groupedIntegrations = integrations ? 
    integrations.reduce((acc: Record<string, Integration[]>, integration) => {
      const type = integration.integration_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(integration);
      return acc;
    }, {}) : {};

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Integrations</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue"
          onClick={handleAddNew}
        >
          Add Integration
        </Button>
      </Flex>

      <Box mb={6}>
        <Text>
          Connect the knowledge platform to your organization's tools and systems to enrich your Living Map with 
          real-time data from various sources.
        </Text>
      </Box>
      
      <IntegrationApiSwitch />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorAlert 
          title="Failed to load integrations" 
          message={(error as Error).message} 
          onRetry={refetch}
        />
      ) : integrations && integrations.length > 0 ? (
        <>
          {Object.entries(groupedIntegrations).map(([type, items]) => (
            <Box key={type} mb={8}>
              <Flex alignItems="center" mb={4}>
                <Heading size="md" textTransform="capitalize">{type.replace('_', ' ')} Integrations</Heading>
                <Badge ml={2} colorScheme="blue">{items.length}</Badge>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {items.map((integration) => (
                  <IntegrationCard 
                    key={integration.id}
                    integration={integration}
                    onEdit={() => handleEdit(integration)}
                    onRefresh={refetch}
                  />
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </>
      ) : (
        <Stack
          textAlign="center"
          spacing={4}
          py={12}
          px={6}
          borderWidth={1}
          borderRadius="lg"
          borderStyle="dashed"
        >
          <Heading as="h3" size="md">
            No Integrations Found
          </Heading>
          <Text>
            Get started by adding your first integration to enhance your workspace with external data.
          </Text>
          <Flex justifyContent="center">
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="blue"
              onClick={handleAddNew}
            >
              Add Integration
            </Button>
          </Flex>
        </Stack>
      )}

      <IntegrationModal 
        isOpen={isOpen} 
        onClose={handleModalClose} 
        integration={selectedIntegration} 
      />
    </Container>
  );
};

export default IntegrationsPage;