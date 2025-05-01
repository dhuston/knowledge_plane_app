/**
 * MapSearchBar.tsx
 * Search component for the LivingMap
 */
import React, { useState, useEffect, memo } from 'react';
import { 
  HStack,
  Input,
  IconButton
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';

// Define type for search results
export interface SearchResult {
  id: string;
  label: string;
  type?: MapNodeTypeEnum;
}

interface MapSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
}

// Add an ID for the search input to connect to the search results list
const MapSearchBar: React.FC<MapSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch
}) => {
  return (
    <HStack
      position="absolute"
      top="15px"
      left="15px"
      zIndex={4}
      bg="surface.500"
      p={1}
      borderRadius="md"
      shadow="sm"
      borderWidth="1px"
      borderColor="primary.300"
      _dark={{
        bg: '#363636',
        borderColor: 'primary.600',
      }}
    >
      <Input
        size="sm"
        placeholder="Search node..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
        width="160px"
        variant="outline"
        bg="surface.500"
        color="#262626"
        _dark={{
          bg: '#363636',
          color: 'secondary.400',
        }}
        aria-label="Search for nodes"
        aria-autocomplete="list"
        aria-controls="search-results-list"
        role="searchbox"
        id="search-input"
      />
      <IconButton
        aria-label="Search"
        icon={<FiSearch />}
        size="sm"
        variant="ghost"
        color="#262626"
        _dark={{
          color: 'secondary.400',
        }}
        onClick={onSearch}
      />
    </HStack>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(MapSearchBar);