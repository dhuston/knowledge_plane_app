import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  IconButton,
  HStack,
  VStack,
  Avatar,
  Progress,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FiMoreVertical, FiLink, FiUser, FiUsers, FiTarget, FiFolder } from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../types/map';

interface RelationshipVisualProps {
  id: string;
  label: string;
  sourceId: string;
  targetId: string;
  type: string;
  nodeType: string;
  strength?: number;
  lastInteraction?: string;
  metadata?: Record<string, any>;
  onSelect?: (id: string) => void;
  onAction?: (action: string, id: string) => void;
}

/**
 * EnhancedRelationshipVisual component
 * 
 * Displays a relationship between entities with visual indicators of relationship strength
 */
const EnhancedRelationshipVisual: React.FC<RelationshipVisualProps> = ({
  id,
  label,
  sourceId,
  targetId,
  type,
  nodeType,
  strength,
  lastInteraction,
  metadata,
  onSelect,
  onAction
}) => {
  // Colors and styling
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  
  // Node type icon mapping
  const getNodeIcon = () => {
    switch (nodeType) {
      case MapNodeTypeEnum.USER:
        return FiUser;
      case MapNodeTypeEnum.TEAM:
        return FiUsers;
      case MapNodeTypeEnum.PROJECT:
        return FiFolder;
      case MapNodeTypeEnum.GOAL:
        return FiTarget;
      default:
        return FiLink;
    }
  };
  
  // Format the relationship type for display
  const getRelationshipName = (relType: string): string => {
    return relType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Format date for display
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };
  
  const handleSelect = () => {
    if (onSelect) onSelect(id);
  };
  
  const handleAction = (action: string) => {
    if (onAction) onAction(action, id);
  };
  
  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="md"
      p={3}
      onClick={handleSelect}
      cursor="pointer"
      _hover={{ 
        shadow: 'md',
        borderColor: 'blue.400'
      }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={3}>
          <Avatar 
            size="sm" 
            bg={`${nodeType.toLowerCase()}.100`}
            color={`${nodeType.toLowerCase()}.700`}
            icon={<Box as={getNodeIcon()} />}
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{label}</Text>
            <Text fontSize="xs" color="gray.500">
              {getRelationshipName(type)}
            </Text>
          </VStack>
        </HStack>
        
        <Menu placement="bottom-end">
          <MenuButton 
            as={IconButton}
            aria-label="More options"
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList>
            <MenuItem onClick={() => handleAction('view')}>View details</MenuItem>
            <MenuItem onClick={() => handleAction('explore')}>Explore connections</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      {strength !== undefined && (
        <Box mt={2}>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="xs" color="gray.500">Relationship strength</Text>
            <Badge colorScheme={strength > 0.7 ? 'green' : strength > 0.4 ? 'blue' : 'gray'}>
              {strength > 0.7 ? 'Strong' : strength > 0.4 ? 'Medium' : 'Weak'}
            </Badge>
          </Flex>
          <Progress 
            value={strength * 100} 
            size="sm" 
            colorScheme={strength > 0.7 ? 'green' : strength > 0.4 ? 'blue' : 'gray'} 
            borderRadius="full"
          />
        </Box>
      )}
      
      {lastInteraction && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          Last interaction: {formatDate(lastInteraction)}
        </Text>
      )}
    </Box>
  );
};

export default EnhancedRelationshipVisual;