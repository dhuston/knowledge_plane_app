import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  HStack,
  Badge,
  Divider,
  Icon,
  Button,
  useColorModeValue,
  SimpleGrid,
} from '@chakra-ui/react';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { FiArrowRight, FiUsers, FiUser, FiTarget, FiFolder, FiFlag } from 'react-icons/fi';

import { Relationship } from '../../types/entities';

interface RelationshipListProps {
  relationships: Relationship[];
  isLoading: boolean;
  entityType: MapNodeTypeEnum;
}

const RelationshipList: React.FC<RelationshipListProps> = ({
  relationships,
  isLoading,
  entityType,
}) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Group relationships by type
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    relationships.forEach(rel => {
      const type = rel.type || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(rel);
    });
    
    return groups;
  }, [relationships]);
  
  // Get relationship type color
  const getRelationshipColor = (type: MapEdgeTypeEnum): string => {
    switch (type) {
      case MapEdgeTypeEnum.REPORTS_TO:
        return 'pink';
      case MapEdgeTypeEnum.MEMBER_OF:
        return 'blue';
      case MapEdgeTypeEnum.LEADS:
        return 'red';
      case MapEdgeTypeEnum.OWNS:
        return 'purple';
      case MapEdgeTypeEnum.PARTICIPATES_IN:
        return 'cyan';
      case MapEdgeTypeEnum.ALIGNED_TO:
        return 'green';
      case MapEdgeTypeEnum.PARENT_OF:
        return 'orange';
      case MapEdgeTypeEnum.RELATED_TO:
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  // Get relationship type display name
  const getRelationshipName = (type: string): string => {
    // Convert SNAKE_CASE to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get icon for node type
  const getNodeIcon = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return FiUser;
      case MapNodeTypeEnum.TEAM:
        return FiUsers;
      case MapNodeTypeEnum.PROJECT:
        return FiFolder;
      case MapNodeTypeEnum.GOAL:
        return FiTarget;
      default:
        return FiFlag;
    }
  };

  // Get header text based on entity type
  const getHeaderText = (): string => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return 'Connections & Teams';
      case MapNodeTypeEnum.TEAM:
        return 'Members & Projects';
      case MapNodeTypeEnum.PROJECT:
        return 'Team & Contributors';
      case MapNodeTypeEnum.GOAL:
        return 'Aligned Projects';
      default:
        return 'Relationships';
    }
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
        </Box>
      </VStack>
    );
  }

  if (!relationships || relationships.length === 0) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        <Text color="gray.500" fontSize="sm" textAlign="center" py={2}>
          No relationships found
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box p={3} bg={headerBg} borderRadius="md">
        <Heading size="sm">{getHeaderText()}</Heading>
      </Box>
      
      {/* Group sections */}
      {Object.entries(groupedRelationships).map(([type, rels]) => (
        <Box key={type} mb={4}>
          <HStack spacing={2} mb={2}>
            <Badge colorScheme={getRelationshipColor(type as MapEdgeTypeEnum)}>
              {getRelationshipName(type)}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              ({rels.length})
            </Text>
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: rels.length > 3 ? 2 : 1 }} spacing={2}>
            {rels.map((rel, idx) => (
              <HStack 
                key={`${rel.nodeId || ''}-${idx}`}
                p={2}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.600' }}
                _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              >
                <Icon 
                  as={getNodeIcon(rel.nodeType || MapNodeTypeEnum.USER)} 
                  color={`${getRelationshipColor(type as MapEdgeTypeEnum)}.500`}
                  boxSize={4}
                />
                <Text fontSize="sm" flex="1" noOfLines={1}>
                  {rel.label || rel.name || 'Unknown'}
                </Text>
                <Button 
                  size="xs" 
                  variant="ghost" 
                  rightIcon={<FiArrowRight />} 
                  onClick={() => {
                    // This would typically navigate to the node
                    // We'll emit a custom event that parent components can listen for
                    const navigateEvent = new CustomEvent('navigate-to-node', {
                      detail: {
                        nodeId: rel.nodeId,
                        nodeType: rel.nodeType || 'UNKNOWN',
                        label: rel.label || rel.name || 'Unknown'
                      },
                      bubbles: true
                    });
                    document.dispatchEvent(navigateEvent);
                  }}
                >
                  View
                </Button>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </VStack>
  );
};

export default RelationshipList;