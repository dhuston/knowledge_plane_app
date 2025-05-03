import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  useColorModeValue,
  Flex,
  Badge,
  SimpleGrid,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tag,
  TagLabel,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  Center,
  Spinner,
  Progress,
  Grid,
  useDisclosure,
  SlideFade,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList,
  FiChevronDown,
  FiMoreHorizontal,
  FiUser,
  FiUsers,
  FiTarget,
  FiFolder,
  FiFlag,
  FiInfo
} from 'react-icons/fi';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import EnhancedRelationshipVisual from './EnhancedRelationshipVisual';
import { motion } from 'framer-motion';
import {
  useChunkedProcessing,
  useChunkedRendering,
  useVirtualizedList,
  useExpandableGroups,
  areEqual,
  useDelayedExecution
} from '../../utils/performance';

// Types
interface RelationshipData {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label: string;
  nodeType: string;
  strength?: number;
  lastInteraction?: string;
  metadata?: Record<string, any>;
}

interface RelationshipsVisualizerProps {
  relationships: RelationshipData[];
  title?: string;
  entityType?: MapNodeTypeEnum;
  onRelationshipSelect?: (id: string) => void;
  onRelationshipAction?: (action: string, id: string) => void;
  isLoading?: boolean;
}

// Group options for relationships
type GroupOption = 'type' | 'nodeType' | 'strength' | 'none';

// Sort options
type SortOption = 'alphabetical' | 'recent' | 'strength';

// View mode options
type ViewMode = 'list' | 'grid' | 'compact';

/**
 * RelationshipsVisualizer Component - Performance optimized version
 * Enhanced visualization of relationships with filtering, grouping, and better visual cues
 * Includes optimizations for large datasets and virtualization
 */
