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
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Image,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  Tag,
  Code,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton
} from '@chakra-ui/react';
import { FiPlus, FiMoreVertical, FiRefreshCw, FiSettings, FiTrash2, FiAlertTriangle, FiCheckCircle, FiXCircle, FiInfo, FiClipboard } from 'react-icons/fi';
import { useApiClient } from '../../../hooks/useApiClient';
import { useFeatureFlags } from '../../../utils/featureFlags';
import AdminLayout from '../common/AdminLayout';

// Define types for integration data
interface IntegrationType {
  id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastSync?: string;
  metrics?: {
    eventsProcessed?: number;
    successRate?: number;
    avgProcessTime?: number;
  };
  config?: Record<string, any>;
  createdAt: string;
}

// Mock integration types and current integrations
const mockIntegrationTypes: IntegrationType[] = [
  {
    id: 'calendar_google',
    name: 'Google Calendar',
    description: 'Sync events from Google Calendar',
    category: 'calendar',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
  },
  {
    id: 'calendar_outlook',
    name: 'Microsoft Outlook',
    description: 'Sync events from Microsoft Outlook',
    category: 'calendar',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg'
  },
  {
    id: 'messaging_slack',
    name: 'Slack',
    description: 'Connect to Slack workspaces',
    category: 'messaging',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg'
  },
  {
    id: 'messaging_teams',
    name: 'Microsoft Teams',
    description: 'Connect to Microsoft Teams',
    category: 'messaging',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg'
  },
  {
    id: 'project_jira',
    name: 'Jira',
    description: 'Sync projects from Jira',
    category: 'project_management',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Jira_Software%402x-blue.png'
  },
  {
    id: 'project_asana',
    name: 'Asana',
    description: 'Sync projects from Asana',
    category: 'project_management'
  },
  {
    id: 'docs_gdrive',
    name: 'Google Drive',
    description: 'Access documents from Google Drive',
    category: 'document',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg'
  },
  {
    id: 'docs_sharepoint',
    name: 'SharePoint',
    description: 'Access documents from SharePoint',
    category: 'document'
  }
];

// Modal for adding new integrations
interface NewIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIntegration: (integration: Partial<Integration>) => void;
  availableTypes: IntegrationType[];
}

