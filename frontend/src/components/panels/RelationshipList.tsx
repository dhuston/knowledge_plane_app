import React, { useMemo, useState, useRef, useCallback } from 'react';
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
  Flex,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  Select,
  Collapse,
  Grid,
  GridItem,
  Progress,
  Center,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VisuallyHidden,
  ScaleFade,
  SlideFade,
  usePrefersReducedMotion
} from '@chakra-ui/react';
import { motion, keyframes } from 'framer-motion';
import { 
  FiArrowRight, 
  FiUsers, 
  FiUser, 
  FiTarget, 
  FiFolder, 
  FiFlag, 
  FiSearch, 
  FiFilter, 
  FiChevronDown,
  FiBook,
  FiBriefcase,
  FiChevronRight,
  FiSettings,
  FiExternalLink,
  FiList,
  FiGrid,
  FiMoreHorizontal,
  FiPlus,
  FiStar,
  FiCalendar,
  FiMessageSquare
} from 'react-icons/fi';

import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { Relationship } from '../../types/entities';

// Extended relationship interface for internal use
interface EnhancedRelationship extends Relationship {
  nodeId?: string; // Connected node ID
  nodeType?: MapNodeTypeEnum; // Type of the connected node
  name?: string; // Alternative name
  strength?: number; // Relationship strength (0-1)
  lastInteraction?: string; // Last interaction date
  frequency?: number; // Interaction frequency (0-1)
  metadata?: Record<string, unknown>; // Additional metadata
}

// Props including optional callback handler for relationship selection
interface RelationshipListProps {
  relationships: Relationship[];
  isLoading: boolean;
  entityType: MapNodeTypeEnum;
  onSelectRelationship?: (relationship: EnhancedRelationship) => void;
}

// Sort options for relationships
type SortOption = 'alphabetical' | 'recent' | 'strength' | 'frequency';

// Group options for relationships
type GroupOption = 'type' | 'nodeType' | 'status' | 'none';

// View mode options
type ViewMode = 'list' | 'grid' | 'compact';

/**
 * RelationshipList Component
 * Displays and manages relationship data with filtering, sorting, and grouping capabilities
 */
