/**
 * RecentlyViewedEntities.tsx
 * Displays recently viewed entities for quick access
 */
import React from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Avatar,
  Icon,
  useColorModeValue,
  Flex,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiUsers, 
  FiFolder, 
  FiTarget, 
  FiBook,
  FiBriefcase,
  FiClock
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';
import { NavHistoryItem } from '../header/BreadcrumbNav';

interface RecentlyViewedEntitiesProps {
  items: NavHistoryItem[];
  onEntityClick: (item: NavHistoryItem) => void;
  maxItems?: number;
  currentEntityId?: string;
}

const RecentlyViewedEntities: React.FC<RecentlyViewedEntitiesProps> = ({
  items,
  onEntityClick,
  maxItems = 5,
  currentEntityId
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const itemHoverBg = useColorModeValue('white', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  
  // Remove the current entity and limit to maxItems
  const filteredItems = items
    .filter(item => item.nodeId !== currentEntityId)
    .slice(-maxItems)
    .reverse(); // Most recent first
  
  // Don't render if no history or only the current item
  if (filteredItems.length === 0) return null;
  
  // Get icon based on node type
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
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return FiBook;
      case MapNodeTypeEnum.DEPARTMENT:
        return FiBriefcase;
      default:
        return FiTarget;
    }
  };
  
  // Get color scheme based on node type
  const getNodeColorScheme = (type: MapNodeTypeEnum): string => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'blue';
      case MapNodeTypeEnum.TEAM:
        return 'green';
      case MapNodeTypeEnum.PROJECT:
        return 'purple';
      case MapNodeTypeEnum.GOAL:
        return 'orange';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return 'cyan';
      case MapNodeTypeEnum.DEPARTMENT:
        return 'teal';
      default:
        return 'gray';
    }
  };

  return (
    <Box 
      mt={4} 
      p={3} 
      borderWidth="1px" 
      borderRadius="md" 
      borderColor={borderColor}
      bg={bgColor}
      aria-labelledby="recently-viewed-heading"
    >
      <HStack mb={2} spacing={2}>
        <Icon as={FiClock} color="gray.500" />
        <Heading size="xs" id="recently-viewed-heading">Recently Viewed</Heading>
      </HStack>
      
      <VStack spacing={1} align="stretch">
        {filteredItems.map((item) => {
          const colorScheme = getNodeColorScheme(item.nodeType);
          
          return (
            <Box 
              key={item.nodeId}
              p={2}
              borderRadius="md"
              cursor="pointer"
              _hover={{
                bg: itemHoverBg,
                boxShadow: 'sm'
              }}
              onClick={() => onEntityClick(item)}
              role="button"
              aria-label={`View ${item.label}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEntityClick(item);
                }
              }}
              transition="all 0.2s"
            >
              <HStack spacing={3}>
                {item.nodeType === MapNodeTypeEnum.USER ? (
                  <Avatar 
                    name={item.label} 
                    size="xs" 
                    bg={`${colorScheme}.500`}
                  />
                ) : (
                  <Flex 
                    w="24px" 
                    h="24px" 
                    borderRadius="full" 
                    bg={`${colorScheme}.100`} 
                    color={`${colorScheme}.700`}
                    justify="center"
                    align="center"
                    _dark={{
                      bg: `${colorScheme}.900`,
                      color: `${colorScheme}.200`
                    }}
                  >
                    <Icon as={getNodeIcon(item.nodeType)} boxSize={3} />
                  </Flex>
                )}
                <VStack spacing={0} align="start" flex="1" overflow="hidden">
                  <Tooltip label={item.label} placement="top" openDelay={500}>
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={textColor}
                      noOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Tooltip>
                  <Badge 
                    size="sm" 
                    colorScheme={colorScheme} 
                    variant="subtle"
                    fontSize="xs"
                    textTransform="capitalize"
                  >
                    {item.nodeType.replace('_', ' ')}
                  </Badge>
                </VStack>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export default RecentlyViewedEntities;