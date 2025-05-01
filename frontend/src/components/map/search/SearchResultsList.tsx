/**
 * SearchResultsList.tsx
 * Displays search results for the LivingMap
 */
import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  Text, 
  Badge
} from '@chakra-ui/react';
import { MapNodeTypeEnum } from '../../../types/map';
import { SearchResult } from './MapSearchBar';

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
      _dark={{
        bg: '#363636',
        borderColor: 'primary.600',
      }}
    >
      <List spacing={0}>
        {results.map((node) => (
          <ListItem
            key={node.id}
            px={3}
            py={2}
            _hover={{ bg: 'secondary.400' }}
            cursor="pointer"
            color="#262626"
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
                colorScheme={
                  node.type === MapNodeTypeEnum.USER ? 'green' :
                  node.type === MapNodeTypeEnum.TEAM ? 'blue' : 
                  node.type === MapNodeTypeEnum.PROJECT ? 'purple' : 
                  node.type === MapNodeTypeEnum.GOAL ? 'orange' : 'gray'
                }
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

export default SearchResultsList;