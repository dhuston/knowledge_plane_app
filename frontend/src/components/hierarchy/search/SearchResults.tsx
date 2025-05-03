/**
 * SearchResults.tsx
 * Component for displaying search results in the hierarchy
 */
import React from 'react';
import {
  List,
  ListItem,
  HStack,
  Text,
  Icon,
  Badge,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUser, FiUsers, FiBriefcase, FiGrid, FiCompass } from 'react-icons/fi';

import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Props interface
interface SearchResultsProps {
  results: OrganizationalUnitEntity[];
  onResultClick: (unit: OrganizationalUnitEntity) => void;
  emptyMessage?: string;
}

/**
 * Get icon for unit type
 */
const getUnitIcon = (type: OrganizationalUnitTypeEnum) => {
  switch (type) {
    case OrganizationalUnitTypeEnum.ORGANIZATION:
      return FiCompass;
    case OrganizationalUnitTypeEnum.DIVISION:
      return FiGrid;
    case OrganizationalUnitTypeEnum.DEPARTMENT:
      return FiBriefcase;
    case OrganizationalUnitTypeEnum.TEAM:
      return FiUsers;
    case OrganizationalUnitTypeEnum.USER:
      return FiUser;
    default:
      return FiBriefcase;
  }
};

/**
 * Component for rendering search results
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  emptyMessage = 'No results found',
}) => {
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // If there are no results
  if (results.length === 0) {
    return (
      <Text fontSize="sm" color={mutedTextColor} textAlign="center" py={2}>
        {emptyMessage}
      </Text>
    );
  }
  
  // Render search results
  return (
    <List spacing={1}>
      <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} mb={2}>
        Search Results
      </Text>
      {results.map(result => {
        const UnitIcon = getUnitIcon(result.type);
        return (
          <ListItem 
            key={result.id}
            onClick={() => onResultClick(result)}
            cursor="pointer"
            p={2}
            borderRadius="md"
            _hover={{ bg: hoverBgColor }}
          >
            <HStack spacing={2}>
              <Icon as={UnitIcon} color={mutedTextColor} />
              <Text fontSize="sm">{result.name}</Text>
              <Box flex={1} />
              <Badge size="sm" colorScheme="gray" fontSize="10px">
                {result.type}
              </Badge>
            </HStack>
          </ListItem>
        );
      })}
    </List>
  );
};