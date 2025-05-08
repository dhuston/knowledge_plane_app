/**
 * NodeTooltip.tsx
 * Enhanced tooltip component for map nodes with rich information display
 */

import React, { useMemo } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { MapNode, MapNodeTypeEnum } from '../../../../types/map';

interface NodeTooltipProps {
  /** The node to display tooltip for */
  node: MapNode;
  /** Screen position to place tooltip */
  position: { x: number; y: number };
  /** Event handler to view full details */
  onViewDetails?: (nodeId: string) => void;
}

/**
 * Enhanced tooltip component for map nodes
 * Displays rich information based on node type
 */
const NodeTooltip: React.FC<NodeTooltipProps> = ({ 
  node,
  position, 
  onViewDetails 
}) => {
  // Styling
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tooltipShadow = 'lg';
  
  // Get type-specific information and styling
  const { badge, information } = useMemo(() => {
    // Default badge styling by type
    const badgeColors = {
      [MapNodeTypeEnum.USER]: 'blue',
      [MapNodeTypeEnum.TEAM]: 'green',
      [MapNodeTypeEnum.PROJECT]: 'purple',
      [MapNodeTypeEnum.GOAL]: 'orange',
      [MapNodeTypeEnum.DEPARTMENT]: 'teal',
      [MapNodeTypeEnum.KNOWLEDGE_ASSET]: 'pink',
      [MapNodeTypeEnum.TEAM_CLUSTER]: 'cyan',
      [MapNodeTypeEnum.UNKNOWN]: 'gray',
    };
    
    // Basic info structure
    const info = [];
    
    // Extract information based on node type
    switch (node.type) {
      case MapNodeTypeEnum.USER:
        if (node.data?.title) info.push({ label: 'Title', value: node.data.title });
        if (node.data?.email) info.push({ label: 'Email', value: node.data.email });
        break;
        
      case MapNodeTypeEnum.TEAM:
        if (node.data?.memberCount) info.push({ label: 'Members', value: node.data.memberCount });
        if (node.data?.department) info.push({ label: 'Department', value: node.data.department });
        break;
        
      case MapNodeTypeEnum.PROJECT:
        if (node.data?.status) info.push({ 
          label: 'Status', 
          value: node.data.status,
          badge: getStatusBadge(String(node.data.status)) 
        });
        if (node.data?.dueDate) info.push({ label: 'Due', value: formatDate(node.data.dueDate) });
        break;
        
      case MapNodeTypeEnum.GOAL:
        if (node.data?.progress !== undefined) {
          const progress = Number(node.data.progress);
          info.push({ 
            label: 'Progress', 
            value: `${Math.round(progress * 100)}%`,
            badge: getProgressBadge(progress)
          });
        }
        if (node.data?.targetDate) info.push({ label: 'Target', value: formatDate(node.data.targetDate) });
        break;
        
      case MapNodeTypeEnum.DEPARTMENT:
        if (node.data?.teamCount) info.push({ label: 'Teams', value: node.data.teamCount });
        if (node.data?.headcount) info.push({ label: 'Headcount', value: node.data.headcount });
        break;
        
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        if (node.data?.type) info.push({ label: 'Type', value: node.data.type });
        if (node.data?.author) info.push({ label: 'Author', value: node.data.author });
        break;
    }
    
    return {
      badge: {
        text: node.type.replace('_', ' '),
        colorScheme: badgeColors[node.type] || 'gray',
      },
      information: info
    };
  }, [node]);
  
  // Position the tooltip with offsets to not block the cursor
  const tooltipStyle = {
    left: `${position.x + 15}px`, // Offset from cursor
    top: `${position.y - 10}px`,
  };

  return (
    <Box
      position="fixed"
      style={tooltipStyle}
      zIndex={1000}
      bg={bg}
      borderRadius="md"
      boxShadow={tooltipShadow}
      border="1px solid"
      borderColor={borderColor}
      p={2}
      maxW="300px"
      data-testid="node-tooltip"
    >
      <Flex direction="column" gap={1}>
        {/* Header with title and type */}
        <HStack justifyContent="space-between" mb={1}>
          <Text fontWeight="medium" fontSize="md" pr={2} noOfLines={1}>
            {node.label}
          </Text>
          <Badge colorScheme={badge.colorScheme} textTransform="capitalize">
            {badge.text}
          </Badge>
        </HStack>
        
        {/* Information fields */}
        {information.map((info, index) => (
          <HStack key={index} spacing={2} fontSize="xs">
            <Text fontWeight="medium" color="gray.500">{info.label}:</Text>
            {info.badge ? (
              info.badge
            ) : (
              <Text>{info.value}</Text>
            )}
          </HStack>
        ))}
      </Flex>
    </Box>
  );
};

// Helper function to format date
function formatDate(dateStr: string | number | Date): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (e) {
    return String(dateStr);
  }
}

// Helper function to get status badge
function getStatusBadge(status: string): React.ReactNode {
  const statusLower = status.toLowerCase();
  let colorScheme = 'gray';
  
  if (statusLower.includes('complete') || statusLower.includes('done')) {
    colorScheme = 'green';
  } else if (statusLower.includes('progress') || statusLower.includes('active')) {
    colorScheme = 'blue';
  } else if (statusLower.includes('plan')) {
    colorScheme = 'gray';
  } else if (statusLower.includes('block') || statusLower.includes('risk')) {
    colorScheme = 'red';
  } else if (statusLower.includes('hold')) {
    colorScheme = 'yellow';
  }
  
  return (
    <Badge colorScheme={colorScheme} fontSize="2xs">
      {status}
    </Badge>
  );
}

// Helper function to get progress badge
function getProgressBadge(progress: number): React.ReactNode {
  let colorScheme = 'gray';
  
  if (progress < 0.3) {
    colorScheme = 'red';
  } else if (progress < 0.7) {
    colorScheme = 'yellow';
  } else {
    colorScheme = 'green';
  }
  
  return (
    <Badge colorScheme={colorScheme} fontSize="2xs">
      {Math.round(progress * 100)}%
    </Badge>
  );
}

export default NodeTooltip;