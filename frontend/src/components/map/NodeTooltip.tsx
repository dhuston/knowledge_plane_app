import React, { useCallback } from 'react';
import {
  Box,
  Text,
  Flex,
  Badge,
  Divider,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiInfo, FiUsers, FiCalendar, FiLink, FiExternalLink } from 'react-icons/fi';
import { MapNode, MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';

interface NodeTooltipProps {
  node: MapNode | null;
  position: { x: number; y: number } | null;
  onViewDetails: (nodeId: string) => void;
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, position, onViewDetails }) => {
  // Color mode values - define outside conditional to avoid React Hook rules issues
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  if (!node || !position) return null;

  // Get type color based on node type
  const getTypeColor = (type: MapNodeTypeEnum): string => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'blue';
      case MapNodeTypeEnum.TEAM:
        return 'cyan';
      case MapNodeTypeEnum.PROJECT:
        return 'orange';
      case MapNodeTypeEnum.GOAL:
        return 'green';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return 'purple';
      case MapNodeTypeEnum.DEPARTMENT:
        return 'teal';
      case MapNodeTypeEnum.TEAM_CLUSTER:
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // Get relationship color
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
        return 'blue';
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

  // Get icon based on node type
  const getTypeIcon = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return FiUsers;
      case MapNodeTypeEnum.TEAM:
        return FiUsers;
      case MapNodeTypeEnum.PROJECT:
        return FiCalendar;
      case MapNodeTypeEnum.GOAL:
        return FiInfo;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return FiLink;
      case MapNodeTypeEnum.DEPARTMENT:
        return FiUsers;
      default:
        return FiInfo;
    }
  };

  // Get relationship display name
  const getRelationshipName = (type: MapEdgeTypeEnum): string => {
    switch (type) {
      case MapEdgeTypeEnum.REPORTS_TO:
        return 'Reports to';
      case MapEdgeTypeEnum.MEMBER_OF:
        return 'Member of';
      case MapEdgeTypeEnum.LEADS:
        return 'Leads';
      case MapEdgeTypeEnum.OWNS:
        return 'Owns';
      case MapEdgeTypeEnum.PARTICIPATES_IN:
        return 'Participates in';
      case MapEdgeTypeEnum.ALIGNED_TO:
        return 'Aligned to';
      case MapEdgeTypeEnum.PARENT_OF:
        return 'Parent of';
      case MapEdgeTypeEnum.RELATED_TO:
        return 'Related to';
      default:
        return type.toLowerCase().replace('_', ' ');
    }
  };

  // Extract relevant data based on node type
  const getNodeDetails = () => {
    const details: { label: string; value: string }[] = [];
    
    switch (node.type) {
      case MapNodeTypeEnum.USER:
        if (typeof node.data.email === 'string') {
          details.push({ label: 'Email', value: node.data.email });
        }
        if (typeof node.data.role === 'string') {
          details.push({ label: 'Role', value: node.data.role });
        }
        break;
      case MapNodeTypeEnum.TEAM:
        if (typeof node.data.memberCount === 'number') {
          details.push({ label: 'Members', value: node.data.memberCount.toString() });
        }
        break;
      case MapNodeTypeEnum.PROJECT:
        if (typeof node.data.status === 'string') {
          details.push({ label: 'Status', value: node.data.status });
        }
        if (typeof node.data.dueDate === 'string') {
          details.push({ label: 'Due Date', value: node.data.dueDate });
        }
        break;
      case MapNodeTypeEnum.GOAL:
        if (typeof node.data.progress === 'number') {
          details.push({ label: 'Progress', value: `${node.data.progress}%` });
        }
        if (typeof node.data.status === 'string') {
          details.push({ label: 'Status', value: node.data.status });
        }
        break;
      default:
        break;
    }
    
    // Add relationships if available
    if (node.data.relationships && Array.isArray(node.data.relationships)) {
      node.data.relationships.forEach((rel: { type: MapEdgeTypeEnum; nodeId: string; label: string }) => {
        if (rel.type && rel.label) {
          details.push({
            label: getRelationshipName(rel.type),
            value: rel.label
          });
        }
      });
    }
    
    return details;
  };

  const details = getNodeDetails();
  const TypeIcon = getTypeIcon(node.type);

  return (
    <Box
      position="absolute"
      left={`${position.x}px`}
      top={`${position.y}px`}
      transform="translate(-50%, -100%) translateY(-10px)"
      bg={bg}
      borderRadius="md"
      boxShadow="md"
      border="1px solid"
      borderColor={borderColor}
      p={3}
      maxWidth="300px"
      zIndex={1000}
      pointerEvents="auto"
    >
      <VStack align="stretch" spacing={2}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon as={TypeIcon} color={`${getTypeColor(node.type)}.500`} />
            <Badge colorScheme={getTypeColor(node.type)} textTransform="capitalize">
              {node.type}
            </Badge>
          </HStack>
        </Flex>
        
        {/* Title */}
        <Text fontWeight="bold" fontSize="md">
          {node.label}
        </Text>
        
        {/* Details */}
        {details.length > 0 && (
          <>
            <Divider />
            <VStack align="stretch" spacing={1}>
              {details.map((detail, index) => {
                // Check if this is a relationship detail
                const isRelationship = ['reports to', 'member of', 'leads', 'owns', 
                  'participates in', 'aligned to', 'parent of', 'related to'].includes(detail.label.toLowerCase());
                
                // Apply different styles for relationships
                return (
                  <Flex key={index} justify="space-between" align="center">
                    {isRelationship ? (
                      <>
                        <Text fontSize="xs" color="gray.500">
                          {detail.label}:
                        </Text>
                        <HStack spacing={1}>
                          <Box
                            h="2px"
                            w="8px"
                            borderRadius="1px"
                            bg={`${getRelationshipColor(detail.label.toUpperCase().replace(' ', '_') as MapEdgeTypeEnum)}.500`}
                          />
                          <Text fontSize="xs" fontWeight="medium">{detail.value}</Text>
                        </HStack>
                      </>
                    ) : (
                      <>
                        <Text fontSize="xs" color="gray.500">{detail.label}:</Text>
                        <Text fontSize="xs" fontWeight="medium">{detail.value}</Text>
                      </>
                    )}
                  </Flex>
                );
              })}
            </VStack>
          </>
        )}
        
        {/* View Details Hint - using onViewDetails passed as prop but not directly used */}
        <Flex 
          justify="flex-end" 
          align="center" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (node && onViewDetails) {
              console.log("Tooltip details clicked for", node.id);
              onViewDetails(node.id);
            }
          }}
          cursor="pointer"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Text fontSize="xs" color="gray.500">Click for details</Text>
          <Icon as={FiExternalLink} boxSize={3} ml={1} color="gray.500" />
        </Flex>
      </VStack>
      
      {/* Triangle pointer */}
      <Box
        position="absolute"
        bottom="-5px"
        left="50%"
        transform="translateX(-50%) rotate(45deg)"
        width="10px"
        height="10px"
        bg={bg}
        borderRight="1px solid"
        borderBottom="1px solid"
        borderColor={borderColor}
      />
    </Box>
  );
};

export default NodeTooltip;
