import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Badge,
  Text,
  Icon,
  Center,
  Tooltip,
  Progress,
  Grid,
  GridItem,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiUser,
  FiUsers,
  FiTarget,
  FiFolder,
  FiCalendar,
  FiStar,
  FiMessageSquare,
} from 'react-icons/fi';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';

// Interface for enhanced relationship data
export interface EnhancedRelationshipProps {
  id: string;
  label: string;
  sourceId?: string;
  targetId?: string;
  type: string;
  nodeType: string;
  strength?: number;
  lastInteraction?: string;
  metadata?: Record<string, any>;
  onSelect?: (id: string) => void;
  onAction?: (action: string, id: string) => void;
}

/**
 * EnhancedRelationshipVisual - A component to visualize relationships between entities
 * with visual cues about relationship type, strength, and directionality
 */
const EnhancedRelationshipVisual: React.FC<EnhancedRelationshipProps> = ({
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
  onAction,
}) => {
  // Get color scheme based on relationship type
  const getRelationshipColor = (type: string): string => {
    switch (type) {
      case MapEdgeTypeEnum.REPORTS_TO: return 'pink';
      case MapEdgeTypeEnum.MEMBER_OF: return 'blue';
      case MapEdgeTypeEnum.LEADS: return 'red';
      case MapEdgeTypeEnum.OWNS: return 'purple';
      case MapEdgeTypeEnum.PARTICIPATES_IN: return 'cyan';
      case MapEdgeTypeEnum.ALIGNED_TO: return 'green';
      case MapEdgeTypeEnum.PARENT_OF: return 'orange';
      case MapEdgeTypeEnum.RELATED_TO: return 'gray';
      default: return 'gray';
    }
  };

  // Get icon for node type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case MapNodeTypeEnum.USER: return FiUser;
      case MapNodeTypeEnum.TEAM: return FiUsers;
      case MapNodeTypeEnum.PROJECT: return FiFolder;
      case MapNodeTypeEnum.GOAL: return FiTarget;
      default: return FiUser;
    }
  };

  // Format relationship name for display
  const getRelationshipName = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return null;
    }
  };

  // Calculate strength indicators
  const hasStrength = strength !== undefined;
  const isStrong = hasStrength && strength > 0.7;
  const isMedium = hasStrength && strength > 0.4 && strength <= 0.7;
  const isWeak = hasStrength && strength <= 0.4;
  
  const relColorScheme = getRelationshipColor(type);
  const nodeColorScheme = getRelationshipColor(nodeType);

  // Generate CSS class for styling based on strength
  const getStrengthClass = () => {
    if (isStrong) return 'relationship-strong';
    if (isMedium) return 'relationship-medium';
    if (isWeak) return 'relationship-weak';
    return '';
  };

  // Handle click event
  const handleClick = () => {
    if (onSelect) {
      onSelect(targetId || id);
    }
  };

  // Handle action button clicks
  const handleAction = (actionType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(actionType, targetId || id);
    }
  };

  // Connection visualization based on relationship type
  const ConnectionVisual = () => {
    return (
      <Box
        position="relative"
        width="30px"
        height="30px"
        mr={2}
      >
        {/* Base line */}
        <Flex
          position="absolute"
          top="50%"
          left="0"
          width="100%"
          height="2px"
          bg={`${relColorScheme}.${isStrong ? 500 : 300}`}
          transform="translateY(-50%)"
          opacity={hasStrength ? (strength || 0.5) : 0.5}
          _dark={{
            bg: `${relColorScheme}.${isStrong ? 400 : 700}`
          }}
        />
        
        {/* Type-specific decorators */}
        {type === MapEdgeTypeEnum.REPORTS_TO && (
          <Box
            position="absolute"
            right="0"
            top="calc(50% - 4px)"
            width="0" 
            height="0"
            borderTop="4px solid transparent"
            borderBottom="4px solid transparent"
            borderLeft={`8px solid ${isStrong ? `var(--chakra-colors-${relColorScheme}-500)` : `var(--chakra-colors-${relColorScheme}-300)`}`}
            _dark={{
              borderLeftColor: isStrong ? `var(--chakra-colors-${relColorScheme}-400)` : `var(--chakra-colors-${relColorScheme}-700)`
            }}
          />
        )}
        
        {type === MapEdgeTypeEnum.LEADS && (
          <Box
            position="absolute"
            left="calc(50% - 4px)"
            top="0"
            width="8px" 
            height="8px"
            borderRadius="full"
            bg={`${relColorScheme}.${isStrong ? 500 : 300}`}
            _dark={{
              bg: `${relColorScheme}.${isStrong ? 400 : 700}`
            }}
          />
        )}
        
        {type === MapEdgeTypeEnum.ALIGNED_TO && (
          <Box
            position="absolute"
            top="calc(50% - 3px)"
            left="8px"
            width="14px" 
            height="6px"
            borderRadius="full"
            bg={`${relColorScheme}.${isStrong ? 500 : 300}`}
            _dark={{
              bg: `${relColorScheme}.${isStrong ? 400 : 700}`
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box className={`enhanced-relationship ${getStrengthClass()}`}>
      <Grid 
        templateColumns="auto auto 1fr auto"
        gap={2}
        p={3}
        alignItems="center"
        onClick={handleClick}
        cursor="pointer"
        borderLeftWidth="3px"
        borderLeftColor={isStrong ? `${relColorScheme}.500` : "transparent"}
        transition="all 0.2s ease"
        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
        borderRadius="md"
        role="button"
        tabIndex={0}
        aria-label={`View ${label}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Connection visualization */}
        <GridItem>
          <ConnectionVisual />
        </GridItem>
        
        {/* Entity icon */}
        <GridItem>
          <Center 
            p={2} 
            borderRadius="full" 
            bg={`${nodeColorScheme}.50`} 
            color={`${nodeColorScheme}.500`}
            _dark={{ 
              bg: `${nodeColorScheme}.900`, 
              color: `${nodeColorScheme}.200` 
            }}
            boxSize="40px"
            boxShadow={isStrong ? "sm" : "none"}
          >
            <Icon as={getNodeIcon(nodeType)} boxSize={4} />
          </Center>
        </GridItem>
        
        {/* Details section */}
        <GridItem>
          <VStack align="flex-start" spacing={1}>
            <Flex alignItems="center" width="100%">
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {label}
              </Text>
              
              {hasStrength && (
                <HStack spacing={1} ml={2}>
                  {isStrong && (
                    <Tooltip label="Strong relationship">
                      <Icon as={FiStar} boxSize={3} color="yellow.500" />
                    </Tooltip>
                  )}
                  <Badge 
                    size="sm" 
                    variant="subtle" 
                    colorScheme={
                      isStrong ? "green" : 
                      isMedium ? "blue" : 
                      "gray"
                    }
                    fontSize="xx-small"
                  >
                    {Math.round((strength || 0) * 100)}%
                  </Badge>
                </HStack>
              )}
            </Flex>
            
            <HStack spacing={3}>
              <Badge 
                size="sm"
                colorScheme={relColorScheme}
                variant="subtle"
                fontSize="xs"
              >
                {getRelationshipName(type)}
              </Badge>
              
              <Text fontSize="xs" color="gray.500">
                {getRelationshipName(nodeType)}
              </Text>
              
              {lastInteraction && formatDate(lastInteraction) && (
                <HStack spacing={1}>
                  <Icon as={FiCalendar} boxSize={3} color="gray.500" />
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(lastInteraction)}
                  </Text>
                </HStack>
              )}
            </HStack>
            
            {hasStrength && (
              <Box width="100%" mt={1}>
                <Tooltip label={`Relationship strength: ${Math.round((strength || 0) * 100)}%`}>
                  <Progress 
                    value={(strength || 0) * 100} 
                    size="xs" 
                    colorScheme={
                      isStrong ? "green" : 
                      isMedium ? "blue" : 
                      "gray"
                    }
                    borderRadius="full"
                  />
                </Tooltip>
              </Box>
            )}
          </VStack>
        </GridItem>
        
        {/* Actions */}
        <GridItem>
          <HStack spacing={1}>
            <Tooltip label="Send message" placement="top">
              <IconButton
                aria-label="Send message"
                icon={<FiMessageSquare />}
                size="sm"
                variant="ghost"
                onClick={(e) => handleAction('message', e)}
              />
            </Tooltip>
            
            <Tooltip label={`View ${label}`} placement="top">
              <IconButton
                aria-label={`View ${label}`}
                icon={<FiArrowRight />}
                size="sm"
                variant="ghost"
                onClick={(e) => handleAction('view', e)}
              />
            </Tooltip>
          </HStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default EnhancedRelationshipVisual;