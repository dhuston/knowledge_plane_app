/**
 * RecentlyViewedEntities.tsx
 * Enhanced component that displays recently viewed entities for quick access
 * with improved visualization, filtering, and interaction options
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
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
  Tooltip,
  Button,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Wrap,
  WrapItem,
  ButtonGroup,
  Tag,
  TagLeftIcon,
  TagLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverArrow,
  PopoverCloseButton,
  Card,
  CardBody,
  CardFooter,
  useDisclosure,
  Collapse,
  Skeleton
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiUsers, 
  FiFolder, 
  FiTarget, 
  FiBook,
  FiBriefcase,
  FiClock,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiList,
  FiGrid,
  FiCheck,
  FiX,
  FiArrowRight,
  FiFlag,
  FiStar
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';
import { NavHistoryItem } from '../header/BreadcrumbNav';

interface RecentlyViewedEntitiesProps {
  items: NavHistoryItem[];
  onEntityClick: (item: NavHistoryItem) => void;
  maxItems?: number;
  currentEntityId?: string;
  viewMode?: 'compact' | 'cards' | 'list' | 'grid';
  title?: string;
  showTimestamps?: boolean;
  isLoading?: boolean;
  onClearHistory?: () => void;
  onPinEntity?: (item: NavHistoryItem, isPinned: boolean) => void;
  pinnedItems?: string[]; // Array of nodeIds that are pinned
}

// Memoized entity icon component
const EntityIcon = memo(({ type, colorScheme }: { type: MapNodeTypeEnum, colorScheme: string }) => {
  // Get icon based on node type
  const getNodeIcon = (nodeType: MapNodeTypeEnum) => {
    switch (nodeType) {
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
        return FiFlag;
    }
  };

  const IconComponent = getNodeIcon(type);
  
  return (
    <Flex 
      w="24px" 
      h="24px" 
      borderRadius="full" 
      bg={`${colorScheme}.100`} 
      color={`${colorScheme}.700`}
      justify="center"
      align="center"
      mr={3}
      flexShrink={0}
      _dark={{
        bg: `${colorScheme}.900`,
        color: `${colorScheme}.200`
      }}
    >
      <Icon as={IconComponent} boxSize={3} />
    </Flex>
  );
});

// Memoized list item component for better performance
const EntityListItem = memo(({ 
  item, 
  index, 
  isPinned,
  isRecent,
  onEntityClick,
  onPinEntity,
  showTimestamps,
  colorScheme,
  formatTimestamp,
  itemHoverBg,
  textColor,
  textSecondary,
  recentBg
}: {
  item: NavHistoryItem;
  index: number;
  isPinned: boolean;
  isRecent: boolean;
  onEntityClick: (item: NavHistoryItem) => void;
  onPinEntity?: (item: NavHistoryItem, isPinned: boolean) => void;
  showTimestamps?: boolean;
  colorScheme: string;
  formatTimestamp: (timestamp?: number) => string;
  itemHoverBg: string;
  textColor: string;
  textSecondary: string;
  recentBg: string;
}) => {
  const handleClick = useCallback(() => {
    onEntityClick(item);
  }, [item, onEntityClick]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEntityClick(item);
    }
  }, [item, onEntityClick]);
  
  const handlePinClick = useCallback((e: React.MouseEvent) => {
    if (onPinEntity) {
      e.stopPropagation();
      onPinEntity(item, !isPinned);
    }
  }, [item, isPinned, onPinEntity]);
  
  // Format type for display
  const getTypeDisplayName = (type: string): string => {
    return type.replace('_', ' ').toLowerCase();
  };

  return (
    <Flex
      p={2}
      borderRadius="md"
      cursor="pointer"
      alignItems="center"
      bg={isPinned ? `${colorScheme}.50` : isRecent ? recentBg : undefined}
      _hover={{ bg: itemHoverBg }}
      onClick={handleClick}
      role="button"
      aria-label={`View ${item.label}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      transition="all 0.2s"
      position="relative"
      _dark={{
        bg: isPinned ? `${colorScheme}.900` : isRecent ? recentBg : undefined,
      }}
    >
      {item.nodeType === MapNodeTypeEnum.USER ? (
        <Avatar 
          name={item.label} 
          size="xs" 
          bg={`${colorScheme}.500`}
          mr={3}
          flexShrink={0}
        />
      ) : (
        <EntityIcon type={item.nodeType} colorScheme={colorScheme} />
      )}
      
      <VStack spacing={0} align="start" flex="1" overflow="hidden">
        <Tooltip label={item.label} placement="top" openDelay={500}>
          <Text 
            fontSize="sm" 
            fontWeight={isPinned ? "medium" : "normal"}
            color={textColor}
            noOfLines={1}
          >
            {item.label}
          </Text>
        </Tooltip>
        
        <HStack spacing={1} wrap="nowrap">
          <Badge 
            size="sm" 
            colorScheme={colorScheme} 
            variant={isPinned ? "solid" : "subtle"}
            fontSize="xs"
            textTransform="capitalize"
          >
            {getTypeDisplayName(item.nodeType)}
          </Badge>
          
          {showTimestamps && item.timestamp && (
            <Text fontSize="xs" color={textSecondary} noOfLines={1}>
              {formatTimestamp(item.timestamp)}
            </Text>
          )}
        </HStack>
      </VStack>
      
      <HStack spacing={1} ml={2}>
        {onPinEntity && (
          <IconButton
            aria-label={isPinned ? "Unpin" : "Pin"}
            icon={<FiStar />}
            size="xs"
            variant={isPinned ? "solid" : "ghost"}
            colorScheme={isPinned ? "yellow" : "gray"}
            onClick={handlePinClick}
          />
        )}
        <Icon as={FiChevronRight} color="gray.400" boxSize={4} />
      </HStack>
    </Flex>
  );
});

// Memoized tag component for compact view
const EntityTag = memo(({ 
  item, 
  idx, 
  colorScheme, 
  isPinned, 
  isRecent, 
  onEntityClick,
  showTimestamps,
  formatTimestamp
}: {
  item: NavHistoryItem;
  idx: number;
  colorScheme: string;
  isPinned: boolean;
  isRecent: boolean;
  onEntityClick: (item: NavHistoryItem) => void;
  showTimestamps?: boolean;
  formatTimestamp: (timestamp?: number) => string;
}) => {
  const handleClick = useCallback(() => {
    onEntityClick(item);
  }, [item, onEntityClick]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onEntityClick(item);
      e.preventDefault();
    }
  }, [item, onEntityClick]);
  
  const getNodeIcon = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER: return FiUser;
      case MapNodeTypeEnum.TEAM: return FiUsers;
      case MapNodeTypeEnum.PROJECT: return FiFolder;
      case MapNodeTypeEnum.GOAL: return FiTarget;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET: return FiBook;
      case MapNodeTypeEnum.DEPARTMENT: return FiBriefcase;
      default: return FiFlag;
    }
  };
  
  const IconComponent = getNodeIcon(item.nodeType);
  
  return (
    <WrapItem key={`${item.nodeId}-${idx}`}>
      <Tag
        size="md"
        borderRadius="full"
        variant={isPinned ? "solid" : isRecent ? "subtle" : "outline"}
        colorScheme={colorScheme}
        cursor="pointer"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View ${item.label}`}
        boxShadow={isPinned ? 'sm' : undefined}
        transition="all 0.2s"
        _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
      >
        <TagLeftIcon boxSize="12px" as={IconComponent} />
        <TagLabel>{item.label}</TagLabel>
        {showTimestamps && item.timestamp && (
          <Popover trigger="hover" placement="top">
            <PopoverTrigger>
              <Box display="inline-flex" ml={1} alignItems="center">
                <Icon as={FiClock} boxSize={3} />
              </Box>
            </PopoverTrigger>
            <PopoverContent width="200px">
              <PopoverArrow />
              <PopoverBody fontSize="xs">
                Viewed {formatTimestamp(item.timestamp)}
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )}
      </Tag>
    </WrapItem>
  );
});

// Main component with performance optimizations
const RecentlyViewedEntities: React.FC<RecentlyViewedEntitiesProps> = ({
  items,
  onEntityClick,
  maxItems = 12, // Increased default max
  currentEntityId,
  viewMode: initialViewMode = 'list',
  title = "Recently Viewed",
  showTimestamps = false,
  isLoading = false,
  onClearHistory,
  onPinEntity,
  pinnedItems = []
}) => {
  // State for filtering, view mode, and expanded state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<MapNodeTypeEnum | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'cards' | 'list' | 'grid'>(initialViewMode);
  const [showAll, setShowAll] = useState(false);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  
  // Theme colors - memoized to avoid recalculation
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const itemHoverBg = useColorModeValue('gray.100', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const highlightBg = useColorModeValue('yellow.50', 'yellow.900');
  const recentBg = useColorModeValue('blue.50', 'blue.900');
  
  // Remove duplicates by nodeId and get unique entries
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.nodeId)) return false;
      seen.add(item.nodeId);
      return true;
    });
  }, [items]);
  
  // Remove the current entity, add timestamps if missing, and limit to maxItems
  const allFilteredItems = useMemo(() => {
    return uniqueItems
      .filter(item => item.nodeId !== currentEntityId)
      .map(item => ({
        ...item,
        timestamp: item.timestamp || Date.now() // Add timestamp if missing
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Sort by timestamp (newest first)
      .slice(0, showAll ? undefined : maxItems); // Limit to maxItems unless showing all
  }, [uniqueItems, currentEntityId, maxItems, showAll]);
  
  // Don't render if no history or only the current item
  if (!isLoading && allFilteredItems.length === 0) return null;
  
  // Group entities by type - memoized
  const entityTypeInfo = useMemo(() => {
    const entitiesByType = allFilteredItems.reduce((acc, item) => {
      const type = item.nodeType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, NavHistoryItem[]>);
    
    // Get unique entity types
    const entityTypes = Object.keys(entitiesByType) as MapNodeTypeEnum[];
    
    return { entitiesByType, entityTypes };
  }, [allFilteredItems]);
  
  // Filter items based on search and type - memoized
  const filteredItems = useMemo(() => {
    return allFilteredItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || item.nodeType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [allFilteredItems, searchQuery, selectedType]);

  // Get pinned and recent items - memoized
  const { pinnedEntities, nonPinnedEntities } = useMemo(() => ({
    pinnedEntities: allFilteredItems.filter(item => pinnedItems.includes(item.nodeId)),
    nonPinnedEntities: allFilteredItems.filter(item => !pinnedItems.includes(item.nodeId))
  }), [allFilteredItems, pinnedItems]);
  
  // Helper to determine if an item is recent (last 24 hours) - memoized
  const isRecentItem = useCallback((item: NavHistoryItem): boolean => {
    if (!item.timestamp) return false;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - item.timestamp < oneDayInMs;
  }, []);

  // Get color scheme based on node type - memoized
  const getNodeColorScheme = useCallback((type: MapNodeTypeEnum): string => {
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
  }, []);
  
  // Get the display name for entity types - memoized
  const getTypeDisplayName = useCallback((type: string): string => {
    return type.replace('_', ' ').toLowerCase();
  }, []);
  
  // Format timestamp to human readable - memoized
  const formatTimestamp = useCallback((timestamp?: number): string => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (60 * 1000));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // Handle filter clear
  const handleClearFilters = useCallback(() => {
    setSelectedType(null);
    setSearchQuery('');
  }, []);
  
  // Handle type filter toggle
  const handleTypeFilterToggle = useCallback((type: MapNodeTypeEnum) => {
    setSelectedType(selectedType === type ? null : type);
  }, [selectedType]);
  
  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'compact' | 'cards' | 'list' | 'grid') => {
    setViewMode(mode);
  }, []);
  
  // Handle show all toggle
  const handleShowAllToggle = useCallback(() => {
    setShowAll(!showAll);
  }, [showAll]);

  // Render for compact view (tags/badges)
  const renderCompactView = useCallback(() => (
    <Wrap spacing={2}>
      {filteredItems.map((item, idx) => {
        const colorScheme = getNodeColorScheme(item.nodeType);
        const isPinned = pinnedItems.includes(item.nodeId);
        const isRecent = isRecentItem(item);
        
        return (
          <EntityTag
            key={`${item.nodeId}-${idx}`}
            item={item}
            idx={idx}
            colorScheme={colorScheme}
            isPinned={isPinned}
            isRecent={isRecent}
            onEntityClick={onEntityClick}
            showTimestamps={showTimestamps}
            formatTimestamp={formatTimestamp}
          />
        );
      })}
    </Wrap>
  ), [filteredItems, pinnedItems, getNodeColorScheme, isRecentItem, showTimestamps, formatTimestamp, onEntityClick]);
  
  // Render for list view
  const renderListView = useCallback(() => (
    <VStack spacing={1} align="stretch">
      {/* Pinned items section */}
      {pinnedItems.length > 0 && filteredItems.some(item => pinnedItems.includes(item.nodeId)) && (
        <>
          <Text fontSize="xs" fontWeight="medium" color={textSecondary} px={2} py={1}>
            Pinned
          </Text>
          {filteredItems
            .filter(item => pinnedItems.includes(item.nodeId))
            .map((item, idx) => {
              const colorScheme = getNodeColorScheme(item.nodeType);
              const isPinned = true;
              const isRecent = isRecentItem(item);
              
              return (
                <EntityListItem
                  key={`${item.nodeId}-${idx}-pinned`}
                  item={item}
                  index={idx}
                  isPinned={isPinned}
                  isRecent={isRecent}
                  onEntityClick={onEntityClick}
                  onPinEntity={onPinEntity}
                  showTimestamps={showTimestamps}
                  colorScheme={colorScheme}
                  formatTimestamp={formatTimestamp}
                  itemHoverBg={itemHoverBg}
                  textColor={textColor}
                  textSecondary={textSecondary}
                  recentBg={recentBg}
                />
              );
            })}
          
          {filteredItems.some(item => !pinnedItems.includes(item.nodeId)) && (
            <Divider my={1} />
          )}
        </>
      )}
      
      {/* Recent items */}
      {filteredItems.some(item => !pinnedItems.includes(item.nodeId)) && (
        <>
          {pinnedItems.length > 0 && (
            <Text fontSize="xs" fontWeight="medium" color={textSecondary} px={2} py={1}>
              Recent
            </Text>
          )}
          {filteredItems
            .filter(item => !pinnedItems.includes(item.nodeId))
            .map((item, idx) => {
              const colorScheme = getNodeColorScheme(item.nodeType);
              const isPinned = false;
              const isRecent = isRecentItem(item);
              
              return (
                <EntityListItem
                  key={`${item.nodeId}-${idx}-recent`}
                  item={item}
                  index={idx}
                  isPinned={isPinned}
                  isRecent={isRecent}
                  onEntityClick={onEntityClick}
                  onPinEntity={onPinEntity}
                  showTimestamps={showTimestamps}
                  colorScheme={colorScheme}
                  formatTimestamp={formatTimestamp}
                  itemHoverBg={itemHoverBg}
                  textColor={textColor}
                  textSecondary={textSecondary}
                  recentBg={recentBg}
                />
              );
            })}
        </>
      )}
    </VStack>
  ), [
    filteredItems, 
    pinnedItems, 
    textSecondary, 
    getNodeColorScheme, 
    isRecentItem, 
    onEntityClick, 
    onPinEntity, 
    showTimestamps, 
    formatTimestamp, 
    itemHoverBg, 
    textColor, 
    recentBg
  ]);
  
  // Render loading state - memoized to avoid recreation on each render
  const loadingState = useMemo(() => {
    const loadingItems = [];
    for (let i = 0; i < 5; i++) {
      loadingItems.push(
        <HStack key={i} w="100%" p={2}>
          <Skeleton borderRadius="full" boxSize="24px" />
          <VStack align="start" flex={1} spacing={1}>
            <Skeleton height="14px" width={`${80 - i * 10}%`} />
            <Skeleton height="10px" width={`${50 - i * 5}%`} />
          </VStack>
        </HStack>
      );
    }
    return <VStack align="stretch">{loadingItems}</VStack>;
  }, []);

  return (
    <Box 
      mt={4} 
      borderWidth="1px" 
      borderRadius="md" 
      borderColor={borderColor}
      aria-labelledby="recently-viewed-heading"
      overflow="hidden" // Ensure nothing breaks out of the container
    >
      {/* Enhanced collapsible header */}
      <Flex 
        justify="space-between" 
        align="center" 
        p={3} 
        bg={headerBg}
        borderBottomWidth="1px" 
        borderColor={isOpen ? borderColor : "transparent"}
        onClick={onToggle}
        cursor="pointer"
        _hover={{ bg: isOpen ? headerBg : itemHoverBg }}
      >
        <HStack spacing={2}>
          <Icon as={isOpen ? FiChevronUp : FiChevronDown} color="gray.500" />
          <Heading size="xs" id="recently-viewed-heading">{title}</Heading>
          <Badge colorScheme="blue">{filteredItems.length}</Badge>
        </HStack>
        
        <ButtonGroup size="xs" variant="ghost" spacing={1} onClick={(e) => e.stopPropagation()}>
          {/* Search button */}
          <Menu closeOnSelect={false}>
            <MenuButton 
              as={IconButton}
              icon={<FiSearch />}
              aria-label="Search recently viewed"
              size="xs"
              variant="ghost"
              colorScheme={searchQuery ? "blue" : undefined}
            />
            <MenuList p={2}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Search entities" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </InputGroup>
            </MenuList>
          </Menu>
          
          {/* Filter by type menu */}
          {entityTypeInfo.entityTypes.length > 1 && (
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <IconButton
                  aria-label="Filter by type"
                  icon={<FiFilter />}
                  size="xs"
                  variant="ghost"
                  colorScheme={selectedType ? "blue" : undefined}
                />
              </PopoverTrigger>
              <PopoverContent width="200px">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontSize="sm">Filter by type</PopoverHeader>
                <PopoverBody>
                  <VStack align="stretch" spacing={1}>
                    {entityTypeInfo.entityTypes.map(type => (
                      <Flex 
                        key={type} 
                        alignItems="center" 
                        p={1} 
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleTypeFilterToggle(type)}
                        bg={selectedType === type ? `${getNodeColorScheme(type)}.50` : undefined}
                        _hover={{ bg: itemHoverBg }}
                        _dark={{
                          bg: selectedType === type ? `${getNodeColorScheme(type)}.900` : undefined,
                        }}
                      >
                        <EntityIcon 
                          type={type}
                          colorScheme={getNodeColorScheme(type)}
                        />
                        <Text fontSize="sm" textTransform="capitalize">
                          {getTypeDisplayName(type)}
                        </Text>
                        <Box flex="1" />
                        <Icon 
                          as={selectedType === type ? FiCheck : undefined} 
                          color={`${getNodeColorScheme(type)}.500`} 
                        />
                      </Flex>
                    ))}
                    
                    {selectedType && (
                      <>
                        <Divider my={1} />
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          leftIcon={<FiX />}
                          onClick={() => setSelectedType(null)}
                        >
                          Clear filter
                        </Button>
                      </>
                    )}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
          
          {/* View mode toggle */}
          <Menu closeOnSelect={true}>
            <MenuButton
              as={IconButton}
              icon={viewMode === 'list' ? <FiList /> : <FiGrid />}
              aria-label="Change view mode"
              size="xs"
              variant="ghost"
            />
            <MenuList minWidth="140px">
              <MenuItem 
                icon={<FiList />} 
                onClick={() => handleViewModeChange('list')}
                fontWeight={viewMode === 'list' ? "bold" : "normal"}
              >
                List view
              </MenuItem>
              <MenuItem 
                icon={<FiGrid />} 
                onClick={() => handleViewModeChange('grid')}
                fontWeight={viewMode === 'grid' ? "bold" : "normal"}
              >
                Grid view
              </MenuItem>
              <MenuItem 
                icon={<FiFolder />} 
                onClick={() => handleViewModeChange('cards')}
                fontWeight={viewMode === 'cards' ? "bold" : "normal"}
              >
                Card view
              </MenuItem>
              <MenuItem 
                icon={<FiTarget />} 
                onClick={() => handleViewModeChange('compact')}
                fontWeight={viewMode === 'compact' ? "bold" : "normal"}
              >
                Compact view
              </MenuItem>
            </MenuList>
          </Menu>
        </ButtonGroup>
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        {/* Filter indicators */}
        {(selectedType || searchQuery) && (
          <Flex px={3} py={2} bgColor="blue.50" _dark={{ bgColor: "blue.900" }} alignItems="center" justifyContent="space-between">
            <HStack spacing={2} flexWrap="wrap">
              {selectedType && (
                <Badge 
                  colorScheme={getNodeColorScheme(selectedType)} 
                  display="flex" 
                  alignItems="center"
                >
                  <EntityIcon type={selectedType} colorScheme={getNodeColorScheme(selectedType)} />
                  <Text textTransform="capitalize">{getTypeDisplayName(selectedType)}</Text>
                </Badge>
              )}
              {searchQuery && (
                <Badge colorScheme="blue" display="flex" alignItems="center">
                  <Icon as={FiSearch} mr={1} boxSize="10px" />
                  {searchQuery}
                </Badge>
              )}
            </HStack>
            <IconButton
              icon={<FiX />} 
              aria-label="Clear filters" 
              size="xs"
              variant="ghost"
              onClick={handleClearFilters}
            />
          </Flex>
        )}
        
        {/* Content area */}
        <Box p={3}>
          {isLoading ? (
            loadingState
          ) : (
            <>
              {/* No results message */}
              {filteredItems.length === 0 ? (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  No matching entities found
                </Text>
              ) : (
                <>
                  {/* Entity view based on mode */}
                  {viewMode === 'compact' ? renderCompactView() : renderListView()}
                </>
              )}
            </>
          )}
          
          {/* Show more/less button */}
          {items.length > maxItems && (
            <Button 
              size="xs" 
              variant="ghost" 
              width="full" 
              mt={3}
              leftIcon={showAll ? <FiChevronUp /> : <FiChevronDown />}
              onClick={handleShowAllToggle}
            >
              {showAll ? 'Show Less' : `Show All (${items.length})`}
            </Button>
          )}
          
          {/* Clear history button */}
          {onClearHistory && filteredItems.length > 0 && (
            <Button 
              size="xs" 
              variant="ghost" 
              width="full" 
              mt={1}
              colorScheme="red"
              leftIcon={<FiX />}
              onClick={onClearHistory}
            >
              Clear History
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default memo(RecentlyViewedEntities);