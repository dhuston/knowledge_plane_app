import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Divider,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Button,
  HStack,
  Icon,
  Link,
  Flex,
  Tooltip,
  Tag,
  TagLabel,
  Grid,
  GridItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiExternalLink, 
  FiImage, 
  FiInfo, 
  FiCalendar, 
  FiClock, 
  FiLink, 
  FiFlag, 
  FiTag, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArchive,
  FiCode
} from 'react-icons/fi';
import { EntityDataType } from '../../types/entities';
import SimpleMarkdown from '../common/SimpleMarkdown';

interface EntityDetailsProps {
  data: EntityDataType;
  selectedNode: MapNode;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({ data, selectedNode }) => {
  // State variables
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { isOpen: isLinksModalOpen, onOpen: onLinksModalOpen, onClose: onLinksModalClose } = useDisclosure();
  
  // Theme colors
  const badgeColor = useColorModeValue('gray.600', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const expandBg = useColorModeValue('gray.50', 'gray.700');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Extract tags and categories if they exist
  const tags = useMemo(() => {
    const tagList = [];
    
    // Check for tags array
    if (data?.tags && Array.isArray(data.tags)) {
      return data.tags;
    }
    
    // Check for categories array
    if (data?.categories && Array.isArray(data.categories)) {
      return data.categories;
    }
    
    // Check for comma-separated tags string
    if (typeof data?.tags === 'string') {
      return data.tags.split(',').map(tag => tag.trim());
    }
    
    // Check for keywords array or string
    if (data?.keywords) {
      if (Array.isArray(data.keywords)) {
        return data.keywords;
      } else if (typeof data.keywords === 'string') {
        return data.keywords.split(',').map(tag => tag.trim());
      }
    }
    
    return [];
  }, [data]);

  // Extract links from description
  const extractedLinks = useMemo(() => {
    if (!data?.description) return [];
    
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    
    // Extract direct URLs
    let match;
    while ((match = urlRegex.exec(data.description)) !== null) {
      if (!links.some(link => link.url === match[1])) {
        links.push({ 
          url: match[1], 
          label: match[1].replace(/^https?:\/\//, '').split('/')[0]
        });
      }
    }
    
    // Extract markdown links
    let mdMatch;
    while ((mdMatch = markdownLinkRegex.exec(data.description)) !== null) {
      if (!links.some(link => link.url === mdMatch[2])) {
        links.push({ 
          url: mdMatch[2], 
          label: mdMatch[1]
        });
      }
    }
    
    return links;
  }, [data?.description]);

  // Generate details based on entity type and data
  const renderEntityProperties = () => {
    if (!data) return null;

    // Create details array from data properties
    const detailsArray = Object.entries(data)
      .filter(([key, value]) => {
        // Filter out complex objects, arrays, null values, and common fields we display elsewhere
        return (
          value !== null &&
          typeof value !== 'object' &&
          !['id', 'name', 'label', 'description', 'type', 'created_at', 'updated_at', 'tags', 'categories', 'keywords'].includes(key)
        );
      })
      .map(([key, value]) => {
        // Format the key for display
        const formattedKey = key
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return { key: formattedKey, value };
      });

    // If there are no properties to display
    if (detailsArray.length === 0) {
      return (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No additional details available
        </Text>
      );
    }

    // Display only first few properties unless expanded
    const visibleProperties = showAllProperties ? detailsArray : detailsArray.slice(0, 6);
    const hasMoreProperties = detailsArray.length > 6;

    return (
      <>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
          {visibleProperties.map(({ key, value }) => (
            <Box 
              key={key} 
              p={3} 
              borderRadius="md" 
              _hover={{ bg: expandBg }} 
              transition="background 0.2s ease"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={1}>
                {key}
              </Text>
              <Text fontSize="sm" color={textColor} fontWeight="medium">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
        
        {/* Show more/less button */}
        {hasMoreProperties && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowAllProperties(!showAllProperties)}
            rightIcon={showAllProperties ? <FiChevronUp /> : <FiChevronDown />}
            alignSelf="center"
            mt={3}
          >
            {showAllProperties ? 'Show Less' : `Show More (${detailsArray.length - 6} more)`}
          </Button>
        )}
      </>
    );
  };

  // Enhanced markdown rendering with support for images, links and code highlighting
  const renderRichContent = () => {
    if (!data?.description) return null;
    
    const description = data.description || '';
    
    // Check if description is long
    const isLongDescription = description.length > 300;
    const displayText = isLongDescription && !isDescriptionExpanded 
      ? description.substring(0, 300) + '...' 
      : description;
    
    // Check for content types
    const hasUrls = extractedLinks.length > 0;
    const hasImages = /!\[.*?\]\(.*?\)/g.test(description);
    const hasCode = /```[\s\S]*?```/g.test(description) || /`[^`]+`/g.test(description);
    
    return (
      <Box mt={2} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          {/* Description Header */}
          <Flex justify="space-between" align="center">
            <Heading size="sm">Description</Heading>
            
            {/* Content type indicators */}
            <HStack spacing={2}>
              {hasImages && (
                <Tooltip label="Contains images" placement="top">
                  <Icon as={FiImage} color={iconColor} />
                </Tooltip>
              )}
              {hasCode && (
                <Tooltip label="Contains code snippets" placement="top">
                  <Icon as={FiCode} color={iconColor} />
                </Tooltip>
              )}
              {hasUrls && (
                <Tooltip label="Contains links" placement="top">
                  <Icon as={FiLink} color={iconColor} />
                </Tooltip>
              )}
            </HStack>
          </Flex>
          <Divider />
          
          {/* Enhanced markdown content */}
          <Box className="markdown-content" position="relative">
            <SimpleMarkdown 
              content={displayText}
              fontSize="sm"
              color={textColor}
              allowLinks={true}
              allowImages={true}
            />
            
            {/* Gradient overlay for collapsed text */}
            {isLongDescription && !isDescriptionExpanded && (
              <Box 
                position="absolute" 
                bottom="0" 
                left="0" 
                right="0" 
                height="60px" 
                bgGradient={useColorModeValue(
                  'linear(to-t, white, transparent)',
                  'linear(to-t, gray.800, transparent)'
                )}
              />
            )}
          </Box>
          
          {/* Expand/Collapse button for long descriptions */}
          {isLongDescription && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              rightIcon={isDescriptionExpanded ? <FiChevronUp /> : <FiChevronDown />}
              alignSelf="center"
              mt={2}
            >
              {isDescriptionExpanded ? 'Show Less' : 'Read More'}
            </Button>
          )}
          
          {/* External Links Section - enhanced to show extracted links */}
          {hasUrls && (
            <Box mt={2} pt={2} borderTopWidth="1px" borderColor={borderColor}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  External Links
                </Text>
                {extractedLinks.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    rightIcon={<FiExternalLink />}
                    onClick={onLinksModalOpen}
                  >
                    View All ({extractedLinks.length})
                  </Button>
                )}
              </HStack>
              
              {/* Show up to 3 links inline */}
              <SimpleGrid columns={{ base: 1, md: extractedLinks.length > 1 ? 2 : 1 }} spacing={2}>
                {extractedLinks.slice(0, 3).map((link, idx) => (
                  <HStack 
                    key={idx} 
                    spacing={2} 
                    p={2} 
                    borderRadius="md"
                    _hover={{ bg: expandBg }}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Icon as={FiExternalLink} color={linkColor} flexShrink={0} />
                    <Link 
                      href={link.url} 
                      color={linkColor} 
                      fontSize="sm"
                      isExternal
                      noOfLines={1}
                      fontWeight="medium"
                    >
                      {link.label}
                    </Link>
                  </HStack>
                ))}
              </SimpleGrid>
              
              {/* Links modal for all links */}
              <Modal isOpen={isLinksModalOpen} onClose={onLinksModalClose} size="md">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>External Links</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <List spacing={3}>
                      {extractedLinks.map((link, idx) => (
                        <ListItem key={idx}>
                          <ListIcon as={FiExternalLink} color={linkColor} />
                          <Link 
                            href={link.url} 
                            color={linkColor} 
                            isExternal
                            fontWeight="medium"
                          >
                            {link.label}
                          </Link>
                        </ListItem>
                      ))}
                    </List>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={onLinksModalClose}>Close</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  // Enhanced status badge with more details and icons
  const renderStatusBadge = () => {
    if (!data?.status) return null;
    
    let colorScheme = 'gray';
    const status = data.status.toLowerCase();
    let StatusIcon = FiInfo; // Default icon
    
    if (status.includes('active') || status.includes('on track')) {
      colorScheme = 'green';
      StatusIcon = FiCheckCircle;
    } else if (status.includes('blocked') || status.includes('risk')) {
      colorScheme = 'red';
      StatusIcon = FiAlertCircle;
    } else if (status.includes('review') || status.includes('paused')) {
      colorScheme = 'orange';
      StatusIcon = FiClock;
    } else if (status.includes('complete')) {
      colorScheme = 'blue';
      StatusIcon = FiCheckCircle;
    } else if (status.includes('archive')) {
      colorScheme = 'purple';
      StatusIcon = FiArchive;
    }
    
    return (
      <Badge 
        colorScheme={colorScheme} 
        fontSize="sm" 
        px={2} 
        py={1} 
        borderRadius="full"
        display="flex"
        alignItems="center"
      >
        <Icon as={StatusIcon} mr={1} boxSize="12px" />
        {data.status}
      </Badge>
    );
  };

  // Render tags section
  const renderTags = () => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <Box mt={2}>
        <HStack spacing={2} flexWrap="wrap">
          {tags.map((tag, index) => (
            <Tag 
              key={index} 
              size="sm" 
              borderRadius="full" 
              variant="subtle"
              bg={tagBg}
              color={linkColor}
              mb={1}
            >
              <Icon as={FiTag} boxSize="10px" mr={1} />
              <TagLabel>{tag}</TagLabel>
            </Tag>
          ))}
        </HStack>
      </Box>
    );
  };

  // Get entity-specific section title
  const getDetailsSectionTitle = (type: MapNodeTypeEnum): string => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'User Information';
      case MapNodeTypeEnum.TEAM:
        return 'Team Details';
      case MapNodeTypeEnum.PROJECT:
        return 'Project Information';
      case MapNodeTypeEnum.GOAL:
        return 'Goal Information';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return 'Knowledge Asset Details';
      case MapNodeTypeEnum.DEPARTMENT:
        return 'Department Information';
      default:
        return 'Details';
    }
  };

  // Render metadata section with creation and update times
  const renderMetadata = () => {
    if (!data?.created_at && !data?.updated_at) return null;
    
    return (
      <Box mt={3} pt={3} borderTopWidth="1px" borderColor={borderColor}>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          {data.created_at && (
            <GridItem>
              <HStack spacing={1}>
                <Icon as={FiCalendar} color="gray.500" boxSize="12px" />
                <Text fontSize="xs" color="gray.500">
                  Created: {new Date(data.created_at).toLocaleDateString()}
                </Text>
              </HStack>
            </GridItem>
          )}
          {data.updated_at && (
            <GridItem>
              <HStack spacing={1} justifyContent={data.created_at ? "flex-end" : "flex-start"}>
                <Icon as={FiClock} color="gray.500" boxSize="12px" />
                <Text fontSize="xs" color="gray.500">
                  Updated: {new Date(data.updated_at).toLocaleDateString()}
                </Text>
              </HStack>
            </GridItem>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with optional status */}
      <Box 
        p={4} 
        bg={headerBg} 
        borderRadius="md" 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        borderWidth="1px"
        borderColor={borderColor}
        transition="all 0.2s"
      >
        <VStack align="flex-start" spacing={1}>
          <Heading size="sm">{getDetailsSectionTitle(selectedNode.type)}</Heading>
          {renderTags()}
        </VStack>
        {renderStatusBadge()}
      </Box>
      
      {/* Rich Content (Description) */}
      {renderRichContent()}
      
      {/* Properties Grid */}
      <Box 
        p={4} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor} 
        bg={sectionBg}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Properties</Heading>
            <Tooltip label="Entity properties and metadata" placement="top">
              <Icon as={FiInfo} color="gray.400" />
            </Tooltip>
          </Flex>
          <Divider />
          {renderEntityProperties()}
          {renderMetadata()}
        </VStack>
      </Box>
    </VStack>
  );
};

export default EntityDetails;