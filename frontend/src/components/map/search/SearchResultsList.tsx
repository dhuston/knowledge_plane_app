/**
 * SearchResultsList.tsx
 * Displays search results for the LivingMap
 */
import React, { memo } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  Text, 
  Badge
} from '@chakra-ui/react';
import { MapNodeTypeEnum, MapNode } from '../../../types/map';

// Define SearchResult interface (previously imported from MapSearchBar)
interface SearchResult {
  id: string;
  label: string;
  type?: MapNodeTypeEnum;
}

interface SearchResultsListProps {
  results: SearchResult[];
  onResultClick: (nodeId: string) => void;
  visible: boolean;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  onResultClick,
  visible
}) => {
  if (!visible || results.length === 0) return null;
  
  // Memoize the color mapping function to avoid recalculation
  const getColorScheme = (type: MapNodeTypeEnum | undefined) => {
    if (!type) return 'gray';
    
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'green';
      case MapNodeTypeEnum.TEAM:
        return 'blue';
      case MapNodeTypeEnum.PROJECT:
        return 'purple';
      case MapNodeTypeEnum.GOAL:
        return 'orange';
      default:
        return 'gray';
    }
  };
  
  return (
    <Box
      position="absolute"
      top="50px"
      left="15px"
      zIndex={5}
      bg="surface.500"
      borderWidth="1px"
      borderColor="primary.300"
      borderRadius="md"
      shadow="sm"
      maxHeight="220px"
      overflowY="auto"
      width="220px"
      role="listbox"
      id="search-results-list"
      aria-label="Search results"
      _dark={{
        bg: '#363636',
        borderColor: 'primary.600',
      }}
    >
      <List spacing={0}>
        {results.map((node, index) => (
          <ListItem
            key={node.id}
            px={3}
            py={2}
            _hover={{ bg: 'secondary.400' }}
            cursor="pointer"
            color="#262626"
            role="option"
            aria-selected={false}
            tabIndex={0}
            onKeyDown={(e) => {
              // Add keyboard navigation
              if (e.key === 'Enter' || e.key === ' ') {
                onResultClick(node.id);
                e.preventDefault();
              } else if (e.key === 'ArrowDown' && index < results.length - 1) {
                // Focus on next item
                (e.target.nextSibling as HTMLElement)?.focus();
                e.preventDefault();
              } else if (e.key === 'ArrowUp' && index > 0) {
                // Focus on previous item
                (e.target.previousSibling as HTMLElement)?.focus();
                e.preventDefault();
              } else if (e.key === 'Escape') {
                // Close dropdown (by clearing results)
                document.getElementById('search-input')?.focus();
                e.preventDefault();
              }
            }}
            _dark={{
              _hover: { bg: '#464646' },
              color: 'secondary.400',
            }}
            onClick={() => onResultClick(node.id)}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text>{node.label}</Text>
            {node.type && (
              <Badge 
                size="sm" 
                colorScheme={getColorScheme(node.type)}
                aria-label={`Node type: ${node.type}`}
              >
                {node.type}
              </Badge>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

// Use React.memo for performance optimization
export default memo(SearchResultsList);