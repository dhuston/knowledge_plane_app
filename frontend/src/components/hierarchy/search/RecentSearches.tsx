/**
 * RecentSearches.tsx
 * Component for displaying recent searches
 */
import React from 'react';
import {
  List,
  ListItem,
  HStack,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUser, FiUsers, FiBriefcase, FiGrid, FiCompass, FiClock } from 'react-icons/fi';

import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Props interface
interface RecentSearchesProps {
  items: OrganizationalUnitEntity[];
  onItemClick: (unit: OrganizationalUnitEntity) => void;
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
 * Component for rendering recent searches
 */
export const RecentSearches: React.FC<RecentSearchesProps> = ({
  items,
  onItemClick,
}) => {
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // If there are no recent searches
  if (items.length === 0) {
    return (
      <Text fontSize="sm" color={mutedTextColor} textAlign="center" py={2}>
        Search for teams, departments, or people
      </Text>
    );
  }
  
  // Render recent searches
  return (
    <List spacing={1}>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="medium" color={mutedTextColor}>
          Recent Searches
        </Text>
        <Icon as={FiClock} boxSize="12px" color={mutedTextColor} />
      </HStack>
      {items.map(recent => {
        const UnitIcon = getUnitIcon(recent.type);
        return (
          <ListItem 
            key={recent.id}
            onClick={() => onItemClick(recent)}
            cursor="pointer"
            p={2}
            borderRadius="md"
            _hover={{ bg: hoverBgColor }}
          >
            <HStack spacing={2}>
              <Icon as={UnitIcon} color={mutedTextColor} />
              <Text fontSize="sm">{recent.name}</Text>
            </HStack>
          </ListItem>
        );
      })}
    </List>
  );
};