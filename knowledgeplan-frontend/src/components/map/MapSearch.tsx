import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  List,
  ListItem,
  Text,
  Flex,
  Badge,
  useColorModeValue,
  Kbd,
  Collapse,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { MapNode, MapNodeTypeEnum } from '../../types/map';

interface MapSearchProps {
  nodes: MapNode[];
  onNodeSelect: (nodeId: string) => void;
  placeholder?: string;
}

interface SearchResult {
  node: MapNode;
  matchScore: number;
}

const MapSearch: React.FC<MapSearchProps> = ({
  nodes,
  onNodeSelect,
  placeholder = 'Search map...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<MapNodeTypeEnum[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

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

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    nodes.forEach((node) => {
      // Skip if we're filtering by type and this node doesn't match
      if (selectedTypes.length > 0 && !selectedTypes.includes(node.type)) {
        return;
      }

      const label = node.label.toLowerCase();
      
      // Exact match gets highest score
      if (label === query) {
        results.push({ node, matchScore: 100 });
        return;
      }
      
      // Starts with gets high score
      if (label.startsWith(query)) {
        results.push({ node, matchScore: 80 });
        return;
      }
      
      // Contains gets medium score
      if (label.includes(query)) {
        results.push({ node, matchScore: 60 });
        return;
      }
      
      // Word boundary match gets lower score
      const words = label.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(query)) {
          results.push({ node, matchScore: 40 });
          return;
        }
      }
      
      // Fuzzy match (contains all characters in sequence)
      let lastIndex = -1;
      let allCharsFound = true;
      
      for (const char of query) {
        const index = label.indexOf(char, lastIndex + 1);
        if (index === -1) {
          allCharsFound = false;
          break;
        }
        lastIndex = index;
      }
      
      if (allCharsFound) {
        results.push({ node, matchScore: 20 });
      }
    });

    // Sort by score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit to top 10 results
    setSearchResults(results.slice(0, 10));
  }, [searchQuery, nodes, selectedTypes]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle node type filter
  const toggleNodeType = (type: MapNodeTypeEnum) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <Box
      position="absolute"
      top="16px"
      left="16px"
      zIndex={10}
      width={isExpanded ? '300px' : '200px'}
      transition="width 0.2s"
    >
      <Box
        bg={bg}
        borderRadius="md"
        boxShadow="sm"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        {/* Search Input */}
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            borderRadius="md"
            pr="4.5rem"
          />
          
          <InputRightElement width="4.5rem">
            {searchQuery && (
              <IconButton
                aria-label="Clear search"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={() => setSearchQuery('')}
              />
            )}
            <IconButton
              aria-label={showAdvanced ? "Hide filters" : "Show filters"}
              icon={showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
              size="sm"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
            />
          </InputRightElement>
        </InputGroup>

        {/* Advanced Search Options */}
        <Collapse in={showAdvanced} animateOpacity>
          <Box p={2} borderTop="1px solid" borderColor={borderColor}>
            <Text fontSize="xs" fontWeight="medium" mb={1}>Filter by type:</Text>
            <Flex wrap="wrap" gap={1}>
              {Object.values(MapNodeTypeEnum).map((type) => (
                <Badge
                  key={type}
                  colorScheme={selectedTypes.includes(type) ? getTypeColor(type) : 'gray'}
                  variant={selectedTypes.includes(type) ? 'solid' : 'outline'}
                  cursor="pointer"
                  onClick={() => toggleNodeType(type)}
                  textTransform="capitalize"
                >
                  {type}
                </Badge>
              ))}
            </Flex>
          </Box>
        </Collapse>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <List
            maxH="300px"
            overflowY="auto"
            borderTop="1px solid"
            borderColor={borderColor}
          >
            {searchResults.map(({ node }) => (
              <ListItem
                key={node.id}
                p={2}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  onNodeSelect(node.id);
                  setSearchQuery('');
                }}
              >
                <Flex align="center">
                  <Badge colorScheme={getTypeColor(node.type)} mr={2} textTransform="capitalize">
                    {node.type}
                  </Badge>
                  <Text>{node.label}</Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}

        {/* Keyboard Shortcut Hint */}
        {!isExpanded && (
          <HStack px={2} py={1} fontSize="xs" color="gray.500" justifyContent="flex-end">
            <Text>Press</Text>
            <Kbd fontSize="xs">Ctrl</Kbd>
            <Text>+</Text>
            <Kbd fontSize="xs">F</Kbd>
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default MapSearch;
