import React, { useState, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList,
  FiChevronDown,
  FiMoreHorizontal
} from 'react-icons/fi';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import EnhancedRelationshipVisual from './EnhancedRelationshipVisual';
import { motion } from 'framer-motion';

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
 * RelationshipsVisualizer Component
 * An enhanced visualization of relationships with filtering, grouping, and better visual cues
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
  
  // Theme colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Filter relationships based on search and filters
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      // Apply search filter
      const matchesSearch = !searchQuery || 
        rel.label.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Apply type filters
      const matchesTypeFilter = activeFilters.length === 0 || 
        (activeFilters.includes(rel.nodeType) || activeFilters.includes(rel.type));
        
      return matchesSearch && matchesTypeFilter;
    });
  }, [relationships, searchQuery, activeFilters]);

  // Sort relationships
  const sortedRelationships = useMemo(() => {
    return [...filteredRelationships].sort((a, b) => {
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
  }, [filteredRelationships, sortBy]);
  
  // Group relationships
  const groupedRelationships = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Relationships': sortedRelationships };
    }
    
    const groups: Record<string, RelationshipData[]> = {};
    
    // Group relationships first
    sortedRelationships.forEach(rel => {
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
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rel);
    });
    
    // Special ordering for strength groups
    if (groupBy === 'strength') {
      const orderedGroups: Record<string, RelationshipData[]> = {};
      const strengthOrder = ['Strong', 'Medium', 'Weak', 'Unknown'];
      
      strengthOrder.forEach(key => {
        if (groups[key] && groups[key].length > 0) {
          orderedGroups[key] = groups[key];
        }
      });
      
      return orderedGroups;
    }
    
    // Special ordering for relationship types
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
      
      typeOrder.forEach(key => {
        if (groups[key] && groups[key].length > 0) {
          orderedGroups[key] = groups[key];
        }
      });
      
      Object.keys(groups).forEach(key => {
        if (!typeOrder.includes(key as any)) {
          orderedGroups[key] = groups[key];
        }
      });
      
      return orderedGroups;
    }
    
    return groups;
  }, [sortedRelationships, groupBy]);
  
  // Get node types for filtering
  const availableNodeTypes = useMemo(() => {
    const types = new Set<string>();
    relationships.forEach(rel => {
      types.add(rel.nodeType);
    });
    return Array.from(types);
  }, [relationships]);
  
  // Get relationship types for filtering
  const availableRelTypes = useMemo(() => {
    const types = new Set<string>();
    relationships.forEach(rel => {
      types.add(rel.type);
    });
    return Array.from(types);
  }, [relationships]);
  
  // Toggle filter
  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };
  
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
            <option value="alphabetical">Sort: Alphabetical</option>
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
            <option value="none">Group: None</option>
          </Select>
        </HStack>
        
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
      <VStack spacing={4} align="stretch">
        {Object.keys(groupedRelationships).length === 0 ? (
          <Box p={4} textAlign="center">
            <Text color="gray.500">No matching relationships found</Text>
          </Box>
        ) : (
          Object.entries(groupedRelationships).map(([group, rels], idx) => (
            <Box 
              key={group}
              as={motion.div}
              variants={groupVariants}
              custom={idx}
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
              >
                <HStack>
                  <Badge colorScheme={
                    group === 'Strong' ? 'green' :
                    group === 'Medium' ? 'blue' :
                    group === 'Weak' ? 'gray' :
                    group === 'REPORTS_TO' ? 'pink' :
                    group === 'MEMBER_OF' ? 'blue' :
                    group === 'LEADS' ? 'red' :
                    group === 'PARTICIPATES_IN' ? 'cyan' :
                    'gray'
                  }>
                    {getRelationshipName(group)}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">{rels.length} {rels.length === 1 ? 'item' : 'items'}</Text>
                </HStack>
                
                <IconButton
                  aria-label="More options"
                  icon={<FiMoreHorizontal />}
                  size="xs"
                  variant="ghost"
                />
              </Flex>
              
              {/* Relationships in this group */}
              <Box p={2}>
                <VStack spacing={2} align="stretch">
                  {rels.map(rel => (
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
                      onSelect={handleRelationshipSelect}
                      onAction={handleRelationshipAction}
                    />
                  ))}
                </VStack>
              </Box>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default RelationshipsVisualizer;