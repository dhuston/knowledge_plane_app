import React from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Divider,
  Badge,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { MapNode, MapNodeTypeEnum } from '../../types/map';

interface EntityDetailsProps {
  data: any;
  selectedNode: MapNode;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({ data, selectedNode }) => {
  const badgeColor = useColorModeValue('gray.600', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

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
          !['id', 'name', 'label', 'description', 'type'].includes(key)
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

    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
        {detailsArray.map(({ key, value }) => (
          <Box key={key}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              {key}
            </Text>
            <Text fontSize="sm" color={textColor}>
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    );
  };

  // Render markdown content if available
  const renderRichContent = () => {
    if (!data?.description) return null;
    
    // Use a simple regex to detect if the content might contain markdown
    const hasPossibleMarkdown = /[*#\[\]_`]/.test(data.description);
    
    return (
      <Box>
        {hasPossibleMarkdown ? (
          // We don't need to install a dependency for this implementation plan
          // In a real implementation, we would use a library like react-markdown
          <Box
            className="markdown-content"
            sx={{
              '& h1, & h2, & h3': { 
                fontWeight: 'bold',
                marginTop: '0.5em',
                marginBottom: '0.5em'
              },
              '& h1': { fontSize: 'xl' },
              '& h2': { fontSize: 'lg' },
              '& h3': { fontSize: 'md' },
              '& p': { marginBottom: '0.5em' },
              '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
              '& li': { marginBottom: '0.2em' },
              '& a': { color: 'blue.500', textDecoration: 'underline' },
              '& code': { 
                bg: 'gray.100', 
                _dark: { bg: 'gray.700' },
                p: '0.2em',
                borderRadius: 'sm'
              },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: 'gray.300',
                _dark: { borderColor: 'gray.500' },
                paddingLeft: '1em',
                fontStyle: 'italic'
              }
            }}
          >
            <Text whiteSpace="pre-wrap" fontSize="sm" color={textColor}>
              {data.description}
            </Text>
          </Box>
        ) : (
          <Text whiteSpace="pre-wrap" fontSize="sm" color={textColor}>
            {data.description}
          </Text>
        )}
      </Box>
    );
  };

  // Render status badge if available
  const renderStatusBadge = () => {
    if (!data?.status) return null;
    
    let colorScheme = 'gray';
    const status = data.status.toLowerCase();
    
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
      <Badge colorScheme={colorScheme} fontSize="sm">
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
      <Divider />
      <VStack align="stretch" spacing={3}>
        <Text fontSize="sm" fontWeight="medium">Properties</Text>
        {renderEntityProperties()}
      </VStack>
    </VStack>
  );
};

export default EntityDetails;