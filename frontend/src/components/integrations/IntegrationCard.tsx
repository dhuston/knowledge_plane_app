import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  HStack,
  VStack, 
  Flex, 
  Icon, 
  Button, 
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  WarningIcon, 
  TimeIcon, 
  RepeatIcon,
  SettingsIcon,
  DeleteIcon
} from '@chakra-ui/icons';
import { FaJira, FaGoogle, FaSlack, FaMicrosoft, FaLink } from 'react-icons/fa';

export interface IntegrationRun {
  id: string;
  status: 'success' | 'failed' | 'partial_success' | 'running';
  startTime: string;
  endTime?: string;
  entityCount?: number;
  errorCount?: number;
}

export interface Integration {
  id: string;
  name: string;
  description?: string;
  integrationType: string;
  status: 'active' | 'disabled' | 'error' | 'pending';
  isEnabled: boolean;
  lastRun?: IntegrationRun;
  successRate?: number; // 0-100
  schedule?: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
  onToggleStatus?: (id: string, enabled: boolean) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onEdit,
  onDelete,
  onRun,
  onToggleStatus
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get appropriate icon for integration type
  const getIntegrationIcon = () => {
    switch (integration.integrationType.toLowerCase()) {
      case 'jira':
        return FaJira;
      case 'google_calendar':
        return FaGoogle;
      case 'microsoft_teams':
      case 'microsoft_outlook':
        return FaMicrosoft;
      case 'slack':
        return FaSlack;
      default:
        return FaLink;
    }
  };
  
  // Get status badge for integration
  const getStatusBadge = () => {
    switch (integration.status) {
      case 'active':
        return <Badge colorScheme="green">Active</Badge>;
      case 'disabled':
        return <Badge colorScheme="gray">Disabled</Badge>;
      case 'error':
        return <Badge colorScheme="red">Error</Badge>;
      case 'pending':
        return <Badge colorScheme="blue">Pending</Badge>;
      default:
        return null;
    }
  };
  
  // Get last run status icon
  const getRunStatusIcon = () => {
    if (!integration.lastRun) return null;
    
    switch (integration.lastRun.status) {
      case 'success':
        return <Icon as={CheckCircleIcon} color="green.500" />;
      case 'failed':
        return <Icon as={WarningIcon} color="red.500" />;
      case 'partial_success':
        return <Icon as={WarningIcon} color="orange.500" />;
      case 'running':
        return <Icon as={TimeIcon} color="blue.500" />;
      default:
        return null;
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle toggle status
  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(integration.id, !integration.isEnabled);
    }
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      p={4}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <HStack>
          <Icon 
            as={getIntegrationIcon()} 
            boxSize={6}
            color={integration.isEnabled ? 'blue.500' : 'gray.400'} 
          />
          <Heading size="md">{integration.name}</Heading>
        </HStack>
        {getStatusBadge()}
      </Flex>
      
      {integration.description && (
        <Text fontSize="sm" color="gray.600" mb={3} noOfLines={2}>
          {integration.description}
        </Text>
      )}
      
      <Divider my={3} />
      
      <Flex justify="space-between" align="center" mb={3}>
        <StatGroup width="100%">
          {integration.lastRun ? (
            <>
              <Stat size="sm">
                <StatLabel fontSize="xs">Last Run</StatLabel>
                <StatNumber fontSize="sm" display="flex" alignItems="center" gap={1}>
                  {getRunStatusIcon()}
                  {formatDate(integration.lastRun.endTime || integration.lastRun.startTime)}
                </StatNumber>
              </Stat>
              
              {integration.lastRun.entityCount !== undefined && (
                <Stat size="sm">
                  <StatLabel fontSize="xs">Entities</StatLabel>
                  <StatNumber fontSize="sm">{integration.lastRun.entityCount}</StatNumber>
                </Stat>
              )}
            </>
          ) : (
            <Text fontSize="sm" color="gray.500">No runs yet</Text>
          )}
          
          {integration.successRate !== undefined && (
            <Flex justify="flex-end" flex={1}>
              <CircularProgress 
                value={integration.successRate} 
                color={
                  integration.successRate > 80 ? 'green.400' : 
                  integration.successRate > 50 ? 'orange.400' : 'red.400'
                }
                size="40px"
              >
                <CircularProgressLabel fontSize="xs">
                  {integration.successRate}%
                </CircularProgressLabel>
              </CircularProgress>
            </Flex>
          )}
        </StatGroup>
      </Flex>
      
      {integration.schedule && (
        <Flex align="center" mb={3}>
          <Icon as={RepeatIcon} mr={1} color="gray.500" />
          <Text fontSize="xs" color="gray.500">
            {integration.schedule}
          </Text>
        </Flex>
      )}
      
      <Divider my={3} />
      
      <HStack spacing={2} justify="flex-end">
        {onRun && (
          <Tooltip label="Run now">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRun(integration.id)}
              isDisabled={!integration.isEnabled || integration.lastRun?.status === 'running'}
              leftIcon={<RepeatIcon />}
            >
              Run
            </Button>
          </Tooltip>
        )}
        
        {onToggleStatus && (
          <Tooltip label={integration.isEnabled ? 'Disable' : 'Enable'}>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleStatus}
              colorScheme={integration.isEnabled ? 'red' : 'green'}
            >
              {integration.isEnabled ? 'Disable' : 'Enable'}
            </Button>
          </Tooltip>
        )}
        
        {onEdit && (
          <Tooltip label="Edit settings">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(integration.id)}
              leftIcon={<SettingsIcon />}
            >
              Edit
            </Button>
          </Tooltip>
        )}
        
        {onDelete && (
          <Tooltip label="Delete">
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(integration.id)}
              leftIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Tooltip>
        )}
      </HStack>
    </Box>
  );
};

export default IntegrationCard;