/**
 * SearchFilters.tsx
 * Filters for hierarchical search
 */
import React from 'react';
import { ButtonGroup, Button, useColorModeValue } from '@chakra-ui/react';
import { OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Props interface
interface SearchFiltersProps {
  activeFilter: OrganizationalUnitTypeEnum | 'all';
  onFilterChange: (filter: OrganizationalUnitTypeEnum | 'all') => void;
}

/**
 * Component for rendering search filters
 */
export const SearchFilters: React.FC<SearchFiltersProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const activeFilterBg = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <ButtonGroup size="xs" isAttached variant="outline" width="100%">
      <Button 
        flex={1} 
        isActive={activeFilter === 'all'} 
        onClick={() => onFilterChange('all')}
        bg={activeFilter === 'all' ? activeFilterBg : undefined}
      >
        All
      </Button>
      <Button 
        flex={1} 
        isActive={activeFilter === OrganizationalUnitTypeEnum.TEAM} 
        onClick={() => onFilterChange(OrganizationalUnitTypeEnum.TEAM)}
        bg={activeFilter === OrganizationalUnitTypeEnum.TEAM ? activeFilterBg : undefined}
      >
        Teams
      </Button>
      <Button 
        flex={1}
        isActive={activeFilter === OrganizationalUnitTypeEnum.DEPARTMENT} 
        onClick={() => onFilterChange(OrganizationalUnitTypeEnum.DEPARTMENT)}
        bg={activeFilter === OrganizationalUnitTypeEnum.DEPARTMENT ? activeFilterBg : undefined}
      >
        Depts
      </Button>
    </ButtonGroup>
  );
};