/**
 * HierarchyNavigatorView.tsx
 * Presentation component for the Organizational Hierarchy Navigator
 */
import React from 'react';
import {
  Box,
  VStack,
  IconButton,
  Tooltip,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch, FiHome, FiChevronUp } from 'react-icons/fi';

// Import components and types
import { UserPositionCard } from './UserPositionCard';
import { HierarchyItem } from './HierarchyItem';
import { OrganizationalUnitEntity } from '../../types/hierarchy';

// Props for the view component
interface HierarchyNavigatorViewProps {
  hierarchyItems: OrganizationalUnitEntity[];
  selectedUnitId: string | null;
  expandedUnitIds: string[];
  isLoading: boolean;
  error: string | null;
  isSearchOpen: boolean;
  onSearchToggle: () => void;
  onUnitClick: (unitId: string) => void;
  onNavigateUp: () => void;
  onNavigateToRoot: () => void;
}

/**
 * Presentation component for the hierarchy navigator
 */
export const HierarchyNavigatorView: React.FC<HierarchyNavigatorViewProps> = ({
  hierarchyItems,
  selectedUnitId,
  expandedUnitIds,
  isLoading,
  error,
  isSearchOpen,
  onSearchToggle,
  onUnitClick,
  onNavigateUp,
  onNavigateToRoot,
}) => {
  // Theme colors
  const bgColor = useColorModeValue('background.alt', 'gray.800');
  const borderColor = useColorModeValue('border.light', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('primary.500', 'primary.300');
  const loadingBgColor = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box 
      width="60px"
      height="100%"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
      borderRadius="0px 4px 4px 0px"
      padding="12px 8px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      aria-label="Organization hierarchy navigator"
      role="navigation"
    >
      {/* Top section with search */}
      <Box width="100%">
        <Tooltip label="Search organization" placement="right">
          <IconButton
            icon={<FiSearch />}
            aria-label="Search organization"
            size="md"
            width="44px"
            height="44px"
            variant="ghost"
            borderRadius="6px"
            mb={4}
            onClick={onSearchToggle}
            _hover={{ bg: hoverBgColor }}
            color={isSearchOpen ? activeColor : undefined}
          />
        </Tooltip>
      </Box>
      
      {/* User position card at top */}
      <UserPositionCard />
      
      {/* Loading indicator */}
      {isLoading && (
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          width="44px" 
          height="44px"
          borderRadius="8px"
          bg={loadingBgColor}
        >
          <Spinner size="sm" color={activeColor} />
        </Flex>
      )}
      
      {/* Error message */}
      {error && (
        <Tooltip label={error} placement="right">
          <Box width="44px" height="44px" display="flex" alignItems="center" justifyContent="center">
            <Alert status="error" variant="subtle" borderRadius="full" padding={1}>
              <AlertIcon />
            </Alert>
          </Box>
        </Tooltip>
      )}
      
      {/* Main navigation items */}
      <VStack spacing={2} width="100%" flex="1" mt={4} mb={4} overflowY="auto">
        {Array.isArray(hierarchyItems) && hierarchyItems.map((unit: OrganizationalUnitEntity) => {
          // Skip rendering if unit is null/undefined or missing required properties
          if (!unit || !unit.id) return null;
          
          return (
            <HierarchyItem
              key={unit.id}
              unit={unit}
              isActive={selectedUnitId === unit.id}
              isExpanded={expandedUnitIds?.includes(unit.id) || false}
              onClick={() => onUnitClick(unit.id)}
            />
          );
        })}
      </VStack>
      
      {/* Bottom navigation actions */}
      <VStack spacing={2} width="100%" mb={2}>
        {/* Navigate to home/root */}
        <Tooltip label="Navigate to organization root" placement="right">
          <IconButton
            icon={<FiHome />}
            aria-label="Navigate to organization root"
            size="md"
            width="44px"
            height="44px"
            variant="ghost"
            borderRadius="6px"
            onClick={onNavigateToRoot}
            _hover={{ bg: hoverBgColor }}
          />
        </Tooltip>
        
        {/* Navigate to top of hierarchy */}
        <Tooltip label="Navigate up" placement="right">
          <IconButton
            icon={<FiChevronUp />}
            aria-label="Navigate up the hierarchy"
            size="md"
            width="44px"
            height="44px"
            variant="ghost"
            borderRadius="6px"
            onClick={onNavigateUp}
            _hover={{ bg: hoverBgColor }}
          />
        </Tooltip>
      </VStack>
    </Box>
  );
};