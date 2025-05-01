import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Divider,
  Progress,
  useColorModeValue,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  InputGroup,
  Input,
  InputRightElement,
  useToast,
} from '@chakra-ui/react';
import { 
  FiCalendar, 
  FiClock, 
  FiFlag, 
  FiLink, 
  FiAlertTriangle,
  FiUser,
  FiUsers,
  FiExternalLink
} from 'react-icons/fi';
import { MapNode } from '../../../types/map';
import { ProjectRead } from '../../../types/project';

interface ProjectPanelProps {
  data: ProjectRead;
  selectedNode: MapNode;
  projectOverlaps?: Record<string, string[]>;
  getProjectNameById?: (id: string) => string | undefined;
}

const ProjectPanel: React.FC<ProjectPanelProps> = ({ 
  data, 
  selectedNode,
  projectOverlaps = {},
  getProjectNameById = () => undefined
}) => {
  const [assetLinkUrl, setAssetLinkUrl] = useState<string>('');
  const [isLinkingAsset, setIsLinkingAsset] = useState<boolean>(false);
  
  const toast = useToast();
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const overlapBg = useColorModeValue('orange.50', 'orange.900');
  const overlapBorder = useColorModeValue('orange.200', 'orange.700');
  
  // Get project status color
  const getStatusColor = (status: string = ''): string => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('active') || statusLower.includes('on track')) {
      return 'green';
    } else if (statusLower.includes('planning')) {
      return 'blue';
    } else if (statusLower.includes('paused') || statusLower.includes('blocked')) {
      return 'orange';
    } else if (statusLower.includes('completed')) {
      return 'purple';
    } else if (statusLower.includes('risk') || statusLower.includes('behind')) {
      return 'red';
    }
    
    return 'gray';
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dateString?: string): string => {
    if (!dateString) return 'No deadline';
    
    try {
      const deadline = new Date(dateString);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
      if (diffDays === 0) return 'Due today';
      return `${diffDays} days remaining`;
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Calculate project timeline progress
  const calculateProgress = (): number => {
    if (!data.start_date || !data.end_date) return 0;
    
    try {
      const start = new Date(data.start_date).getTime();
      const end = new Date(data.end_date).getTime();
      const now = new Date().getTime();
      
      if (now <= start) return 0;
      if (now >= end) return 100;
      
      const total = end - start;
      const elapsed = now - start;
      return Math.round((elapsed / total) * 100);
    } catch (e) {
      return 0;
    }
  };
  
  // Get timeline color based on progress and status
  const getTimelineColor = (): string => {
    const progress = calculateProgress();
    const statusLower = data.status?.toLowerCase() || '';
    
    if (statusLower.includes('risk') || statusLower.includes('behind') || statusLower.includes('blocked')) {
      return 'red';
    }
    
    if (progress > 90) return 'green';
    if (progress > 70) return 'blue';
    if (progress > 50) return 'cyan';
    
    return 'blue';
  };
  
  // Handle link asset (placeholder)
  const handleLinkAsset = () => {
    if (!assetLinkUrl) return;
    
    const currentLinks = (data.properties?.linkedAssets as string[] || []);
    if (currentLinks.includes(assetLinkUrl)) {
      toast({
        title: "Link already exists",
        status: "info",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setIsLinkingAsset(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Asset linked",
        status: "success",
        duration: 3000,
        isClosable: true
      });
      setAssetLinkUrl('');
      setIsLinkingAsset(false);
    }, 1000);
  };
  
  // Get project overlaps
  const overlaps = projectOverlaps[data.id] || [];

  return (
    <VStack spacing={4} align="stretch">
      {/* Project Header */}
      <Box p={4} borderRadius="md" bg={headerBg}>
        <VStack align="flex-start" spacing={2}>
          <HStack width="100%" justifyContent="space-between" wrap="wrap">
            <Heading size="md">{data.name}</Heading>
            {data.status && (
              <Badge colorScheme={getStatusColor(data.status)}>
                {data.status}
              </Badge>
            )}
          </HStack>
          {data.description && (
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {data.description}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Timeline Information */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Heading size="sm">Project Timeline</Heading>
            
            {data.end_date && (
              <Tooltip label={formatDate(data.end_date)}>
                <Badge variant="outline" colorScheme={getTimelineColor()}>
                  {getDaysRemaining(data.end_date)}
                </Badge>
              </Tooltip>
            )}
          </HStack>
          <Divider />
          
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiCalendar} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Start Date</Text>
            </HStack>
            <Text fontSize="sm">{formatDate(data.start_date)}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiClock} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Due Date</Text>
            </HStack>
            <Text fontSize="sm">{formatDate(data.end_date)}</Text>
          </HStack>
          
          {(data.start_date && data.end_date) && (
            <Box pt={2}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs">Timeline Progress</Text>
                <Text fontSize="xs">{calculateProgress()}%</Text>
              </HStack>
              <Progress 
                value={calculateProgress()} 
                size="sm" 
                colorScheme={getTimelineColor()} 
                borderRadius="full"
              />
            </Box>
          )}
        </VStack>
      </Box>

      {/* Goal Alignment */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Heading size="sm">Strategic Alignment</Heading>
            {data.goal_id && (
              <Button size="xs" colorScheme="blue" variant="ghost">
                Change
              </Button>
            )}
          </HStack>
          <Divider />
          
          {data.goal_id ? (
            <HStack>
              <Icon as={FiFlag} color="green.500" />
              <Text fontSize="sm">Aligns to goal: {data.goal?.title || 'Loading...'}</Text>
            </HStack>
          ) : (
            <HStack>
              <Icon as={FiFlag} color="gray.500" />
              <Text fontSize="sm" color="gray.500">No goal alignment set</Text>
            </HStack>
          )}
        </VStack>
      </Box>
      
      {/* Team Information */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Team Information</Heading>
          <Divider />
          
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiUsers} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Owning Team</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="medium">
              {data.owning_team?.name || 'Not assigned'}
            </Text>
          </HStack>
          
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiUser} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Lead</Text>
            </HStack>
            <Text fontSize="sm">
              {data.lead?.name || 'Not assigned'}
            </Text>
          </HStack>
          
          {data.contributors && data.contributors.length > 0 && (
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiUsers} color="blue.500" />
                <Text fontSize="sm" color="gray.500">Contributors</Text>
              </HStack>
              <Text fontSize="sm">{data.contributors.length} members</Text>
            </HStack>
          )}
        </VStack>
      </Box>
      
      {/* Potential Overlaps */}
      {overlaps.length > 0 && (
        <Alert 
          status="warning" 
          variant="subtle" 
          borderRadius="md"
          bg={overlapBg}
          borderWidth="1px"
          borderColor={overlapBorder}
        >
          <AlertIcon as={FiAlertTriangle} />
          <Box flex="1">
            <AlertTitle fontSize="sm">Potential Project Overlap</AlertTitle>
            <VStack align="stretch" mt={2} spacing={1}>
              {overlaps.map(overlapId => (
                <HStack key={overlapId} justify="space-between">
                  <Text fontSize="xs">
                    {getProjectNameById(overlapId) || `Project ${overlapId.substring(0, 8)}...`}
                  </Text>
                  <Button size="xs" variant="link" colorScheme="blue" rightIcon={<FiExternalLink />}>
                    View
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Alert>
      )}

      {/* Linked Assets */}
      <Accordion defaultIndex={[]} allowToggle borderWidth="1px" borderRadius="md" borderColor={borderColor}>
        <AccordionItem border="none">
          <AccordionButton px={4} py={3} bg={sectionBg} borderRadius="md">
            <HStack flex="1" justify="space-between">
              <HStack>
                <Icon as={FiLink} />
                <Heading size="sm">Linked Assets</Heading>
              </HStack>
              <Badge>
                {(data.properties?.linkedAssets as string[] || []).length}
              </Badge>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4} borderTopWidth="1px" borderColor={borderColor} bg={sectionBg}>
            <VStack align="stretch" spacing={3}>
              <InputGroup size="sm">
                <Input 
                  placeholder="Add document or resource URL" 
                  value={assetLinkUrl}
                  onChange={(e) => setAssetLinkUrl(e.target.value)}
                  isDisabled={isLinkingAsset}
                />
                <InputRightElement width="4.5rem">
                  <Button 
                    h="1.75rem" 
                    size="xs" 
                    onClick={handleLinkAsset}
                    isLoading={isLinkingAsset}
                    isDisabled={!assetLinkUrl}
                  >
                    Add Link
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              {/* Linked assets list */}
              {(data.properties?.linkedAssets as string[] || []).length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                  No linked assets yet
                </Text>
              )}
              
              {(data.properties?.linkedAssets as string[] || []).map((url, index) => (
                <HStack key={index} justify="space-between" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Text 
                    fontSize="sm" 
                    noOfLines={1} 
                    color="blue.500"
                    as="a" 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    flex="1"
                  >
                    {url}
                  </Text>
                  <Icon as={FiExternalLink} color="gray.500" />
                </HStack>
              ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </VStack>
  );
};

export default ProjectPanel;