const RelationshipList: React.FC<RelationshipListProps> = ({
  relationships,
  isLoading,
  entityType,
  onSelectRelationship
}) => {
  // State for UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [groupBy, setGroupBy] = useState<GroupOption>('type');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Refs for keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Theme values
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const iconBg = useColorModeValue('gray.100', 'gray.700');
  const strongRelColor = useColorModeValue('blue.500', 'blue.300');
  const weakRelColor = useColorModeValue('gray.300', 'gray.600');
  
  // Enhanced relationships with additional computed properties
  const enhancedRelationships = useMemo((): EnhancedRelationship[] => {
    return relationships.map(rel => {
      // Extract actual node ID (assuming we're looking from source perspective)
      const nodeId = rel.target || '';
      const nodeType = rel.target_type || MapNodeTypeEnum.USER;
      
      // Generate random strength for demo (in real app, this would come from API)
      const strength = Math.random();
      const frequency = Math.random();
      const lastInteraction = new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toISOString();
      
      return {
        ...rel,
        nodeId,
        nodeType,
        strength,
        frequency,
        lastInteraction
      };
    });
  }, [relationships]);
  
  // Filter relationships based on search and type filters
  const filteredRelationships = useMemo(() => {
    return enhancedRelationships.filter(rel => {
      // Apply search filter
      const matchesSearch = !searchQuery || 
        (rel.label || rel.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
          
      // Apply type filters
      const matchesTypeFilter = activeFilters.length === 0 || 
        (rel.nodeType && activeFilters.includes(rel.nodeType));
        
      return matchesSearch && matchesTypeFilter;
    });
  }, [enhancedRelationships, searchQuery, activeFilters]);
  
  // Sort relationships based on selected option
  const sortedRelationships = useMemo(() => {
    return [...filteredRelationships].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return (a.label || a.name || '').localeCompare(b.label || b.name || '');
        case 'recent':
          return new Date(b.lastInteraction || '').getTime() -
                new Date(a.lastInteraction || '').getTime();
        case 'strength':
          return (b.strength || 0) - (a.strength || 0);
        case 'frequency':
          return (b.frequency || 0) - (a.frequency || 0);
        default:
          return 0;
      }
    });
  }, [filteredRelationships, sortBy]);
  
  // Group relationships based on selected option
  const groupedRelationships = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Relationships': sortedRelationships };
    }
    
    const groups: Record<string, EnhancedRelationship[]> = {};
    
    sortedRelationships.forEach(rel => {
      let key = 'OTHER';
      
      switch (groupBy) {
        case 'type':
          key = rel.type || 'OTHER';
          break;
        case 'nodeType':
          key = rel.nodeType || 'UNKNOWN';
          break;
        case 'status':
          key = (rel.metadata?.status as string) || 'Unknown';
          break;
        default:
          key = 'All';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rel);
    });
    
    return groups;
  }, [sortedRelationships, groupBy]);
  
  // Initialize expanded groups state when groups change
  React.useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    Object.keys(groupedRelationships).forEach(group => {
      // Expand by default if few groups or few relationships total
      const shouldExpandByDefault = 
        Object.keys(groupedRelationships).length <= 3 || 
        sortedRelationships.length < 8;
      
      initialExpandedState[group] = expandedGroups[group] ?? shouldExpandByDefault;
    });
    setExpandedGroups(initialExpandedState);
  }, [groupedRelationships, expandedGroups, sortedRelationships.length]);
  
  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupKey]: !expandedGroups[groupKey]
    });
  };
  
  // Get relationship type color
  const getRelationshipColor = (type: MapEdgeTypeEnum | string): string => {
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
  
  // Get relationship type display name
  const getRelationshipName = (type: string): string => {
    // Convert SNAKE_CASE to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get icon for node type
  const getNodeIcon = (type: MapNodeTypeEnum | string) => {
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

  // Get header text based on entity type
  const getHeaderText = (): string => {
    switch (entityType) {
      case MapNodeTypeEnum.USER: return 'Connections & Teams';
      case MapNodeTypeEnum.TEAM: return 'Members & Projects';
      case MapNodeTypeEnum.PROJECT: return 'Team & Contributors';
      case MapNodeTypeEnum.GOAL: return 'Aligned Projects';
      default: return 'Relationships';
    }
  };
  
  // Toggle a filter in the active filters
  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };
  
  // Get available node types for filtering
  const availableNodeTypes = useMemo(() => {
    const types = new Set<string>();
    enhancedRelationships.forEach(rel => {
      if (rel.nodeType) types.add(rel.nodeType);
    });
    return Array.from(types);
  }, [enhancedRelationships]);
  
  // Handle relationship selection
  const handleSelectRelationship = useCallback((rel: EnhancedRelationship) => {
    // Call the passed callback if provided
    if (onSelectRelationship) {
      onSelectRelationship(rel);
    } else {
      // Default behavior: emit navigation event
      const navigateEvent = new CustomEvent('navigate-to-node', {
        detail: {
          nodeId: rel.nodeId,
          nodeType: rel.nodeType || 'UNKNOWN',
          label: rel.label || rel.name || 'Unknown'
        },
        bubbles: true
      });
      document.dispatchEvent(navigateEvent);
    }
  }, [onSelectRelationship]);
  
  // Format date string for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
  // Get visual strength indicator
  const getStrengthIndicator = (strength?: number) => {
    if (strength === undefined) return null;
    
    return (
      <Tooltip label={`Relationship strength: ${Math.round((strength || 0) * 100)}%`} placement="top">
        <Box width="100%" mt={1}>
          <Progress 
            value={(strength || 0) * 100} 
            size="xs" 
            colorScheme={strength > 0.7 ? "green" : strength > 0.3 ? "blue" : "gray"}
            borderRadius="full"
          />
        </Box>
      </Tooltip>
    );
  };

  // Define pulse animation
  const pulseAnimation = {
    animate: {
      scale: [0.97, 1, 0.97],
      opacity: [0.6, 0.9, 0.6],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };
  
  const prefersReducedMotion = usePrefersReducedMotion();

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
  
  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  // RENDERING COMPONENTS
  
  // Loading state with animated skeleton
  if (isLoading) {
    const placeholderItems = [1, 2, 3];
    
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        
        <SlideFade in={true} offsetY={20}>
          <VStack spacing={3} align="stretch">
            {placeholderItems.map((item, index) => (
              <motion.div
                key={`skeleton-${index}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
              >
                <Flex 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  alignItems="center"
                  animate={prefersReducedMotion ? {} : pulseAnimation.animate}
                  bg={sectionBg}
                >
                  <Box 
                    borderRadius="full" 
                    width="40px" 
                    height="40px" 
                    bg="gray.200" 
                    mr={3}
                    _dark={{ bg: "gray.700" }} 
                  />
                  <Box flex="1">
                    <Box 
                      height="12px" 
                      width={`${Math.random() * 40 + 40}%`} 
                      bg="gray.200" 
                      _dark={{ bg: "gray.700" }}
                      mb={2}
                      borderRadius="md"
                    />
                    <Box 
                      height="8px" 
                      width={`${Math.random() * 30 + 20}%`}
                      bg="gray.200"
                      _dark={{ bg: "gray.700" }}
                      borderRadius="md"
                    />
                  </Box>
                </Flex>
              </motion.div>
            ))}
          </VStack>
        </SlideFade>
      </VStack>
    );
  }

  // Empty state
  if (!relationships || relationships.length === 0) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        <ScaleFade in={true} initialScale={0.9}>
          <Center 
            p={6} 
            borderWidth="1px" 
            borderRadius="md" 
            borderStyle="dashed"
            transition="all 0.3s ease-in-out"
            _hover={{ 
              borderColor: 'blue.400',
              boxShadow: 'sm'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
            >
              <VStack spacing={3}>
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    transition: { 
                      repeat: Infinity, 
                      repeatType: "reverse", 
                      duration: 2,
                      ease: "easeInOut"
                    } 
                  }}
                >
                  <Icon as={FiUsers} boxSize={10} color="gray.400" />
                </motion.div>
                <Text color="gray.500" fontSize="sm" textAlign="center">
                  No relationships found
                </Text>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    leftIcon={<FiPlus />} 
                    size="sm" 
                    variant="outline"
                    colorScheme="blue"
                    _hover={{
                      transform: "translateY(-2px)",
                      shadow: "md",
                    }}
                    transition="all 0.2s"
                  >
                    Add connection
                  </Button>
                </motion.div>
              </VStack>
            </motion.div>
          </Center>
        </ScaleFade>
      </VStack>
    );
  }

  // Single grid item component
  const GridItem = React.memo(({ rel, colorScheme, hoverBg, handleSelectRelationship }: {
    rel: EnhancedRelationship;
    colorScheme: string;
    hoverBg: string;
    handleSelectRelationship: (rel: EnhancedRelationship) => void;
  }) => {
    const nodeType = rel.nodeType || MapNodeTypeEnum.USER;
    
    return (
      <Box
        p={3}
        borderWidth="1px"
        borderRadius="md"
        _hover={{ 
          bg: hoverBg,
          borderColor: `${colorScheme}.400`
        }}
        onClick={() => handleSelectRelationship(rel)}
        role="button"
        tabIndex={0}
        aria-label={`View ${rel.label || rel.name || 'Unknown'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectRelationship(rel);
          }
        }}
      >
        <VStack spacing={2} align="center">
          <Center 
            p={2} 
            borderRadius="full" 
            bg={`${colorScheme}.50`} 
            color={`${colorScheme}.500`}
            boxSize="40px"
            _dark={{ 
              bg: `${colorScheme}.900`, 
              color: `${colorScheme}.200` 
            }}
          >
            <Icon as={getNodeIcon(nodeType)} boxSize={4} />
          </Center>
          
          <Text fontSize="sm" fontWeight="medium" noOfLines={1} textAlign="center">
            {rel.label || rel.name || 'Unknown'}
          </Text>
          
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {getRelationshipName(nodeType)}
          </Text>
          
          {rel.strength !== undefined && getStrengthIndicator(rel.strength)}
        </VStack>
      </Box>
    );
  });
  
  // Render the grid view component with virtualization for large datasets
  const renderGridView = (rels: EnhancedRelationship[], colorScheme: string) => {
    // Don't virtualize for small lists
    if (rels.length < 25) {
      return (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={2} p={2}>
          {rels.map((rel, idx) => (
            <GridItem
              key={`${rel.nodeId || ''}-${idx}`}
              rel={rel}
              colorScheme={colorScheme}
              hoverBg={hoverBg}
              handleSelectRelationship={handleSelectRelationship}
            />
          ))}
        </SimpleGrid>
      );
    }

    // For larger lists, implement grid virtualization
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const containerHeight = 400; // Fixed container height
    
    // Grid configuration
    const itemsPerRow = 4; // Based on lg: 4 setting in SimpleGrid
    const itemHeight = 140; // Approximate height of each grid item in pixels
    
    // Calculate row information
    const totalRows = Math.ceil(rels.length / itemsPerRow);
    const rowHeight = itemHeight;
    const totalHeight = totalRows * rowHeight;
    
    // Calculate visible rows based on scroll position
    const visibleRowStart = Math.max(0, Math.floor(scrollPosition / rowHeight) - 1); // 1 row buffer
    const visibleRowEnd = Math.min(totalRows, Math.ceil((scrollPosition + containerHeight) / rowHeight) + 1); // 1 row buffer
    
    // Calculate items to display
    const startIndex = visibleRowStart * itemsPerRow;
    const endIndex = Math.min(rels.length, visibleRowEnd * itemsPerRow);
    const visibleItems = rels.slice(startIndex, endIndex);
    
    // Calculate top padding to position items correctly
    const topPadding = visibleRowStart * rowHeight;
    
    // Handle scroll events
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    }, []);
    
    return (
      <Box
        height={`${containerHeight}px`}
        overflowY="auto"
        onScroll={handleScroll}
        position="relative"
        className="virtualized-grid-container"
        data-testid="virtualized-grid"
        ref={gridRef}
      >
        <Box
          position="relative"
          height={`${totalHeight}px`}
        >
          <Box
            position="absolute"
            top={`${topPadding}px`}
            width="100%"
            p={2}
          >
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={2}>
              {visibleItems.map((rel, idx) => (
                <GridItem
                  key={`${rel.nodeId || ''}-${startIndex + idx}`}
                  rel={rel}
                  colorScheme={colorScheme}
                  hoverBg={hoverBg}
                  handleSelectRelationship={handleSelectRelationship}
                />
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    );
  };

  // Single compact tag component
  const CompactTag = React.memo(({ rel, colorScheme, handleSelectRelationship }: {
    rel: EnhancedRelationship;
    colorScheme: string;
    handleSelectRelationship: (rel: EnhancedRelationship) => void;
  }) => {
    const nodeType = rel.nodeType || MapNodeTypeEnum.USER;
    return (
      <Tag
        size="md"
        borderRadius="full"
        colorScheme={rel.strength && rel.strength > 0.6 ? colorScheme : undefined}
        variant={rel.strength && rel.strength > 0.6 ? "subtle" : "outline"}
        cursor="pointer"
        onClick={() => handleSelectRelationship(rel)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectRelationship(rel);
          }
        }}
        m={1} // Add margin for proper spacing in virtualized layout
      >
        <Icon 
          as={getNodeIcon(nodeType)} 
          mr={1} 
          boxSize={3} 
        />
        <TagLabel noOfLines={1}>
          {rel.label || rel.name || 'Unknown'}
        </TagLabel>
      </Tag>
    );
  });

  // Render the compact view component with chunked virtualization for large datasets
  const renderCompactView = (rels: EnhancedRelationship[], colorScheme: string) => {
    // Don't virtualize for small lists
    if (rels.length < 50) {
      return (
        <Box p={2}>
          <Flex flexWrap="wrap" gap={2}>
            {rels.map((rel, idx) => (
              <CompactTag
                key={`${rel.nodeId || ''}-${idx}`}
                rel={rel}
                colorScheme={colorScheme}
                handleSelectRelationship={handleSelectRelationship}
              />
            ))}
          </Flex>
        </Box>
      );
    }

    // For larger lists, implement chunked virtualization
    // This is different from list/grid virtualization because tags have variable widths
    // So we chunk them into rows of approximately 25 items each
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const containerHeight = 300; // Fixed container height
    
    // Configuration
    const itemsPerChunk = 25;
    const chunkHeight = 40; // Approximate height of a row of tags in pixels
    
    // Calculate chunk information
    const totalChunks = Math.ceil(rels.length / itemsPerChunk);
    const totalHeight = totalChunks * chunkHeight;
    
    // Calculate visible chunks based on scroll position
    const visibleChunkStart = Math.max(0, Math.floor(scrollPosition / chunkHeight) - 1); // 1 chunk buffer
    const visibleChunkEnd = Math.min(totalChunks, Math.ceil((scrollPosition + containerHeight) / chunkHeight) + 1); // 1 chunk buffer
    
    // Calculate items to display
    const startIndex = visibleChunkStart * itemsPerChunk;
    const endIndex = Math.min(rels.length, visibleChunkEnd * itemsPerChunk);
    const visibleItems = rels.slice(startIndex, endIndex);
    
    // Calculate top padding to position items correctly
    const topPadding = visibleChunkStart * chunkHeight;
    
    // Handle scroll events
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    }, []);
    
    return (
      <Box
        height={`${containerHeight}px`}
        overflowY="auto"
        onScroll={handleScroll}
        position="relative"
        className="virtualized-compact-container"
        data-testid="virtualized-compact"
        ref={containerRef}
      >
        <Box
          position="relative"
          height={`${totalHeight}px`}
        >
          <Box
            position="absolute"
            top={`${topPadding}px`}
            width="100%"
            p={2}
          >
            <Flex flexWrap="wrap">
              {visibleItems.map((rel, idx) => (
                <CompactTag
                  key={`${rel.nodeId || ''}-${startIndex + idx}`}
                  rel={rel}
                  colorScheme={colorScheme}
                  handleSelectRelationship={handleSelectRelationship}
                />
              ))}
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render a single relationship item
  const RelationshipItem = React.memo(({ rel, idx, handleSelectRelationship, colorScheme, borderColor, hoverBg }: {
    rel: EnhancedRelationship;
    idx: number;
    handleSelectRelationship: (rel: EnhancedRelationship) => void;
    colorScheme: string;
    borderColor: string;
    hoverBg: string;
  }) => {
    const nodeType = rel.nodeType || MapNodeTypeEnum.USER;
    
    return (
      <Box 
        borderTopWidth={idx > 0 ? "1px" : "0"}
        borderColor={borderColor}
      >
        <Grid 
          templateColumns="auto 1fr auto"
          gap={3}
          p={3}
          alignItems="center"
          _hover={{ bg: hoverBg }}
          onClick={() => handleSelectRelationship(rel)}
          cursor="pointer"
          role="button"
          tabIndex={0}
          aria-label={`View ${rel.label || rel.name || 'Unknown'}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectRelationship(rel);
            }
          }}
          borderLeftWidth="3px"
          borderLeftColor={rel.strength && rel.strength > 0.7 ? 
            `${colorScheme}.500` : 
            "transparent"
          }
          pl={rel.strength && rel.strength > 0.7 ? 2 : 3}
        >
          {/* Entity icon */}
          <GridItem>
            <Center 
              p={2} 
              borderRadius="full" 
              bg={`${colorScheme}.50`} 
              color={`${colorScheme}.500`}
              _dark={{ 
                bg: `${colorScheme}.900`, 
                color: `${colorScheme}.200` 
              }}
            >
              <Icon as={getNodeIcon(nodeType)} boxSize={4} />
            </Center>
          </GridItem>
          
          {/* Entity details */}
          <GridItem>
            <VStack align="start" spacing={1}>
              <Flex alignItems="center" width="100%">
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {rel.label || rel.name || 'Unknown'}
                </Text>
                
                {rel.strength && rel.strength > 0.8 && (
                  <Tooltip label="Strong relationship">
                    <Icon as={FiStar} boxSize={3} color="yellow.500" ml={1} />
                  </Tooltip>
                )}
              </Flex>
              
              <HStack spacing={3}>
                <Text fontSize="xs" color="gray.500">
                  {getRelationshipName(nodeType)}
                </Text>
                
                {rel.lastInteraction && (
                  <HStack spacing={1}>
                    <Icon as={FiCalendar} boxSize={3} color="gray.500" />
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(rel.lastInteraction)}
                    </Text>
                  </HStack>
                )}
              </HStack>
              
              {rel.strength !== undefined && getStrengthIndicator(rel.strength)}
            </VStack>
          </GridItem>
          
          {/* Action buttons */}
          <GridItem>
            <HStack spacing={1}>
              <Tooltip label="Send message" placement="top">
                <IconButton
                  aria-label="Send message"
                  icon={<FiMessageSquare />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Message action
                  }}
                />
              </Tooltip>
              
              <Tooltip label={`View ${rel.label || rel.name || 'Unknown'}`} placement="top">
                <IconButton
                  aria-label={`View ${rel.label || rel.name || 'Unknown'}`}
                  icon={<FiArrowRight />}
                  size="sm"
                  variant="ghost"
                />
              </Tooltip>
            </HStack>
          </GridItem>
        </Grid>
      </Box>
    );
  });
  
  // Render the list view component with virtualization for large datasets
  const renderListView = (rels: EnhancedRelationship[], colorScheme: string) => {
    // Don't virtualize for small lists (less than 20 items)
    if (rels.length < 20) {
      return (
        <Box>
          {rels.map((rel, idx) => (
            <RelationshipItem
              key={`${rel.nodeId || ''}-${idx}`}
              rel={rel}
              idx={idx}
              handleSelectRelationship={handleSelectRelationship}
              colorScheme={colorScheme}
              borderColor={borderColor}
              hoverBg={hoverBg}
            />
          ))}
        </Box>
      );
    }

    // For larger lists, implement virtualization
    const itemHeight = 84; // Approximate height of each item in pixels
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const containerHeight = 400; // Fixed container height
    const contentRef = React.useRef<HTMLDivElement>(null);
    
    // Calculate which items to render based on scroll position
    const startIndex = Math.max(0, Math.floor(scrollPosition / itemHeight) - 5); // Buffer of 5 items
    const endIndex = Math.min(rels.length, Math.ceil((scrollPosition + containerHeight) / itemHeight) + 5); // Buffer of 5 items
    const visibleItems = rels.slice(startIndex, endIndex);
    
    // Calculate padding to preserve scroll position
    const topPadding = startIndex * itemHeight;
    const totalHeight = rels.length * itemHeight;
    
    // Handle scroll events
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollPosition(e.currentTarget.scrollTop);
    }, []);
    
    return (
      <Box 
        height={`${containerHeight}px`} 
        overflowY="auto" 
        onScroll={handleScroll}
        position="relative"
        className="virtualized-container"
        data-testid="virtualized-list"
      >
        <Box 
          position="relative"
          height={`${totalHeight}px`}
          ref={contentRef}
        >
          <Box position="absolute" top={`${topPadding}px`} width="100%">
            {visibleItems.map((rel, idx) => (
              <RelationshipItem
                key={`${rel.nodeId || ''}-${startIndex + idx}`}
                rel={rel}
                idx={startIndex + idx}
                handleSelectRelationship={handleSelectRelationship}
                colorScheme={colorScheme}
                borderColor={borderColor}
                hoverBg={hoverBg}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  // Main content rendering
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <VStack spacing={4} align="stretch" ref={containerRef} role="region" aria-label={getHeaderText()}>
        {/* Header with tabs for different views */}
        <motion.div variants={groupVariants}>
          <Tabs size="sm" colorScheme="blue" variant="line" isLazy>
            <TabList borderBottomColor={borderColor}>
              <Tab fontWeight="medium">All</Tab>
              <Tab fontWeight="medium">Direct</Tab>
              <Tab fontWeight="medium">Groups</Tab>
            </TabList>
        
            <TabPanels pt={3}>
              <TabPanel p={0}>
                {/* Main content panel */}
                <VStack spacing={4} align="stretch">
                  {/* Search, sort, filter, and view controls */}
                  <HStack spacing={2} mb={2}>
                    <InputGroup size="sm" flex={1}>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        placeholder="Search relationships" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        borderRadius="md"
                        aria-label="Search relationships"
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
                        <MenuItem closeOnSelect={false} fontWeight="bold">Filter by Type</MenuItem>
                        <Divider />
                        {availableNodeTypes.map(type => (
                          <MenuItem 
                            key={type} 
                            closeOnSelect={false}
                            onClick={() => toggleFilter(type)}
                            icon={
                              <Icon 
                                as={getNodeIcon(type as MapNodeTypeEnum)} 
                                color={activeFilters.includes(type) ? "blue.500" : undefined}
                              />
                            }
                          >
                            <HStack justifyContent="space-between" width="100%">
                              <Text>{getRelationshipName(type)}</Text>
                              {activeFilters.includes(type) && (
                                <Badge colorScheme="blue">✓</Badge>
                              )}
                            </HStack>
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
                        <Divider />
                        <MenuItem icon={<FiSettings />}>Display options</MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                  
                  {/* Second control row - Sort, Group */}
                  <HStack spacing={2} mb={3}>
                    <Box flex="1">
                      <Select 
                        size="xs" 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        borderRadius="md"
                        aria-label="Sort relationships"
                      >
                        <option value="alphabetical">Sort: Alphabetical</option>
                        <option value="recent">Sort: Recent first</option>
                        <option value="strength">Sort: Strength</option>
                        <option value="frequency">Sort: Interaction frequency</option>
                      </Select>
                    </Box>
                    
                    <Box flex="1">
                      <Select 
                        size="xs" 
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                        borderRadius="md"
                        aria-label="Group relationships"
                      >
                        <option value="type">Group: By relationship</option>
                        <option value="nodeType">Group: By entity type</option>
                        <option value="status">Group: By status</option>
                        <option value="none">Group: None</option>
                      </Select>
                    </Box>
                  </HStack>
                  
                  {/* Active filters */}
                  {activeFilters.length > 0 && (
                    <Flex flexWrap="wrap" gap={2} mb={3}>
                      {activeFilters.map(filter => (
                        <Tag key={filter} size="sm" colorScheme="blue" borderRadius="full">
                          <TagLabel>{getRelationshipName(filter)}</TagLabel>
                          <Button
                            size="xs"
                            variant="unstyled"
                            onClick={() => toggleFilter(filter)}
                            aria-label={`Remove ${getRelationshipName(filter)} filter`}
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
                          aria-label="Clear all filters"
                        >
                          Clear all
                        </Button>
                      )}
                    </Flex>
                  )}
                  
                  {/* Groups container */}
                  <Box>
                    {Object.keys(groupedRelationships).length === 0 ? (
                      <Box p={4} textAlign="center" borderWidth="1px" borderRadius="md">
                        <Text color="gray.500" fontSize="sm">No matches found</Text>
                      </Box>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(groupedRelationships).map(([group, rels], index) => {
                          const isExpanded = expandedGroups[group] ?? true;
                          const colorScheme = getRelationshipColor(group as MapEdgeTypeEnum);
                          
                          return (
                            <motion.div
                              key={group}
                              variants={groupVariants}
                              custom={index}
                              whileHover={{ 
                                scale: 1.01,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <Box 
                                borderWidth="1px"
                                borderRadius="md"
                                overflow="hidden"
                                bg={sectionBg}
                                role="region"
                                transition="all 0.2s ease-in-out"
                                _hover={{ boxShadow: "sm" }}
                                aria-label={`${getRelationshipName(group)} relationships (${rels.length})`}
                              >
                                {/* Group header - clickable to expand/collapse */}
                                <Flex 
                                  p={3}
                                  bg={headerBg}
                                  alignItems="center"
                                  cursor="pointer"
                                  onClick={() => toggleGroupExpansion(group)}
                                  _hover={{ bg: hoverBg }}
                                  aria-expanded={isExpanded}
                                  aria-controls={`group-${group}`}
                                  transition="background 0.2s ease"
                                >
                                  <motion.div
                                    animate={{ 
                                      rotate: isExpanded ? 0 : -90
                                    }}
                                    transition={{ 
                                      duration: 0.3,
                                      type: "spring",
                                      stiffness: 260,
                                      damping: 20
                                    }}
                                  >
                                    <Icon 
                                      as={FiChevronDown}
                                      mr={2}
                                      aria-hidden="true"
                                    />
                                  </motion.div>
                                
                                  <Badge 
                                    colorScheme={colorScheme}
                                    px={2} 
                                    py={1} 
                                    borderRadius="full"
                                    variant="solid"
                                    mr={2}
                                  >
                                    {getRelationshipName(group)}
                                  </Badge>
                                  
                                  <Text fontSize="xs" color="gray.500" ml={1}>
                                    {rels.length} {rels.length === 1 ? 'connection' : 'connections'}
                                  </Text>
                                  
                                  <Box flex="1" />
                                  
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      size="xs"
                                      icon={<FiMoreHorizontal />}
                                      variant="ghost"
                                      aria-label={`More options for ${getRelationshipName(group)}`}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <MenuList zIndex={10}>
                                      <MenuItem icon={<FiStar />}>Mark as important</MenuItem>
                                      <MenuItem icon={<FiExternalLink />}>View all in map</MenuItem>
                                      <MenuItem icon={<FiFilter />}>Filter to this type</MenuItem>
                                    </MenuList>
                                  </Menu>
                                </Flex>
                                
                                {/* Collapsible relationship items */}
                                <Collapse in={isExpanded} animateOpacity id={`group-${group}`}>
                                  {viewMode === 'grid' 
                                    ? renderGridView(rels, colorScheme)
                                    : viewMode === 'compact'
                                      ? renderCompactView(rels, colorScheme)
                                      : renderListView(rels, colorScheme)
                                  }
                                </Collapse>
                              </Box>
                            </motion.div>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </TabPanel>
              
              <TabPanel p={0}>
                <Center py={8}>
                  <VStack spacing={3}>
                    <Icon as={FiUsers} boxSize={10} color="gray.400" />
                    <Heading size="sm">Direct Connections</Heading>
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      This view is being developed
                    </Text>
                  </VStack>
                </Center>
              </TabPanel>
              
              <TabPanel p={0}>
                <Center py={8}>
                  <VStack spacing={3}>
                    <Icon as={FiFolder} boxSize={10} color="gray.400" />
                    <Heading size="sm">Group View</Heading>
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      This view is being developed
                    </Text>
                  </VStack>
                </Center>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </motion.div>
        
        {/* Screen reader only guide for keyboard users */}
        <VisuallyHidden>
          <Text>
            Use the tab key to navigate between relationship items and press Enter to view details.
            Use arrow keys to navigate within groupings.
          </Text>
        </VisuallyHidden>
      </VStack>
    </motion.div>
  );
};

export default RelationshipList;