import React from 'react';
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

interface SimpleNodeTooltipProps {
  node: MapNode | null;
  position: { x: number; y: number } | null;
  onViewDetails: (nodeId: string) => void;
}

/**
 * SimpleNodeTooltip - A lightweight tooltip specifically for map nodes
 */
const SimpleNodeTooltip: React.FC<SimpleNodeTooltipProps> = ({ node, position, onViewDetails }) => {
  // ALWAYS call hooks at the top level, before any conditional returns
  // Color mode values
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Return null if no node or position - AFTER all hooks are called
  if (!node || !position) return null;
  
  // Type color mapping
  const typeColors: Record<MapNodeTypeEnum, string> = {
    [MapNodeTypeEnum.USER]: 'blue',
    [MapNodeTypeEnum.TEAM]: 'cyan',
    [MapNodeTypeEnum.PROJECT]: 'orange',
    [MapNodeTypeEnum.GOAL]: 'green',
    [MapNodeTypeEnum.KNOWLEDGE_ASSET]: 'purple',
    [MapNodeTypeEnum.DEPARTMENT]: 'teal',
    [MapNodeTypeEnum.TEAM_CLUSTER]: 'blue'
  };
  
  // Icon mapping
  const typeIcons: Record<MapNodeTypeEnum, React.ComponentType> = {
    [MapNodeTypeEnum.USER]: FiUsers,
    [MapNodeTypeEnum.TEAM]: FiUsers,
    [MapNodeTypeEnum.PROJECT]: FiCalendar,
    [MapNodeTypeEnum.GOAL]: FiInfo,
    [MapNodeTypeEnum.KNOWLEDGE_ASSET]: FiLink,
    [MapNodeTypeEnum.DEPARTMENT]: FiUsers,
    [MapNodeTypeEnum.TEAM_CLUSTER]: FiUsers
  };
  
  // Extract basic node details (limited to improve performance)
  const getBasicDetails = () => {
    const details = [];
    
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
        break;
      case MapNodeTypeEnum.GOAL:
        if (typeof node.data.progress === 'number') {
          details.push({ label: 'Progress', value: `${node.data.progress}%` });
        }
        break;
    }
    
    // Limit to max 3 details for performance
    return details.slice(0, 3);
  };

  const details = getBasicDetails();
  const TypeIcon = typeIcons[node.type] || FiInfo;
  const typeColor = typeColors[node.type] || 'gray';

  return (
    <Box
      position="fixed"
      left={position.x}
      top={position.y - 10}
      transform="translate(-50%, -100%)"
      bg={bg}
      borderRadius="md"
      boxShadow="md"
      border="1px solid"
      borderColor={borderColor}
      p={3}
      maxWidth="250px"
      zIndex={1000}
      pointerEvents="auto"
    >
      <VStack align="stretch" spacing={2}>
        {/* Header with type info */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon as={TypeIcon} color={`${typeColor}.500`} />
            <Badge colorScheme={typeColor} textTransform="capitalize">
              {node.type}
            </Badge>
          </HStack>
        </Flex>
        
        {/* Node name */}
        <Text fontWeight="bold" fontSize="md" lineHeight="short">
          {node.label}
        </Text>
        
        {/* Basic details */}
        {details.length > 0 && (
          <>
            <Divider />
            <VStack align="stretch" spacing={1}>
              {details.map((detail, index) => (
                <Flex key={index} justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.500">{detail.label}:</Text>
                  <Text fontSize="xs" fontWeight="medium">{detail.value}</Text>
                </Flex>
              ))}
            </VStack>
          </>
        )}
        
        {/* Click for details hint */}
        <Flex 
          justify="flex-end" 
          align="center" 
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (node && onViewDetails) {
              onViewDetails(node.id);
            }
          }}
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

export default SimpleNodeTooltip;