const RelationshipsVisualizer: React.FC<RelationshipsVisualizerProps> = ({
  relationships,
  title = 'Relationships',
  entityType,
  onRelationshipSelect,
  onRelationshipAction,
  isLoading = false
}) => {
  // State for UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupOption>('type');
  const [sortBy, setSortBy] = useState<SortOption>('strength');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Add performance tracking
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  // Ref for large dataset warning
  const [showLargeDatasetWarning, setShowLargeDatasetWarning] = useState(false);
  const shouldLoadSecondary = useDelayedExecution(300);
  
  // Track if component is mounted for async operations
  const isMounted = useRef(true);
  
  // Theme colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Calculate if we have a large dataset
  useEffect(() => {
    const isLargeDataset = relationships.length > 100;
    if (isLargeDataset && !showLargeDatasetWarning) {
      setShowLargeDatasetWarning(true);
    } else if (!isLargeDataset && showLargeDatasetWarning) {
      setShowLargeDatasetWarning(false);
    }
    
    // Log performance info in development mode
    if (process.env.NODE_ENV === 'development') {
      renderCount.current++;
      const now = performance.now();
      const timeSinceLastRender = now - lastRenderTime.current;
      lastRenderTime.current = now;
      
      if (renderCount.current > 3) {
        console.debug(`[RelationshipsVisualizer] Render #${renderCount.current}, +${timeSinceLastRender.toFixed(1)}ms, items: ${relationships.length}`);
      }
    }
  }, [relationships.length, showLargeDatasetWarning]);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Filter relationships with chunked processing for large datasets
  const { results: filteredResults, isProcessing: isFiltering } = useChunkedProcessing(
    relationships,
    (chunk) => {
      return chunk.filter(rel => {
        // Apply search filter
        const matchesSearch = !searchQuery || 
          rel.label.toLowerCase().includes(searchQuery.toLowerCase());
          
        // Apply type filters
        const matchesTypeFilter = activeFilters.length === 0 || 
          (activeFilters.includes(rel.nodeType) || activeFilters.includes(rel.type));
          
        return matchesSearch && matchesTypeFilter;
      });
    },
    Math.min(50, Math.max(20, Math.floor(relationships.length / 5))) // Adaptive chunk size
  );
  
  // Use filtered relationships with memoization
  const filteredRelationships = useMemo(() => {
    return filteredResults;
  }, [filteredResults]);

  // Sort relationships with chunked processing for large datasets
  const { results: sortedResults, isProcessing: isSorting } = useChunkedProcessing(
    filteredRelationships,
    (chunk) => {
      return [...chunk].sort((a, b) => {
        switch (sortBy) {
          case 'alphabetical':
            return a.label.localeCompare(b.label);
          case 'recent':
            // If no lastInteraction data available, fallback to alphabetical
            if (!a.lastInteraction && !b.lastInteraction) {
              return a.label.localeCompare(b.label);
            }
            if (!a.lastInteraction) return 1;
            if (!b.lastInteraction) return -1;
            return new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime();
          case 'strength':
          default:
            // Sort by strength with non-strength relationships at the end
            if (a.strength === undefined && b.strength === undefined) {
              return a.label.localeCompare(b.label);
            }
            if (a.strength === undefined) return 1;
            if (b.strength === undefined) return -1;
            return b.strength - a.strength;
        }
      });
    },
    Math.min(100, Math.max(20, Math.floor(filteredRelationships.length / 3))) // Adaptive chunk size
  );
  
  // Use sorted relationships with memoization
  const sortedRelationships = useMemo(() => {
    return sortedResults;
  }, [sortedResults]);
  
  // Group relationships with optimized chunked processing
  const { results: groupingResults, isProcessing: isGrouping } = useChunkedProcessing(
    sortedRelationships,
    (chunk) => {
      // Process this chunk into grouped objects
      const chunkGroups: Record<string, { key: string, items: RelationshipData[] }> = {};
      
      chunk.forEach(rel => {
        let key = 'OTHER';
        
        switch (groupBy) {
          case 'type':
            key = rel.type || 'OTHER';
            break;
          case 'nodeType':
            key = rel.nodeType || 'UNKNOWN';
            break;
          case 'strength':
            if (rel.strength === undefined) {
              key = 'Unknown';
            } else if (rel.strength > 0.7) {
              key = 'Strong';
            } else if (rel.strength > 0.4) {
              key = 'Medium';
            } else {
              key = 'Weak';
            }
            break;
          default:
            key = 'All';
        }
        
        if (!chunkGroups[key]) {
          chunkGroups[key] = { key, items: [] };
        }
        chunkGroups[key].items.push(rel);
      });
      
      return Object.values(chunkGroups);
    },
    50 // Process 50 items per chunk
  );
  
  // Merge chunked results
  const groupedRelationships = useMemo(() => {
    // Special case for 'none' grouping option
    if (groupBy === 'none') {
      return { 'All Relationships': sortedRelationships };
    }
    
    const result: Record<string, RelationshipData[]> = {};
    
    groupingResults.forEach(group => {
      if (!result[group.key]) result[group.key] = [];
      result[group.key].push(...group.items);
    });
    
    // Apply special ordering for strength groups
    if (groupBy === 'strength') {
      const orderedGroups: Record<string, RelationshipData[]> = {};
      const strengthOrder = ['Strong', 'Medium', 'Weak', 'Unknown'];
      
      strengthOrder.forEach(key => {
        if (result[key] && result[key].length > 0) {
          orderedGroups[key] = result[key];
        }
      });
      
      return orderedGroups;
    }
    
    // Apply special ordering for relationship types
    if (groupBy === 'type') {
      const orderedGroups: Record<string, RelationshipData[]> = {};
      const typeOrder = [
        MapEdgeTypeEnum.REPORTS_TO,
        MapEdgeTypeEnum.LEADS,
        MapEdgeTypeEnum.MEMBER_OF,
        MapEdgeTypeEnum.PARTICIPATES_IN,
        MapEdgeTypeEnum.OWNS,
        MapEdgeTypeEnum.ALIGNED_TO,
        MapEdgeTypeEnum.PARENT_OF,
        MapEdgeTypeEnum.RELATED_TO,
        'OTHER'
      ];
      
      // First add types in our preferred order
      typeOrder.forEach(key => {
        if (result[key] && result[key].length > 0) {
          orderedGroups[key] = result[key];
        }
      });
      
      // Then add any remaining types
      Object.keys(result).forEach(key => {
        if (!typeOrder.includes(key as any)) {
          orderedGroups[key] = result[key];
        }
      });
      
      return orderedGroups;
    }
    
    return result;
  }, [groupingResults, groupBy, sortedRelationships]);
  
  // Manage expandable groups for better performance
  const {
    expandedGroups,
    toggleGroupExpansion,
    expandAllGroups,
    collapseAllGroups
  } = useExpandableGroups(Object.keys(groupedRelationships), {
    defaultExpanded: Object.keys(groupedRelationships).length <= 3,
    maxSimultaneousExpanded: 5 // Limit number of expanded groups for performance
  });
  
  // Get node types for filtering - with memoization for performance
  const availableNodeTypes = useMemo(() => {
    // Use a Set for fast lookups and duplicate removal
    const typesSet = new Set<string>();
    
    // Process in chunks for large datasets to avoid UI freezing
    for (let i = 0; i < relationships.length; i += 100) {
      const chunk = relationships.slice(i, i + 100);
      chunk.forEach(rel => {
        typesSet.add(rel.nodeType);
      });
    }
    
    return Array.from(typesSet);
  }, [relationships]);
  
  // Get relationship types for filtering - with memoization for performance
  const availableRelTypes = useMemo(() => {
    // Use a Set for fast lookups and duplicate removal
    const typesSet = new Set<string>();
    
    // Process in chunks for large datasets to avoid UI freezing
    for (let i = 0; i < relationships.length; i += 100) {
      const chunk = relationships.slice(i, i + 100);
      chunk.forEach(rel => {
        typesSet.add(rel.type);
      });
    }
    
    return Array.from(typesSet);
  }, [relationships]);
  
  // Optimize filter toggling with useCallback
  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      } else {
        return [...prev, filter];
      }
    });
  }, []);
  
  // Get relationship type name for display
  const getRelationshipName = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };
  
  const groupVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut" 
      }
    }
  };
  
  const handleRelationshipSelect = (id: string) => {
    if (onRelationshipSelect) {
      onRelationshipSelect(id);
    }
  };
  
  const handleRelationshipAction = (action: string, id: string) => {
    if (onRelationshipAction) {
      onRelationshipAction(action, id);
    }
  };

  // Get appropriate header text based on entity type
  const getHeaderText = (): string => {
    if (!entityType) return title;
    
    switch (entityType) {
      case MapNodeTypeEnum.USER: return 'Connections & Teams';
      case MapNodeTypeEnum.TEAM: return 'Members & Projects';
      case MapNodeTypeEnum.PROJECT: return 'Team & Contributors';
      case MapNodeTypeEnum.GOAL: return 'Aligned Projects';
      default: return title;
    }
  };

  // Loading skeleton placeholder
  if (isLoading) {
    return (
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        <Heading size="sm" mb={4}>{getHeaderText()}</Heading>
        <Divider mb={4} />
        <SimpleGrid columns={1} spacing={3}>
          {[1, 2, 3].map((_, idx) => (
            <Box 
              key={idx} 
              height="80px" 
              bg="gray.100" 
              _dark={{ bg: "gray.700" }} 
              borderRadius="md" 
              animate={{ 
                opacity: [0.5, 0.7, 0.5],
                transition: { repeat: Infinity, duration: 1.5 }
              }}
            />
          ))}
        </SimpleGrid>
      </Box>
    );
  }
  
  // Empty state
  if (!relationships || relationships.length === 0) {
    return (
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        <Heading size="sm" mb={4}>{getHeaderText()}</Heading>
        <Divider mb={4} />
        <Flex 
          direction="column"
          align="center"
          justify="center"
          p={8}
          bg={sectionBg}
          borderRadius="md"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={borderColor}
        >
          <Text color="gray.500">No relationships found</Text>
        </Flex>
      </Box>
    );
  }

  // Memoized handler for relationship actions
  const handleRelationshipAction = useCallback((action: string, id: string) => {
    if (onRelationshipAction) {
      onRelationshipAction(action, id);
    }
  }, [onRelationshipAction]);
  
  // Memoized handler for relationship selection
  const handleRelationshipSelect = useCallback((id: string) => {
    if (onRelationshipSelect) {
      onRelationshipSelect(id);
    }
  }, [onRelationshipSelect]);

  // Virtualized group component with performance optimizations
  const VirtualizedGroup = useCallback(({ 
    group, 
    relationships,
    colorScheme = 'gray'
  }: { 
    group: string; 
    relationships: RelationshipData[]; 
    colorScheme?: string;
  }) => {
    const isExpanded = expandedGroups[group] ?? false;
    
    // Don't render items if group is collapsed
    const renderedItems = isExpanded ? relationships : [];
    
    // Use virtualization for large item lists
    const isLargeGroup = relationships.length > 20;
    
    // Virtual list setup for efficient rendering of large lists
    const itemHeight = 84; // Height of each relationship item in pixels
    
    // Memoize group header color
    const badgeColor = useMemo(() => {
      return group === 'Strong' ? 'green' :
        group === 'Medium' ? 'blue' :
        group === 'Weak' ? 'gray' :
        group === 'REPORTS_TO' ? 'pink' :
        group === 'MEMBER_OF' ? 'blue' :
        group === 'LEADS' ? 'red' :
        group === 'PARTICIPATES_IN' ? 'cyan' :
        group === 'ALIGNED_TO' ? 'green' :
        group === 'PARENT_OF' ? 'orange' :
        'gray';
    }, [group]);
    
    // Virtualization controls
    const containerHeight = Math.min(400, itemHeight * Math.min(renderedItems.length, 8));
    
    return (
      <Box 
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >
        {/* Group header */}
        <Flex 
          bg={headerBg}
          p={2}
          px={3}
          alignItems="center"
          justify="space-between"
          onClick={() => toggleGroupExpansion(group)}
          cursor="pointer"
        >
          <HStack>
            <Icon
              as={isExpanded ? FiChevronDown : FiChevronDown}
              transform={isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}
              transition="transform 0.2s"
              mr={1}
            />
            <Badge colorScheme={badgeColor}>
              {getRelationshipName(group)}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {relationships.length} {relationships.length === 1 ? 'item' : 'items'}
            </Text>
          </HStack>
          
          {/* Group action buttons */}
          {relationships.length > 10 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // Focus on this group type
                setActiveFilters([group]);
              }}
            >
              Focus
            </Button>
          )}
        </Flex>
        
        {/* Group content - conditionally rendered based on expand state */}
        <SlideFade in={isExpanded} unmountOnExit={false}>
          {isExpanded && (
            <Box>
              {/* For large groups, use virtual rendering */}
              {isLargeGroup && viewMode === 'list' ? (
                <VirtualizedRelationships 
                  relationships={renderedItems}
                  containerHeight={containerHeight}
                  onSelect={handleRelationshipSelect}
                  onAction={handleRelationshipAction}
                />
              ) : (
                // For smaller groups or non-list view, render with chunked rendering
                <Box p={2}>
                  <ChunkedRelationships 
                    relationships={renderedItems}
                    viewMode={viewMode}
                    onSelect={handleRelationshipSelect}
                    onAction={handleRelationshipAction}
                  />
                </Box>
              )}
            </Box>
          )}
        </SlideFade>
      </Box>
    );
  }, [expandedGroups, handleRelationshipAction, handleRelationshipSelect, borderColor, headerBg, toggleGroupExpansion, viewMode]);
  
  // Virtualized list component for efficient rendering of large relationship lists
  const VirtualizedRelationships = useCallback(({ 
    relationships, 
    containerHeight,
    onSelect,
    onAction
  }: { 
    relationships: RelationshipData[]; 
    containerHeight: number;
    onSelect: (id: string) => void;
    onAction: (action: string, id: string) => void;
  }) => {
    const itemHeight = 84; // Height of each relationship item
    
    const {
      containerRef,
      handleScroll,
      virtualItems,
      totalHeight
    } = useVirtualizedList(relationships, itemHeight, containerHeight);
    
    if (relationships.length === 0) return null;
    
    return (
      <Box 
        height={`${containerHeight}px`} 
        overflowY="auto"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <Box position="relative" height={`${totalHeight}px`}>
          {virtualItems.map(virtualRow => (
            <Box
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height={`${virtualRow.height}px`}
              transform={`translateY(${virtualRow.offsetTop}px)`}
              key={virtualRow.key}
              px={2}
              pt={virtualRow.index === 0 ? 2 : 0}
              pb={virtualRow.index === relationships.length - 1 ? 2 : 0}
            >
              <EnhancedRelationshipVisual
                id={virtualRow.item.id}
                label={virtualRow.item.label}
                sourceId={virtualRow.item.sourceId}
                targetId={virtualRow.item.targetId}
                type={virtualRow.item.type}
                nodeType={virtualRow.item.nodeType}
                strength={virtualRow.item.strength}
                lastInteraction={virtualRow.item.lastInteraction}
                metadata={virtualRow.item.metadata}
                onSelect={onSelect}
                onAction={onAction}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, []);
  
  // Chunked rendering component for improved performance with many items
  const ChunkedRelationships = useCallback(({ 
    relationships, 
    viewMode,
    onSelect,
    onAction
  }: {
    relationships: RelationshipData[];
    viewMode: ViewMode;
    onSelect: (id: string) => void;
    onAction: (action: string, id: string) => void;
  }) => {
    // Calculate optimal chunk size based on view mode and number of items
    const chunkSize = viewMode === 'grid' ? 12 : viewMode === 'compact' ? 30 : 10;
    
    // Use progressive rendering for better perceived performance
    const { renderedItems, isComplete, progress } = useChunkedRendering(
      relationships,
      chunkSize,
      viewMode === 'grid' ? 32 : 16 // More delay for grid view due to heavier rendering
    );
    
    if (relationships.length === 0) return null;
    
    return (
      <>
        {viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
            {renderedItems.map(rel => (
              <EnhancedRelationshipVisual
                key={rel.id}
                id={rel.id}
                label={rel.label}
                sourceId={rel.sourceId}
                targetId={rel.targetId}
                type={rel.type}
                nodeType={rel.nodeType}
                strength={rel.strength}
                lastInteraction={rel.lastInteraction}
                metadata={rel.metadata}
                onSelect={onSelect}
                onAction={onAction}
              />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={2} align="stretch">
            {renderedItems.map(rel => (
              <EnhancedRelationshipVisual
                key={rel.id}
                id={rel.id}
                label={rel.label}
                sourceId={rel.sourceId}
                targetId={rel.targetId}
                type={rel.type}
                nodeType={rel.nodeType}
                strength={rel.strength}
                lastInteraction={rel.lastInteraction}
                metadata={rel.metadata}
                onSelect={onSelect}
                onAction={onAction}
              />
            ))}
          </VStack>
        )}
        
        {/* Show loading indicator for large data sets */}
        {!isComplete && (
          <Box textAlign="center" p={2}>
            <HStack justify="center" spacing={2}>
              <Spinner size="xs" />
              <Text fontSize="xs" color="gray.500">Loading more items ({Math.round(progress)}%)</Text>
            </HStack>
          </Box>
        )}
      </>
    );
  }, []);
  
  // Main render
  return (
    <Box 
      as={motion.div}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      p={4}
      borderRadius="md" 
      borderWidth="1px" 
      borderColor={borderColor}
      bg={sectionBg}
    >
      <Heading size="sm" mb={4}>{getHeaderText()}</Heading>
      
      {/* Controls section */}
      <VStack spacing={3} align="stretch" mb={4}>
        <HStack spacing={2}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search relationships"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
            />
          </InputGroup>
          
          <Menu closeOnSelect={false}>
            <MenuButton
              as={IconButton}
              aria-label="Filter relationships"
              icon={<FiFilter />}
              variant="outline"
              size="sm"
              colorScheme={activeFilters.length > 0 ? "blue" : undefined}
            />
            <MenuList minWidth="180px" zIndex={10}>
              <MenuItem closeOnSelect={false} fontWeight="bold">Filter by Node Type</MenuItem>
              <Divider />
              {availableNodeTypes.map(type => (
                <MenuItem 
                  key={`node-${type}`} 
                  closeOnSelect={false}
                  onClick={() => toggleFilter(type)}
                >
                  <Flex justify="space-between" width="100%">
                    <Text>{getRelationshipName(type)}</Text>
                    {activeFilters.includes(type) && (
                      <Badge colorScheme="blue">✓</Badge>
                    )}
                  </Flex>
                </MenuItem>
              ))}
              
              <MenuItem closeOnSelect={false} fontWeight="bold" mt={2}>Filter by Relation</MenuItem>
              <Divider />
              {availableRelTypes.map(type => (
                <MenuItem 
                  key={`rel-${type}`} 
                  closeOnSelect={false}
                  onClick={() => toggleFilter(type)}
                >
                  <Flex justify="space-between" width="100%">
                    <Text>{getRelationshipName(type)}</Text>
                    {activeFilters.includes(type) && (
                      <Badge colorScheme="blue">✓</Badge>
                    )}
                  </Flex>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="View options"
              icon={viewMode === 'grid' ? <FiGrid /> : <FiList />}
              variant="outline"
              size="sm"
            />
            <MenuList minWidth="180px" zIndex={10}>
              <MenuItem 
                icon={<FiList />}
                onClick={() => setViewMode('list')}
                fontWeight={viewMode === 'list' ? "medium" : "normal"}
              >
                List view
              </MenuItem>
              <MenuItem 
                icon={<FiGrid />}
                onClick={() => setViewMode('grid')}
                fontWeight={viewMode === 'grid' ? "medium" : "normal"}
              >
                Grid view
              </MenuItem>
              <MenuItem 
                icon={<FiMoreHorizontal />}
                onClick={() => setViewMode('compact')}
                fontWeight={viewMode === 'compact' ? "medium" : "normal"}
              >
                Compact view
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
        
        <HStack spacing={2}>
          <Select 
            size="xs"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="strength">Sort: By Strength</option>
            <option value="alphabetical">Sort: A-Z</option>
            <option value="recent">Sort: Recent first</option>
          </Select>
          
          <Select 
            size="xs"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupOption)}
          >
            <option value="type">Group: By relationship</option>
            <option value="nodeType">Group: By entity type</option>
            <option value="strength">Group: By strength</option>
            <option value="none">Group: No grouping</option>
          </Select>
        </HStack>
        
        {/* Processing indicator */}
        {(isFiltering || isSorting || isGrouping) && shouldLoadSecondary && (
          <HStack spacing={2} px={2} py={1} bg="blue.50" borderRadius="md" _dark={{ bg: "blue.900" }}>
            <Spinner size="xs" color="blue.500" />
            <Text fontSize="xs" color="blue.600" _dark={{ color: "blue.200" }}>
              Processing {relationships.length} items...
            </Text>
          </HStack>
        )}
        
        {/* Warning for large datasets */}
        {showLargeDatasetWarning && relationships.length > 100 && (
          <HStack spacing={2} px={2} py={1} bg="yellow.50" borderRadius="md" _dark={{ bg: "yellow.900" }}>
            <Icon as={FiInfo} color="yellow.500" />
            <Text fontSize="xs" color="yellow.600" _dark={{ color: "yellow.200" }}>
              {relationships.length > 500 
                ? "Large dataset detected. Using optimized rendering."
                : "Performance optimizations applied for this dataset."}
            </Text>
          </HStack>
        )}
        
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <Flex flexWrap="wrap" gap={2}>
            {activeFilters.map(filter => (
              <Tag 
                key={filter} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full"
              >
                <TagLabel>{getRelationshipName(filter)}</TagLabel>
                <Button
                  size="xs"
                  variant="unstyled"
                  onClick={() => toggleFilter(filter)}
                  ml={1}
                  fontWeight="bold"
                >
                  ×
                </Button>
              </Tag>
            ))}
            {activeFilters.length > 1 && (
              <Button 
                size="xs" 
                variant="link" 
                onClick={() => setActiveFilters([])}
              >
                Clear all
              </Button>
            )}
          </Flex>
        )}
      </VStack>
      
      <Divider mb={4} />
      
      {/* Relationships section */}
      {Object.keys(groupedRelationships).length === 0 ? (
        <Box p={4} textAlign="center">
          <Text color="gray.500">No matching relationships found</Text>
        </Box>
      ) : (
        <>
          {/* Group controls for large datasets */}
          {Object.keys(groupedRelationships).length > 3 && (
            <Flex justify="flex-end" mb={2}>
              <HStack>
                <Button 
                  size="xs" 
                  variant="outline"
                  onClick={expandAllGroups}
                >
                  Expand All
                </Button>
                <Button 
                  size="xs" 
                  variant="outline"
                  onClick={collapseAllGroups}
                >
                  Collapse All
                </Button>
              </HStack>
            </Flex>
          )}
          
          {/* Virtualized groups */}
          <VStack spacing={4} align="stretch">
            {Object.entries(groupedRelationships).map(([group, rels], idx) => (
              <motion.div
                key={group}
                variants={groupVariants}
                custom={idx}
                initial="hidden"
                animate="visible"
              >
                <VirtualizedGroup 
                  group={group} 
                  relationships={rels}
                  colorScheme={
                    group === 'Strong' ? 'green' :
                    group === 'Medium' ? 'blue' :
                    group === 'Weak' ? 'gray' :
                    group === 'REPORTS_TO' ? 'pink' :
                    group === 'MEMBER_OF' ? 'blue' :
                    group === 'LEADS' ? 'red' :
                    group === 'PARTICIPATES_IN' ? 'cyan' :
                    'gray'
                  }
                />
              </motion.div>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
};

export default RelationshipsVisualizer;