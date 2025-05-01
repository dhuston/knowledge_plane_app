import React from 'react';
import { Text, Box, useColorModeValue, Tooltip, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// Define the types for our highlighted entities
export interface HighlightedEntity {
  type: 'project' | 'person' | 'team' | 'goal' | 'event' | 'knowledge_asset';
  text: string;
  id?: string; // Optional reference to the entity in the database
}

export interface HighlightedTextSegment {
  type: 'text' | 'entity';
  content: string;
  entity?: HighlightedEntity; // Only present if type is 'entity'
}

interface HighlightedTextProps {
  segments: HighlightedTextSegment[];
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ segments }) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Define colors for different entity types
  const getEntityColor = (entityType: HighlightedEntity['type']) => {
    switch (entityType) {
      case 'project':
        return useColorModeValue('blue.600', 'blue.300');
      case 'person':
        return useColorModeValue('purple.600', 'purple.300');
      case 'team':
        return useColorModeValue('teal.600', 'teal.300');
      case 'goal':
        return useColorModeValue('green.600', 'green.300');
      case 'event':
        return useColorModeValue('orange.600', 'orange.300');
      case 'knowledge_asset':
        return useColorModeValue('red.600', 'red.300');
      default:
        return useColorModeValue('gray.800', 'white');
    }
  };

  // Define background colors for hover effect
  const getEntityBgHover = (entityType: HighlightedEntity['type']) => {
    switch (entityType) {
      case 'project':
        return useColorModeValue('blue.50', 'blue.900');
      case 'person':
        return useColorModeValue('purple.50', 'purple.900');
      case 'team':
        return useColorModeValue('teal.50', 'teal.900');
      case 'goal':
        return useColorModeValue('green.50', 'green.900');
      case 'event':
        return useColorModeValue('orange.50', 'orange.900');
      case 'knowledge_asset':
        return useColorModeValue('red.50', 'red.900');
      default:
        return useColorModeValue('gray.100', 'gray.700');
    }
  };

  // Get a human-readable label for entity types
  const getEntityTypeLabel = (entityType: HighlightedEntity['type']) => {
    switch (entityType) {
      case 'project':
        return 'Project';
      case 'person':
        return 'Person';
      case 'team':
        return 'Team';
      case 'goal':
        return 'Goal';
      case 'event':
        return 'Calendar Event';
      case 'knowledge_asset':
        return 'Knowledge Asset';
      default:
        return 'Entity';
    }
  };

  // Handle entity click
  const handleEntityClick = (entity: HighlightedEntity) => {
    if (!entity.id) {
      toast({
        title: "Entity details not available",
        description: `No details available for this ${getEntityTypeLabel(entity.type).toLowerCase()}.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Navigate to the appropriate page based on entity type
    switch (entity.type) {
      case 'project':
        navigate(`/projects/${entity.id}`);
        break;
      case 'team':
        navigate(`/team/${entity.id}`);
        break;
      case 'person':
        // For now, just show a toast since we might not have user detail pages
        toast({
          title: "Person Details",
          description: `Viewing details for ${entity.text}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        break;
      case 'goal':
        navigate(`/goals/${entity.id}`);
        break;
      case 'knowledge_asset':
        // Assuming knowledge assets are viewed in the context of their project
        toast({
          title: "Knowledge Asset",
          description: `Viewing details for ${entity.text}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        break;
      case 'event':
        // For calendar events, we might not have a dedicated page
        toast({
          title: "Calendar Event",
          description: `Event: ${entity.text}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        break;
      default:
        toast({
          title: "Entity Details",
          description: `Viewing details for ${entity.text}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
    }
  };

  return (
    <Text fontSize="md" lineHeight="tall">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <React.Fragment key={index}>{segment.content}</React.Fragment>;
        } else if (segment.type === 'entity' && segment.entity) {
          const entityColor = getEntityColor(segment.entity.type);
          const entityBgHover = getEntityBgHover(segment.entity.type);
          const entityTypeLabel = getEntityTypeLabel(segment.entity.type);

          return (
            <Tooltip
              key={index}
              label={`${entityTypeLabel}: ${segment.entity.text}${segment.entity.id ? ' (Click to view details)' : ''}`}
              placement="top"
              hasArrow
            >
              <Box
                as="span"
                fontWeight="bold"
                color={entityColor}
                px={1}
                py={0.5}
                borderRadius="md"
                cursor="pointer"
                display="inline"
                _hover={{
                  bg: entityBgHover,
                  textDecoration: segment.entity.id ? 'underline' : 'none',
                }}
                transition="all 0.2s"
                onClick={() => handleEntityClick(segment.entity!)}
                role="button"
                aria-label={`View details for ${segment.entity.text}`}
              >
                {segment.content}
              </Box>
            </Tooltip>
          );
        }
        return null;
      })}
    </Text>
  );
};

export default HighlightedText;
