import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Switch,
  FormControl,
  FormLabel,
  Text,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Flex,
  IconButton,
  Tooltip,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  HStack,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  FormHelperText,
  Skeleton,
  Icon
} from '@chakra-ui/react';
import { FiSearch, FiInfo, FiCalendar, FiSettings } from 'react-icons/fi';
import { useFeatureFlags, FeatureFlags } from '../../../utils/featureFlags';
import AdminLayout from '../common/AdminLayout';

// Extended feature flag metadata - in a real app this would come from backend
interface EnhancedFeatureFlag {
  key: keyof FeatureFlags;
  name: string;
  description: string;
  category: string;
  status: string;
  lastUpdated?: string;
  owner?: string;
  tenantOverrides?: boolean;
  scheduleEnabled?: boolean;
}

// Configuration modal component
interface FeatureConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: EnhancedFeatureFlag | null;
}

const FeatureConfigModal: React.FC<FeatureConfigModalProps> = ({ isOpen, onClose, feature }) => {
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (feature) {
      setScheduleEnabled(feature.scheduleEnabled || false);
      setNotes('');
    }
  }, [feature]);

  const handleSave = () => {
    // Here we would save the configuration to backend
    console.log('Saving configuration:', {
      feature: feature?.key,
      scheduleEnabled,
      startDate,
      endDate,
      notes
    });
    onClose();
  };
  
  if (!feature) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configure Feature: {feature.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4} fontSize="sm" color="gray.600">
            {feature.description}
          </Text>
          <Divider mb={4} />
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontWeight="medium">Feature ID</FormLabel>
              <Input value={feature.key} isReadOnly bg="gray.50" />
              <FormHelperText>Unique identifier used in code</FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="medium">Category</FormLabel>
              <Select defaultValue={feature.category}>
                <option value="Real-time Features">Real-time Features</option>
                <option value="Visualization Features">Visualization Features</option>
                <option value="UI Components">UI Components</option>
                <option value="Navigation">Navigation</option>
                <option value="Admin">Admin</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="medium">Schedule</FormLabel>
              <Switch
                isChecked={scheduleEnabled}
                onChange={() => setScheduleEnabled(!scheduleEnabled)}
                mb={2}
              />
              <FormHelperText>Enable/disable the feature on schedule</FormHelperText>
              
              {scheduleEnabled && (
                <HStack mt={3} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Start Date</FormLabel>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">End Date</FormLabel>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormControl>
                </HStack>
              )}
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="medium">Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this feature flag configuration..."
              />
              <FormHelperText>Internal notes visible to other admins</FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Configuration
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Enhanced feature flags component
const EnhancedFeatureFlags: React.FC = () => {
  const { flags, toggleFeature } = useFeatureFlags();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [enhancedFlags, setEnhancedFlags] = useState<EnhancedFeatureFlag[]>([]);
  
  // Modal for feature configuration
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFeature, setSelectedFeature] = useState<EnhancedFeatureFlag | null>(null);
  
  // Function to format feature name for display
  const formatFeatureName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/^enable /, ''); // Remove "enable" prefix
  };
  
  // Load enhanced flag data from backend or generate from basic flags
  useEffect(() => {
    const loadEnhancedFlags = async () => {
      setIsLoading(true);
      
      try {
        // Try to get debug info about feature flags
        console.log('[Debug] Attempting to fetch feature flags debug info');
        let debugInfo = null;
        
        try {
          const { apiClient } = await import('../../../api/client');
          const response = await apiClient.get('/debug/feature-flags-status');
          debugInfo = response;
          console.log('[Debug] Feature flags debug info:', debugInfo);
        } catch (error) {
          console.warn('[Debug] Could not fetch feature flags debug info:', error);
        }
        
        // Transform basic flags into enhanced flags with metadata
        const enhancedData: EnhancedFeatureFlag[] = Object.keys(flags).map(key => {
          const flagKey = key as keyof FeatureFlags;
          const category = getFeatureCategory(flagKey);
          
          return {
            key: flagKey,
            name: formatFeatureName(flagKey),
            description: getFeatureDescription(flagKey),
            category,
            status: flags[flagKey] ? 'active' : 'inactive',
            // Use actual backend data or mock data
            lastUpdated: debugInfo ? 'Updated from backend' : getMockLastUpdated(),
            owner: 'System',
            tenantOverrides: ['enableIntegrations', 'enableAnalytics'].includes(flagKey),
            scheduleEnabled: false
          };
        });
        
        setEnhancedFlags(enhancedData);
      } catch (error) {
        console.error('[Debug] Error loading enhanced flags:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEnhancedFlags();
  }, [flags]);
  
  // Helper to get mock last updated date
  const getMockLastUpdated = () => {
    const days = Math.floor(Math.random() * 14);
    const hours = Math.floor(Math.random() * 24);
    
    if (days === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };
  
  // Helper to get feature category
  const getFeatureCategory = (key: keyof FeatureFlags): string => {
    const categories: Record<string, string> = {
      enableDeltaStream: 'Real-time Features',
      enableIntegrations: 'UI Components',
      enableAnalytics: 'Visualization Features',
      enableSuggestions: 'UI Components',
      enableActivityTimeline: 'UI Components',
      enableTeamClustering: 'Visualization Features',
      enableHierarchyNavigator: 'Navigation'
    };
    
    return categories[key] || 'Other';
  };
  
  // Helper to get feature description
  const getFeatureDescription = (key: keyof FeatureFlags): string => {
    const descriptions: Record<string, string> = {
      enableDeltaStream: 'Enables real-time updates to data visualizations using server-sent events',
      enableIntegrations: 'Enables the integrations panel for connecting with external services',
      enableAnalytics: 'Activates advanced analytics and data visualization features',
      enableSuggestions: 'Shows AI-powered entity suggestions in context panels',
      enableActivityTimeline: 'Displays timeline of recent activity in entity panels',
      enableTeamClustering: 'Groups team members into clusters based on collaboration patterns',
      enableHierarchyNavigator: 'Enables the organizational hierarchy navigator component'
    };
    
    return descriptions[key] || 'No description available';
  };
  
  // Handle feature toggle
  const handleToggleFeature = (key: keyof FeatureFlags) => {
    toggleFeature(key);
    
    // Update our enhanced flags array
    setEnhancedFlags(prevFlags =>
      prevFlags.map(flag =>
        flag.key === key
          ? { ...flag, status: !flags[key] ? 'active' : 'inactive' }
          : flag
      )
    );
  };
  
  // Handle opening configuration modal
  const handleConfigureFeature = (feature: EnhancedFeatureFlag) => {
    setSelectedFeature(feature);
    onOpen();
  };
  
  // Filter features based on search and category
  const filteredFeatures = enhancedFlags.filter(flag => {
    const matchesSearch = searchQuery === '' || 
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group features by category after filtering
  const groupedFeatures: Record<string, EnhancedFeatureFlag[]> = {};
  filteredFeatures.forEach(flag => {
    if (!groupedFeatures[flag.category]) {
      groupedFeatures[flag.category] = [];
    }
    groupedFeatures[flag.category].push(flag);
  });
  
  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set(enhancedFlags.map(flag => flag.category))];
  
  return (
    <AdminLayout title="Feature Management">
      {/* Search and filter */}
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          width="auto"
          minWidth="200px"
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </HStack>
      
      {isLoading ? (
        // Loading state
        <VStack spacing={4} align="stretch">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardBody>
                <Skeleton height="60px" />
              </CardBody>
            </Card>
          ))}
        </VStack>
      ) : Object.keys(groupedFeatures).length === 0 ? (
        // No results state
        <Card p={6} textAlign="center">
          <Text>No features found matching your filters</Text>
        </Card>
      ) : (
        // Feature list
        <Accordion allowMultiple defaultIndex={[0]} width="100%">
          {Object.entries(groupedFeatures).map(([category, categoryFlags]) => (
            <AccordionItem key={category} borderWidth="1px" borderRadius="md" mb={4}>
              <h2>
                <AccordionButton py={3}>
                  <Box flex="1" textAlign="left" fontWeight="medium">
                    {category}
                    <Badge ml={2} colorScheme="blue" fontSize="xs">
                      {categoryFlags.length}
                    </Badge>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  {categoryFlags.map(flag => (
                    <Card key={flag.key} variant="outline">
                      <CardBody p={4}>
                        <Flex align="center" justify="space-between">
                          <Box flex="1">
                            <Flex align="center" mb={1}>
                              <Heading size="sm">{flag.name}</Heading>
                              
                              {/* Feature status badge */}
                              <Badge
                                ml={2}
                                colorScheme={flag.status === 'active' ? 'green' : 'gray'}
                                variant="subtle"
                              >
                                {flag.status}
                              </Badge>
                              
                              {/* Tenant overrides indicator */}
                              {flag.tenantOverrides && (
                                <Tooltip label="Has tenant-specific overrides">
                                  <Box as="span" ml={2}>
                                    <Icon as={FiInfo} color="blue.400" />
                                  </Box>
                                </Tooltip>
                              )}
                              
                              {/* Schedule indicator */}
                              {flag.scheduleEnabled && (
                                <Tooltip label="Has scheduled activation/deactivation">
                                  <Box as="span" ml={2}>
                                    <Icon as={FiCalendar} color="purple.400" />
                                  </Box>
                                </Tooltip>
                              )}
                            </Flex>
                            
                            <Text fontSize="sm" color="gray.600">
                              {flag.description}
                            </Text>
                            
                            <HStack mt={2} fontSize="xs" color="gray.500" spacing={4}>
                              <Text>ID: {flag.key}</Text>
                              <Text>Updated: {flag.lastUpdated}</Text>
                            </HStack>
                          </Box>
                          
                          <HStack spacing={3}>
                            <Tooltip label="Configure">
                              <IconButton
                                icon={<FiSettings />}
                                aria-label="Configure feature"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleConfigureFeature(flag)}
                              />
                            </Tooltip>
                            
                            <FormControl display="flex" alignItems="center" width="auto">
                              <Switch
                                id={String(flag.key)}
                                isChecked={flags[flag.key]}
                                onChange={() => handleToggleFeature(flag.key)}
                                colorScheme="blue"
                              />
                            </FormControl>
                          </HStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      {/* Feature configuration modal */}
      <FeatureConfigModal 
        isOpen={isOpen} 
        onClose={onClose} 
        feature={selectedFeature} 
      />
    </AdminLayout>
  );
};

export default EnhancedFeatureFlags;