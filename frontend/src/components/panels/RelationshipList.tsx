import React, { useMemo, useState } from 'react';
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
  TagCloseButton,
} from '@chakra-ui/react';
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
  FiBriefcase
} from 'react-icons/fi';

import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { Relationship } from '../../types/entities';

interface RelationshipListProps {
  relationships: Relationship[];
  isLoading: boolean;
  entityType: MapNodeTypeEnum;
}

const RelationshipList: React.FC<RelationshipListProps> = ({
  relationships,
  isLoading,
  entityType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Filter relationships based on search and type filters
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
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
  }, [relationships, searchQuery, activeFilters]);
  
  // Group relationships by type
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredRelationships.forEach(rel => {
      const type = rel.type || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(rel);
    });
    
    return groups;
  }, [filteredRelationships]);
  
  // Get relationship type color
  const getRelationshipColor = (type: MapEdgeTypeEnum): string => {
    switch (type) {
      case MapEdgeTypeEnum.REPORTS_TO:
        return 'pink';
      case MapEdgeTypeEnum.MEMBER_OF:
        return 'blue';
      case MapEdgeTypeEnum.LEADS:
        return 'red';
      case MapEdgeTypeEnum.OWNS:
        return 'purple';
      case MapEdgeTypeEnum.PARTICIPATES_IN:
        return 'cyan';
      case MapEdgeTypeEnum.ALIGNED_TO:
        return 'green';
      case MapEdgeTypeEnum.PARENT_OF:
        return 'orange';
      case MapEdgeTypeEnum.RELATED_TO:
        return 'gray';
      default:
        return 'gray';
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
        return FiFlag;
    }
  };

  // Get header text based on entity type
  const getHeaderText = (): string => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return 'Connections & Teams';
      case MapNodeTypeEnum.TEAM:
        return 'Members & Projects';
      case MapNodeTypeEnum.PROJECT:
        return 'Team & Contributors';
      case MapNodeTypeEnum.GOAL:
        return 'Aligned Projects';
      default:
        return 'Relationships';
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
    relationships.forEach(rel => {
      if (rel.nodeType) types.add(rel.nodeType);
    });
    return Array.from(types);
  }, [relationships]);

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
        </Box>
      </VStack>
    );
  }

  if (!relationships || relationships.length === 0) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">{getHeaderText()}</Heading>
        </Box>
        <Text color="gray.500" fontSize="sm" textAlign="center" py={2}>
          No relationships found
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box p={3} bg={headerBg} borderRadius="md">
        <Heading size="sm">{getHeaderText()}</Heading>
      </Box>
      
      {/* Search and filter controls */}
      <Box mb={2}>
        <HStack spacing={2} mb={2}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
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
            <MenuList minWidth="180px">
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
        </HStack>
        
        {/* Active filters */}
        {activeFilters.length > 0 && (
          <Flex flexWrap="wrap" gap={2} mt={2}>
            {activeFilters.map(filter => (
              <Tag key={filter} size="sm" colorScheme="blue" borderRadius="full">
                <TagLabel>{getRelationshipName(filter)}</TagLabel>
                <TagCloseButton onClick={() => toggleFilter(filter)} />
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
      </Box>
      
      {/* Groups container */}
      <Box 
        borderWidth="1px"
        borderRadius="md"
        borderColor={borderColor}
        bg={sectionBg}
        overflow="hidden"
      >
        {Object.keys(groupedRelationships).length === 0 ? (
          <Box p={4} textAlign="center">
            <Text color="gray.500" fontSize="sm">No matches found</Text>
          </Box>
        ) : (
          Object.entries(groupedRelationships).map(([type, rels], groupIndex) => (
            <Box 
              key={type} 
              borderBottomWidth={groupIndex < Object.keys(groupedRelationships).length - 1 ? "1px" : "0"}
              borderColor={borderColor}
            >
              {/* Group header */}
              <HStack 
                spacing={2} 
                p={3}
                bg={headerBg}
                borderBottomWidth="1px"
                borderColor={borderColor}
              >
                <Badge 
                  colorScheme={getRelationshipColor(type as MapEdgeTypeEnum)}
                  px={2} 
                  py={1} 
                  borderRadius="full"
                  variant="solid"
                >
                  {getRelationshipName(type)}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  ({rels.length})
                </Text>
              </HStack>
              
              {/* Relationship items */}
              <SimpleGrid 
                columns={{ base: 1, md: rels.length > 3 ? 2 : 1 }} 
                spacing={0}
                divider={<Divider />}
              >
                {rels.map((rel, idx) => {
                  const nodeType = rel.nodeType || MapNodeTypeEnum.USER;
                  const colorScheme = getRelationshipColor(type as MapEdgeTypeEnum);
                  
                  return (
                    <HStack 
                      key={`${rel.nodeId || ''}-${idx}`}
                      p={3}
                      spacing={3}
                      _hover={{ bg: hoverBg }}
                      position="relative"
                    >
                      <Box 
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
                      </Box>
                      <VStack align="start" spacing={0} flex="1">
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {rel.label || rel.name || 'Unknown'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {getRelationshipName(nodeType)}
                        </Text>
                      </VStack>
                      <Tooltip label={`View ${rel.label || rel.name || 'Unknown'}`} placement="top">
                        <IconButton
                          aria-label={`View ${rel.label || rel.name || 'Unknown'}`}
                          icon={<FiArrowRight />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Emit navigation event
                            const navigateEvent = new CustomEvent('navigate-to-node', {
                              detail: {
                                nodeId: rel.nodeId,
                                nodeType: rel.nodeType || 'UNKNOWN',
                                label: rel.label || rel.name || 'Unknown'
                              },
                              bubbles: true
                            });
                            document.dispatchEvent(navigateEvent);
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  );
                })}
              </SimpleGrid>
            </Box>
          ))
        )}
      </Box>
    </VStack>
  );
};

export default RelationshipList;