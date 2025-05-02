import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Divider,
  Badge,
  SimpleGrid,
  useColorModeValue,
  Collapse,
  Button,
  HStack,
  Icon,
  Link,
  Image,
  Flex,
} from '@chakra-ui/react';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import { FiChevronDown, FiChevronUp, FiExternalLink, FiImage } from 'react-icons/fi';
import { EntityDataType } from '../../types/entities';
import SafeMarkdown from '../../components/common/SafeMarkdown';

interface EntityDetailsProps {
  data: EntityDataType;
  selectedNode: MapNode;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({ data, selectedNode }) => {
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const badgeColor = useColorModeValue('gray.600', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const expandBg = useColorModeValue('gray.50', 'gray.700');
  const linkColor = useColorModeValue('blue.600', 'blue.300');

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
          !['id', 'name', 'label', 'description', 'type', 'created_at', 'updated_at'].includes(key)
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
            <Box key={key} p={2} borderRadius="md" _hover={{ bg: expandBg }}>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                {key}
              </Text>
              <Text fontSize="sm" color={textColor}>
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
            mt={2}
          >
            {showAllProperties ? 'Show Less' : `Show More (${detailsArray.length - 6} more)`}
          </Button>
        )}
      </>
    );
  };

  // Enhanced markdown rendering with support for images and links using SafeMarkdown component
  const renderRichContent = () => {
    if (!data?.description) return null;
    
    const description = data.description || '';
    
    // Check if description is long
    const isLongDescription = description.length > 300;
    const displayText = isLongDescription && !isDescriptionExpanded 
      ? description.substring(0, 300) + '...' 
      : description;
    
    // Check for URLs and image patterns
    const hasUrls = /https?:\/\/[^\s]+/g.test(description);
    const hasImages = /!\[.*?\]\(.*?\)/g.test(description);
    
    const markdownStyles = {
      '& h1, & h2, & h3': { 
        fontWeight: 'bold',
        marginTop: '0.8em',
        marginBottom: '0.5em'
      },
      '& h1': { fontSize: 'xl' },
      '& h2': { fontSize: 'lg' },
      '& h3': { fontSize: 'md' },
      '& p': { marginBottom: '0.8em' },
      '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.8em' },
      '& li': { marginBottom: '0.3em' },
      '& a': { color: linkColor, textDecoration: 'underline' },
      '& code': { 
        bg: 'gray.100', 
        _dark: { bg: 'gray.700' },
        p: '0.2em',
        borderRadius: 'sm',
        fontFamily: 'monospace'
      },
      '& pre': {
        bg: 'gray.100',
        _dark: { bg: 'gray.700' },
        p: '0.8em',
        borderRadius: 'md',
        overflowX: 'auto'
      },
      '& blockquote': {
        borderLeft: '3px solid',
        borderColor: 'gray.300',
        _dark: { borderColor: 'gray.500' },
        paddingLeft: '1em',
        fontStyle: 'italic'
      },
      '& img': { 
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 'md',
        my: '0.8em'
      }
    };
    
    return (
      <Box mt={2} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Description</Heading>
          <Divider />
          
          {hasImages && (
            <HStack spacing={2} color="gray.500" fontSize="sm">
              <Icon as={FiImage} />
              <Text>Contains embedded images</Text>
            </HStack>
          )}
          
          <Box className="markdown-content">
            <SafeMarkdown 
              content={displayText}
              fontSize="sm"
              color={textColor}
              whiteSpace="pre-wrap"
              allowLinks={true}
              allowImages={true}
              sx={markdownStyles}
            />
          </Box>
          
          {/* Expand/Collapse button for long descriptions */}
          {isLongDescription && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              rightIcon={isDescriptionExpanded ? <FiChevronUp /> : <FiChevronDown />}
              alignSelf="center"
            >
              {isDescriptionExpanded ? 'Show Less' : 'Read More'}
            </Button>
          )}
          
          {/* External Links Section */}
          {hasUrls && (
            <Box mt={2}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                External Links
              </Text>
              <HStack>
                <Icon as={FiExternalLink} color={linkColor} />
                <Link href="#" color={linkColor} fontSize="xs">
                  View All Links
                </Link>
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  // Enhanced status badge with more details
  const renderStatusBadge = () => {
    if (!data?.status) return null;
    
    let colorScheme = 'gray';
    const status = data.status.toLowerCase();
    let statusIcon = null;
    
    if (status.includes('active') || status.includes('on track')) {
      colorScheme = 'green';
    } else if (status.includes('blocked') || status.includes('risk')) {
      colorScheme = 'red';
    } else if (status.includes('review') || status.includes('paused')) {
      colorScheme = 'orange';
    } else if (status.includes('complete')) {
      colorScheme = 'blue';
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
        {statusIcon && <Box mr={1}>{statusIcon}</Box>}
        {data.status}
      </Badge>
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
        <Flex justifyContent="space-between" fontSize="xs" color="gray.500">
          {data.created_at && (
            <Text>
              Created: {new Date(data.created_at).toLocaleDateString()}
            </Text>
          )}
          {data.updated_at && (
            <Text>
              Updated: {new Date(data.updated_at).toLocaleDateString()}
            </Text>
          )}
        </Flex>
      </Box>
    );
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Header with optional status */}
      <Box p={3} bg={headerBg} borderRadius="md" display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="sm">{getDetailsSectionTitle(selectedNode.type)}</Heading>
        {renderStatusBadge()}
      </Box>
      
      {/* Rich Content (Description) */}
      {renderRichContent()}
      
      {/* Properties Grid */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Properties</Heading>
          <Divider />
          {renderEntityProperties()}
          {renderMetadata()}
        </VStack>
      </Box>
    </VStack>
  );
};

export default EntityDetails;