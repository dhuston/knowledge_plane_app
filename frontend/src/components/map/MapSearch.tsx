import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  IconButton,
  List,
  ListItem,
  Text,
  Flex,
  Badge,
  useColorModeValue,
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

  const bg = useColorModeValue('white', '#363636'); // White in light mode
  const borderColor = useColorModeValue('primary.300', 'primary.600');
  const hoverBg = useColorModeValue('gray.50', '#464646');
  const textColor = useColorModeValue('gray.800', 'white');

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
      width={isExpanded ? '340px' : '260px'}
      transition="all 0.3s ease"
    >
      <Box
        bg={bg}
        borderRadius="md"
        boxShadow={isExpanded ? "lg" : "md"}
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        transition="all 0.2s ease-in-out"
        _hover={{
          boxShadow: "lg",
          transform: "translateY(-1px)"
        }}
      >
        {/* Search Input */}
        <Flex alignItems="center" position="relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            borderRadius="md"
            pl="2.5rem"
            pr="4.5rem"
            py={isExpanded ? "8px" : "6px"}
            transition="all 0.2s ease-in-out"
            fontSize="sm"
            fontWeight="medium"
            color={textColor}
            _placeholder={{ color: 'gray.400' }}
            _focus={{
              boxShadow: "0 0 0 1px var(--chakra-colors-primary-300)",
              borderColor: "primary.300"
            }}
          />
          
          <FiSearch 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              color: 'var(--chakra-colors-gray-400)' 
            }} 
          />
          
          <Flex position="absolute" right="8px" gap="1">
            {searchQuery && (
              <IconButton
                aria-label="Clear search"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                borderRadius="md"
                onClick={() => setSearchQuery('')}
                _hover={{ bg: "gray.100" }}
                _dark={{ _hover: { bg: "gray.700" } }}
              />
            )}
            <Box
              as="span" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              cursor="pointer"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
            </Box>
          </Flex>
        </Flex>

        {/* Advanced Search Options */}
        <Collapse in={showAdvanced} animateOpacity>
          <Box 
            p={3} 
            borderTop="1px solid" 
            borderColor={borderColor} 
            borderBottomLeftRadius={searchResults.length > 0 ? 0 : "md"}
            borderBottomRightRadius={searchResults.length > 0 ? 0 : "md"}
            bg={useColorModeValue("white", "gray.800")}
          >
            <Text fontSize="xs" fontWeight="semibold" mb={2}>Filter by type:</Text>
            <Flex wrap="wrap" gap={1.5}>
              {Object.values(MapNodeTypeEnum).map((type) => (
                <Badge
                  key={type}
                  colorScheme={selectedTypes.includes(type) ? getTypeColor(type) : 'gray'}
                  variant={selectedTypes.includes(type) ? 'solid' : 'subtle'}
                  cursor="pointer"
                  onClick={() => toggleNodeType(type)}
                  textTransform="capitalize"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="medium"
                  _hover={{
                    opacity: 0.8,
                    transform: "scale(1.05)",
                  }}
                  transition="all 0.15s ease"
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
            bg={useColorModeValue("white", "gray.800")}
            borderBottomLeftRadius="md" 
            borderBottomRightRadius="md"
            boxShadow="sm"
          >
            {searchResults.map(({ node }) => (
              <ListItem
                key={node.id}
                p={3}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                _first={{ borderTopRadius: 0 }}
                _last={{ borderBottomRadius: "md" }}
                onClick={() => {
                  onNodeSelect(node.id);
                  setSearchQuery('');
                }}
                transition="background 0.2s"
              >
                <Flex align="center">
                  <Badge 
                    colorScheme={getTypeColor(node.type)} 
                    mr={2} 
                    textTransform="capitalize"
                    py={1}
                    px={2}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {node.type}
                  </Badge>
                  <Text fontWeight="medium">{node.label}</Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}

        {/* Empty space - removed keyboard shortcut hint */}
      </Box>
    </Box>
  );
};

export default MapSearch;