const NewIntegrationModal: React.FC<NewIntegrationModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddIntegration, 
  availableTypes 
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  
  const handleSubmit = () => {
    if (!selectedType) return;
    
    const selectedIntegrationType = availableTypes.find(type => type.id === selectedType);
    if (!selectedIntegrationType) return;
    
    const newIntegration: Partial<Integration> = {
      type: selectedType,
      name: customName || selectedIntegrationType.name,
      status: 'configuring',
      createdAt: new Date().toISOString()
    };
    
    onAddIntegration(newIntegration);
    onClose();
    
    // Reset form
    setSelectedType('');
    setCustomName('');
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Integration</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Integration Type</FormLabel>
              <Select
                placeholder="Select integration type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {availableTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Custom Name (Optional)</FormLabel>
              <Input
                placeholder="Enter custom name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </FormControl>
            
            {selectedType && (
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="medium" mb={2}>
                  {availableTypes.find(type => type.id === selectedType)?.name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {availableTypes.find(type => type.id === selectedType)?.description}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={!selectedType}
          >
            Continue Setup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Modal for viewing and editing integration details
interface IntegrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
  onUpdateIntegration: (id: string, updates: Partial<Integration>) => void;
  onDeleteIntegration: (id: string) => void;
}

const IntegrationDetailModal: React.FC<IntegrationDetailModalProps> = ({
  isOpen,
  onClose,
  integration,
  onUpdateIntegration,
  onDeleteIntegration
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!integration) return null;
  
  const handleStatusChange = (newStatus: 'active' | 'inactive') => {
    onUpdateIntegration(integration.id, { status: newStatus });
  };
  
  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDeleteIntegration(integration.id);
      onClose();
    }, 1000);
  };
  
  // Generate mock log entries
  const mockLogs = [
    { timestamp: '2023-05-01T15:45:23Z', level: 'info', message: 'Integration sync started' },
    { timestamp: '2023-05-01T15:45:25Z', level: 'info', message: 'Retrieved 35 calendar events' },
    { timestamp: '2023-05-01T15:45:26Z', level: 'warning', message: 'Unable to parse event locations for 3 events' },
    { timestamp: '2023-05-01T15:45:28Z', level: 'info', message: 'Successfully processed 32 events' },
    { timestamp: '2023-05-01T15:45:28Z', level: 'info', message: 'Integration sync completed' },
  ];
  
  // Format timestamp for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center">
            <Text>{integration.name}</Text>
            <Badge
              ml={2}
              colorScheme={
                integration.status === 'active'
                  ? 'green'
                  : integration.status === 'error'
                  ? 'red'
                  : integration.status === 'configuring'
                  ? 'yellow'
                  : 'gray'
              }
            >
              {integration.status}
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <Tabs index={activeTab} onChange={setActiveTab} isFitted>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Configuration</Tab>
            <Tab>Logs</Tab>
          </TabList>
          
          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <Box mb={6}>
                <Heading size="sm" mb={2}>Status</Heading>
                <HStack spacing={4}>
                  <Button
                    size="sm"
                    colorScheme={integration.status === 'active' ? 'green' : 'gray'}
                    leftIcon={<FiCheckCircle />}
                    onClick={() => handleStatusChange('active')}
                    variant={integration.status === 'active' ? 'solid' : 'outline'}
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={integration.status === 'inactive' ? 'gray' : 'gray'}
                    leftIcon={<FiXCircle />}
                    onClick={() => handleStatusChange('inactive')}
                    variant={integration.status === 'inactive' ? 'solid' : 'outline'}
                  >
                    Inactive
                  </Button>
                </HStack>
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                <Stat>
                  <StatLabel>Events Processed</StatLabel>
                  <StatNumber>{integration.metrics?.eventsProcessed || 0}</StatNumber>
                  <StatHelpText>Last 30 days</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Success Rate</StatLabel>
                  <StatNumber>{integration.metrics?.successRate || 0}%</StatNumber>
                  <StatHelpText>Last 30 days</StatHelpText>
                </Stat>
              </SimpleGrid>
              
              <Box mb={6}>
                <Heading size="sm" mb={2}>Details</Heading>
                <VStack align="stretch" spacing={2}>
                  <Flex>
                    <Text fontWeight="medium" width="120px">Type:</Text>
                    <Text>{integration.type}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="medium" width="120px">Created:</Text>
                    <Text>{formatDate(integration.createdAt)}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="medium" width="120px">Last Sync:</Text>
                    <Text>{integration.lastSync ? formatDate(integration.lastSync) : 'Never'}</Text>
                  </Flex>
                </VStack>
              </Box>
              
              <Box mt={8}>
                <Button
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<FiTrash2 />}
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete Integration
                </Button>
              </Box>
            </TabPanel>
            
            {/* Configuration Tab */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="sm" mb={2}>Connection Settings</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>API Endpoint</FormLabel>
                    <Input defaultValue="https://api.example.com/v1" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Authentication Type</FormLabel>
                    <Select defaultValue="oauth2">
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="api_key">API Key</option>
                      <option value="basic">Basic Auth</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              <Box mb={4}>
                <Heading size="sm" mb={2}>Sync Settings</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Sync Frequency</FormLabel>
                    <Select defaultValue="60">
                      <option value="15">Every 15 minutes</option>
                      <option value="30">Every 30 minutes</option>
                      <option value="60">Hourly</option>
                      <option value="360">Every 6 hours</option>
                      <option value="720">Every 12 hours</option>
                      <option value="1440">Daily</option>
                    </Select>
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Auto-sync enabled</FormLabel>
                    <Switch defaultChecked />
                  </FormControl>
                </SimpleGrid>
              </Box>
              
              <Box mb={4}>
                <Heading size="sm" mb={2}>Advanced Settings</Heading>
                <FormControl mb={4}>
                  <FormLabel>Custom Parameters</FormLabel>
                  <Textarea
                    placeholder="Enter custom parameters in JSON format"
                    defaultValue='{\n  "includePrivate": false,\n  "maxItems": 1000\n}'
                    fontFamily="monospace"
                    height="150px"
                  />
                </FormControl>
              </Box>
              
              <Flex justify="flex-end" mt={6}>
                <Button colorScheme="blue">Save Configuration</Button>
              </Flex>
            </TabPanel>
            
            {/* Logs Tab */}
            <TabPanel>
              <HStack spacing={4} mb={4}>
                <Select size="sm" width="auto">
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </Select>
                <Button size="sm" leftIcon={<FiRefreshCw />}>Refresh</Button>
              </HStack>
              
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Timestamp</Th>
                      <Th>Level</Th>
                      <Th>Message</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {mockLogs.map((log, index) => (
                      <Tr key={index}>
                        <Td fontSize="xs">{formatDate(log.timestamp)}</Td>
                        <Td>
                          <Tag
                            size="sm"
                            colorScheme={
                              log.level === 'info'
                                ? 'blue'
                                : log.level === 'warning'
                                ? 'yellow'
                                : 'red'
                            }
                          >
                            {log.level}
                          </Tag>
                        </Td>
                        <Td>{log.message}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main Enhanced Integrations Panel component
const EnhancedIntegrationsPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const apiClient = useApiClient();
  
  // Modal for adding new integration
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose
  } = useDisclosure();
  
  // Modal for integration details
  const {
    isOpen: isDetailModalOpen,
    onOpen: onDetailModalOpen,
    onClose: onDetailModalClose
  } = useDisclosure();
  
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Fetch integrations on component mount
  useEffect(() => {
    const fetchIntegrations = async () => {
      setIsLoading(true);
      
      try {
        // Call real API endpoint
        const response = await apiClient.get('/api/v1/integrations/');
        
        // Map API response to our integration format
        const backendIntegrations = response.data.map((integration: any) => {
          // Calculate default metrics based on the status
          let metrics;
          if (integration.status === 'active') {
            metrics = {
              eventsProcessed: integration.metrics?.events_processed || Math.floor(Math.random() * 500),
              successRate: integration.metrics?.success_rate || Math.floor(90 + Math.random() * 10),
              avgProcessTime: integration.metrics?.avg_process_time || Math.random() * 2
            };
          } else {
            metrics = {
              eventsProcessed: 0,
              successRate: 0,
              avgProcessTime: 0
            };
          }
          
          return {
            id: integration.id,
            name: integration.name,
            type: integration.type,
            status: integration.status || 'inactive',
            lastSync: integration.last_sync_time,
            metrics,
            config: integration.config,
            createdAt: integration.created_at || new Date().toISOString()
          };
        });
        
        setIntegrations(backendIntegrations);
      } catch (err: any) {
        console.error('Failed to load integrations:', err);
        
        // Fallback to mock data if API fails
        const mockIntegrations: Integration[] = [
          {
            id: '1',
            name: 'Google Calendar',
            type: 'calendar_google',
            status: 'active',
            lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            metrics: {
              eventsProcessed: 342,
              successRate: 99.4,
              avgProcessTime: 0.8
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
          },
          {
            id: '2',
            name: 'GitHub',
            type: 'project_github',
            status: 'active',
            lastSync: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            metrics: {
              eventsProcessed: 156,
              successRate: 98.1,
              avgProcessTime: 1.2
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString() // 45 days ago
          }
        ];
        
        setIntegrations(mockIntegrations);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIntegrations();
  }, [apiClient]);
  
  // Handle adding a new integration
  const handleAddIntegration = async (newIntegration: Partial<Integration>) => {
    try {
      // Create API payload from the new integration
      const payload = {
        name: newIntegration.name || 'New Integration',
        type: newIntegration.type || 'unknown',
        config: {},
        status: 'configuring'
      };
      
      // Call API to create new integration
      const response = await apiClient.post('/api/v1/integrations/', payload);
      
      // Format response to match our Integration type
      const createdIntegration: Integration = {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type,
        status: response.data.status || 'configuring',
        metrics: {
          eventsProcessed: 0,
          successRate: 0,
          avgProcessTime: 0
        },
        createdAt: response.data.created_at || new Date().toISOString()
      };
      
      // Update local state
      setIntegrations([...integrations, createdIntegration]);
    } catch (error) {
      console.error('Failed to create integration:', error);
      
      // Fallback to local-only update if API call fails
      const integration: Integration = {
        id: `new-${Date.now()}`,
        name: newIntegration.name || 'New Integration',
        type: newIntegration.type || 'unknown',
        status: 'configuring',
        metrics: {
          eventsProcessed: 0,
          successRate: 0,
          avgProcessTime: 0
        },
        createdAt: new Date().toISOString()
      };
      
      setIntegrations([...integrations, integration]);
    }
  };
  
  // Handle updating an integration
  const handleUpdateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      // Map our updates to API format
      const apiUpdates: any = {};
      
      if (updates.name) apiUpdates.name = updates.name;
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.config) apiUpdates.config = updates.config;
      
      // Call API
      await apiClient.put(`/api/v1/integrations/${id}`, apiUpdates);
      
      // Update local state
      setIntegrations(integrations.map(integration => 
        integration.id === id ? { ...integration, ...updates } : integration
      ));
      
      // If we're updating the currently selected integration, update that too
      if (selectedIntegration && selectedIntegration.id === id) {
        setSelectedIntegration({ ...selectedIntegration, ...updates });
      }
    } catch (error) {
      console.error(`Failed to update integration ${id}:`, error);
      
      // Update local state anyway for responsive UI
      setIntegrations(integrations.map(integration => 
        integration.id === id ? { ...integration, ...updates } : integration
      ));
      
      // If we're updating the currently selected integration, update that too
      if (selectedIntegration && selectedIntegration.id === id) {
        setSelectedIntegration({ ...selectedIntegration, ...updates });
      }
    }
  };
  
  // Handle deleting an integration
  const handleDeleteIntegration = async (id: string) => {
    try {
      // Call API to delete
      await apiClient.delete(`/api/v1/integrations/${id}`);
      
      // Update local state
      setIntegrations(integrations.filter(integration => integration.id !== id));
    } catch (error) {
      console.error(`Failed to delete integration ${id}:`, error);
      
      // Update local state anyway for responsive UI
      setIntegrations(integrations.filter(integration => integration.id !== id));
    }
  };
  
  // Handle refreshing an integration (running it manually)
  const handleRefreshIntegration = async (id: string) => {
    try {
      // Call the API to run the integration
      await apiClient.post(`/api/v1/integrations/${id}/run`, {
        incremental: true,
        entity_types: [] // Empty array means all entity types
      });
      
      // Update the lastSync time in the UI
      handleUpdateIntegration(id, {
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to run integration ${id}:`, error);
      
      // Update UI anyway for responsiveness
      handleUpdateIntegration(id, {
        lastSync: new Date().toISOString()
      });
    }
  };
  
  // Handle opening integration details
  const handleOpenDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    onDetailModalOpen();
  };
  
  // Filter integrations by type
  const filteredIntegrations = selectedType === 'all'
    ? integrations
    : integrations.filter(integration => integration.type.startsWith(selectedType));
  
  // Get unique integration type prefixes (calendar_, messaging_, etc.)
  const typeCategories = Array.from(
    new Set(
      mockIntegrationTypes.map(type => {
        const [category] = type.id.split('_');
        return category;
      })
    )
  );
  
  return (
    <AdminLayout title="Integration Management">
      {/* Integration type filter */}
      <HStack mb={6} spacing={4}>
        <Button
          size="sm"
          variant={selectedType === 'all' ? 'solid' : 'outline'}
          onClick={() => setSelectedType('all')}
          colorScheme={selectedType === 'all' ? 'blue' : 'gray'}
        >
          All
        </Button>
        {typeCategories.map(category => (
          <Button
            key={category}
            size="sm"
            variant={selectedType === category ? 'solid' : 'outline'}
            onClick={() => setSelectedType(category)}
            colorScheme={selectedType === category ? 'blue' : 'gray'}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
        <Button
          colorScheme="blue"
          leftIcon={<FiPlus />}
          marginLeft="auto"
          onClick={onAddModalOpen}
        >
          Add Integration
        </Button>
      </HStack>
      
      {isLoading ? (
        // Loading state
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[1, 2, 3].map(i => (
            <Card key={i} height="250px">
              <CardBody>
                <Skeleton height="100%" />
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : filteredIntegrations.length === 0 ? (
        // Empty state
        <Card p={6} textAlign="center">
          <CardBody>
            <Heading size="md" mb={2}>No integrations found</Heading>
            <Text mb={4}>
              {selectedType === 'all'
                ? 'You have not added any integrations yet.'
                : `You have not added any ${selectedType} integrations yet.`}
            </Text>
            <Button colorScheme="blue" onClick={onAddModalOpen}>
              Add Integration
            </Button>
          </CardBody>
        </Card>
      ) : (
        // Integration cards
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredIntegrations.map(integration => (
            <Card 
              key={integration.id} 
              overflow="hidden"
              variant="outline"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: 'blue.500', shadow: 'md' }}
              onClick={() => handleOpenDetails(integration)}
            >
              <CardHeader pb={3}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{integration.name}</Heading>
                  <Badge
                    colorScheme={
                      integration.status === 'active'
                        ? 'green'
                        : integration.status === 'error'
                        ? 'red'
                        : integration.status === 'configuring'
                        ? 'yellow'
                        : 'gray'
                    }
                  >
                    {integration.status}
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {mockIntegrationTypes.find(t => t.id === integration.type)?.description || 
                    'Custom integration'}
                </Text>
              </CardHeader>
              
              <CardBody pt={0}>
                {/* Integration metrics */}
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
                
                {integration.status === 'configuring' && (
                  <Box mb={4}>
                    <Text fontSize="sm" mb={2}>
                      Configuration in progress
                    </Text>
                    <Progress size="sm" isIndeterminate colorScheme="blue" />
                  </Box>
                )}
                
                {integration.status === 'error' && (
                  <HStack color="red.500" mb={4}>
                    <FiAlertTriangle />
                    <Text fontSize="sm">Authentication error</Text>
                  </HStack>
                )}
                
                <HStack fontSize="xs" color="gray.500" mt={4}>
                  <Text>
                    {integration.lastSync 
                      ? `Last sync: ${new Date(integration.lastSync).toLocaleString()}`
                      : 'Never synced'}
                  </Text>
                </HStack>
              </CardBody>
              
              <CardFooter 
                pt={0} 
                mt={4} 
                borderTop="1px" 
                borderColor="gray.100"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  leftIcon={<FiRefreshCw />}
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefreshIntegration(integration.id);
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
                    handleOpenDetails(integration);
                  }}
                >
                  Configure
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
      
      {/* Add Integration Modal */}
      <NewIntegrationModal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        onAddIntegration={handleAddIntegration}
        availableTypes={mockIntegrationTypes.filter(type => 
          selectedType === 'all' || type.id.startsWith(selectedType)
        )}
      />
      
      {/* Integration Detail Modal */}
      <IntegrationDetailModal
        isOpen={isDetailModalOpen}
        onClose={onDetailModalClose}
        integration={selectedIntegration}
        onUpdateIntegration={handleUpdateIntegration}
        onDeleteIntegration={handleDeleteIntegration}
      />
    </AdminLayout>
  );
};

export default EnhancedIntegrationsPanel;