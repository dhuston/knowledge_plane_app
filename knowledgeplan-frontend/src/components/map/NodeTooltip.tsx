import React from 'react';
import {
  Box,
  Text,
  Flex,
  Badge,
  Divider,
  Button,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiInfo, FiUsers, FiCalendar, FiLink, FiExternalLink } from 'react-icons/fi';
import { MapNode, MapNodeTypeEnum } from '../../types/map';

interface NodeTooltipProps {
  node: MapNode | null;
  position: { x: number; y: number } | null;
  onViewDetails: (nodeId: string) => void;
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, position, onViewDetails }) => {
  if (!node || !position) return null;

  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
      pointerEvents="none"
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
              {details.map((detail, index) => (
                <Flex key={index} justify="space-between">
                  <Text fontSize="xs" color="gray.500">{detail.label}:</Text>
                  <Text fontSize="xs" fontWeight="medium">{detail.value}</Text>
                </Flex>
              ))}
            </VStack>
          </>
        )}
        
        {/* View Details Hint */}
        <Flex justify="flex-end" align="center">
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
