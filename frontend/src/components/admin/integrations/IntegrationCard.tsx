/**
 * IntegrationCard.tsx
 * Card component for displaying integration information in the admin panel
 */
import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Text,
  Badge,
  HStack,
  Button,
  Progress,
  SimpleGrid,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSettings, FiAlertTriangle } from 'react-icons/fi';
import { Integration, IntegrationType } from './models/IntegrationModels';

interface IntegrationCardProps {
  /**
   * Integration data to display
   */
  integration: Integration;
  
  /**
   * Integration type metadata
   */
  integrationType: IntegrationType;
  
  /**
   * Called when the sync button is clicked
   */
  onSyncNow: (integrationId: string) => void;
  
  /**
   * Called when the configure button is clicked
   */
  onConfigure: (integration: Integration) => void;
  
  /**
   * Called when the card is clicked
   */
  onClick: (integration: Integration) => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Card component for displaying integration information and actions
 */
const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  integrationType,
  onSyncNow,
  onConfigure,
  onClick,
  className
}) => {
  // Get status-specific color scheme
  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'error':
        return 'red';
      case 'configuring':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Format timestamp for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card 
      overflow="hidden"
      variant="outline"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: 'blue.500', shadow: 'md' }}
      onClick={() => onClick(integration)}
      className={className}
      role="button"
      aria-label={`${integration.name} integration`}
    >
      <CardHeader pb={3}>
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            {integrationType.icon && (
              <Image 
                src={integrationType.icon} 
                alt={`${integrationType.name} icon`} 
                boxSize="24px" 
                objectFit="contain"
              />
            )}
            <Heading size="md">{integration.name}</Heading>
          </HStack>
          <Badge
            colorScheme={getStatusColorScheme(integration.status)}
            textTransform="lowercase"
          >
            {integration.status}
          </Badge>
        </Flex>
        <Text fontSize="sm" color="gray.500" mt={1}>
          {integrationType.description}
        </Text>
      </CardHeader>
      
      <CardBody pt={0}>
        {/* Integration metrics - only show for non-configuring statuses */}
        {integration.status !== 'configuring' && (
          <Box mb={4}>
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Events Processed
                </Text>
                <Text fontWeight="bold">
                  {integration.metrics?.eventsProcessed || 0}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Success Rate
                </Text>
                <Text fontWeight="bold">
                  {integration.metrics?.successRate || 0}%
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        )}
        
        {/* Configuring state */}
        {integration.status === 'configuring' && (
          <Box mb={4}>
            <Text fontSize="sm" mb={2}>
              Configuration in progress
            </Text>
            <Progress size="sm" isIndeterminate colorScheme="blue" />
          </Box>
        )}
        
        {/* Error state */}
        {integration.status === 'error' && (
          <HStack color="red.500" mb={4}>
            <FiAlertTriangle />
            <Text fontSize="sm">Authentication error</Text>
          </HStack>
        )}
        
        <HStack fontSize="xs" color="gray.500" mt={4}>
          <Text>
            {integration.lastSync 
              ? `Last sync: ${formatDate(integration.lastSync)}`
              : 'Never synced'}
          </Text>
        </HStack>
      </CardBody>
      
      <CardFooter 
        pt={0} 
        mt={4} 
        borderTop="1px" 
        borderColor={useColorModeValue('gray.100', 'gray.700')}
        onClick={e => e.stopPropagation()}
      >
        <Button
          size="sm"
          leftIcon={<FiRefreshCw />}
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSyncNow(integration.id);
          }}
          isDisabled={integration.status !== 'active'}
        >
          Sync Now
        </Button>
        <Button
          size="sm"
          leftIcon={<FiSettings />}
          variant="ghost"
          ml={2}
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(integration);
          }}
        >
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;