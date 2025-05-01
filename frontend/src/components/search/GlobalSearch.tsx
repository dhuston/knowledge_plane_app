import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  Kbd,
  Portal,
  VStack,
  Text,
  HStack,
  Spinner,
  useColorModeValue,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useApiClient } from '../../hooks/useApiClient';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'user' | 'team' | 'project' | 'goal' | 'knowledge';
  title: string;
  description?: string;
  url: string;
  iconType?: string;
  metadata?: Record<string, unknown>;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await apiClient.get('/search', {
          params: { q: searchQuery }
        });
        setResults(response.data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [apiClient]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      onOpen();
      debouncedSearch(value);
    } else {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onClose();
    setQuery('');
    navigate(result.url);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    onClose();
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'team':
        return '👥';
      case 'project':
        return '📋';
      case 'goal':
        return '🎯';
      case 'knowledge':
        return '📚';
      default:
        return '📄';
    }
  };

  return (
    <Box position="relative" width="full" maxW="600px">
      <InputGroup size="lg">
        <InputLeftElement pointerEvents="none">
          {isSearching ? (
            <Spinner size="sm" color="gray.400" />
          ) : (
            <Icon as={FiSearch} color="gray.400" />
          )}
        </InputLeftElement>
        <Input
          ref={inputRef}
          placeholder="Search everything..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && onOpen()}
          bg={bgColor}
          borderColor={borderColor}
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'primary.500', boxShadow: 'outline' }}
          pr="4.5rem"
        />
        <InputRightElement width="4.5rem">
          {query && (
            <HStack spacing={1}>
              <Kbd>Esc</Kbd>
              <IconButton
                icon={<FiX />}
                size="sm"
                variant="ghost"
                aria-label="Clear search"
                onClick={clearSearch}
              />
            </HStack>
          )}
        </InputRightElement>
      </InputGroup>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Portal>
          <Box
            ref={resultsRef}
            position="fixed"
            top="120px" // Positioned below the search bar
            left="50%"
            transform="translateX(-50%)"
            width="600px"
            maxHeight="calc(100vh - 200px)"
            overflowY="auto"
            bg={bgColor}
            boxShadow="xl"
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            zIndex={1400}
          >
            <VStack spacing={0} align="stretch">
              {results.map((result, index) => (
                <Box
                  key={result.id}
                  p={4}
                  cursor="pointer"
                  bg={selectedIndex === index ? hoverBgColor : 'transparent'}
                  _hover={{ bg: hoverBgColor }}
                  onClick={() => handleResultClick(result)}
                >
                  <HStack spacing={3}>
                    <Text fontSize="xl">{getTypeIcon(result.type)}</Text>
                    <Box flex={1}>
                      <Text fontWeight="medium">{result.title}</Text>
                      {result.description && (
                        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                          {result.description}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                </Box>
              ))}
              {results.length === 0 && !isSearching && query && (
                <Box p={4} textAlign="center" color="gray.500">
                  <Text>No results found</Text>
                </Box>
              )}
            </VStack>
          </Box>
        </Portal>
      )}
    </Box>
  );
} 