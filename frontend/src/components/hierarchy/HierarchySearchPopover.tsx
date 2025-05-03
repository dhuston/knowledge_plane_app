/**
 * HierarchySearchPopover.tsx
 * Search popover for finding entities in the organizational hierarchy
 */
import React, { useState, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  VStack,
  Flex,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { debounce } from 'lodash';

// Import components
import { SearchInput } from './search/SearchInput';
import { SearchFilters } from './search/SearchFilters';
import { SearchResults } from './search/SearchResults';
import { RecentSearches } from './search/RecentSearches';

// Import context and types
import { useHierarchy } from './state/HierarchyContext';
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../types/hierarchy';
import { HierarchyService } from './services/HierarchyService';
import { useApiClient } from '../../hooks/useApiClient';

// Props interface
interface HierarchySearchPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HierarchySearchPopover: React.FC<HierarchySearchPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<OrganizationalUnitEntity[]>([]);
  const [recentSearches, setRecentSearches] = useState<OrganizationalUnitEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrganizationalUnitTypeEnum | 'all'>('all');
  
  // Get hierarchy context and API client
  const { selectUnit, units } = useHierarchy();
  const apiClient = useApiClient();
  
  // Create hierarchy service
  const hierarchyService = React.useMemo(() => new HierarchyService(apiClient), [apiClient]);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string, filter: OrganizationalUnitTypeEnum | 'all') => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      try {
        const filterType = filter === 'all' ? null : filter;
        const response = await hierarchyService.searchUnits(term, filterType);
        setSearchResults(response.results || []);
      } catch (err) {
        console.error('Error searching hierarchy:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [hierarchyService]
  );
  
  // Handle search input change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    debouncedSearch(term, activeFilter);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: OrganizationalUnitTypeEnum | 'all') => {
    setActiveFilter(filter);
    if (searchTerm) {
      setIsSearching(true);
      debouncedSearch(searchTerm, filter);
    }
  };
  
  // Handle item selection
  const handleSelectItem = (unit: OrganizationalUnitEntity) => {
    selectUnit(unit.id);
    
    // Add to recent searches
    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== unit.id);
      // Add to beginning
      return [unit, ...filtered].slice(0, 5);
    });
    
    onClose();
  };
  
  // Load initial recent searches
  React.useEffect(() => {
    // In a real app, these would come from local storage or user preferences
    const recentUnitIds = Object.keys(units).slice(0, 5);
    const recentItems = recentUnitIds.map(id => units[id]).filter(Boolean);
    setRecentSearches(recentItems);
  }, [units]);
  
  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      closeOnBlur={true}
      closeOnEsc={true}
      gutter={12} // Gap between trigger and popover
    >
      <PopoverContent
        width="280px"
        bg={bgColor}
        borderColor={borderColor}
        borderRadius="6px"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
      >
        <PopoverArrow />
        <PopoverBody p={4}>
          <VStack spacing={4} align="stretch">
            {/* Search input */}
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
            
            {/* Quick filters */}
            <SearchFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
            
            {/* Results section */}
            <Box>
              {isSearching ? (
                <Flex justify="center" py={4}>
                  <Spinner size="sm" />
                </Flex>
              ) : searchTerm ? (
                <SearchResults
                  results={searchResults}
                  onResultClick={handleSelectItem}
                  emptyMessage="No results found"
                />
              ) : (
                <RecentSearches
                  items={recentSearches}
                  onItemClick={handleSelectItem}
                />
              )}
            </Box>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// Wrapper element to avoid rendering issues
const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);