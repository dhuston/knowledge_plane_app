/**
 * HierarchyNavigatorView.tsx
 * Presentation component for the Organizational Hierarchy Navigator
 */
import React from 'react';
import {
  Box,
  VStack,
  IconButton,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch, FiChevronUp, FiChevronDown, FiTarget, FiCompass } from 'react-icons/fi';

import { InlineTooltip } from '../common/InlineTooltip';

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
      width="68px"
      height="100%"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
      borderRadius="0px 4px 4px 0px"
      padding="12px 10px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      aria-label="Organization hierarchy navigator"
      role="navigation"
    >
      {/* Top section with search - simplified */}
      <Box width="100%" mt={1}>
        <InlineTooltip 
          label="Search organization hierarchy" 
          placement="right"
          delay={100} // Reduced delay for faster appearance
        >
          <IconButton
            icon={<FiSearch size="1.2rem" />}
            aria-label="Search organization"
            size="md"
            width="48px"
            height="48px"
            variant="ghost"
            borderRadius="6px" 
            onClick={onSearchToggle}
            _hover={{ bg: hoverBgColor }}
            color={isSearchOpen ? activeColor : undefined}
          />
        </InlineTooltip>
      </Box>
      
      {/* Visual divider */}
      <Box 
        width="40px" 
        height="1px" 
        bg="gray.300" 
        my={2} 
        _dark={{ bg: "gray.600" }} 
      />
      
      {/* User position card simplified */}
      <UserPositionCard />
      
      {/* Loading indicator */}
      {isLoading && (
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          width="48px" 
          height="48px"
          borderRadius="8px"
          bg={loadingBgColor}
        >
          <Spinner size="sm" color={activeColor} />
        </Flex>
      )}
      
      {/* Error message */}
      {error && (
        <InlineTooltip label={error} placement="right" delay={100}>
          <Box width="48px" height="48px" display="flex" alignItems="center" justifyContent="center">
            <Alert status="error" variant="subtle" borderRadius="full" padding={1}>
              <AlertIcon />
            </Alert>
          </Box>
        </InlineTooltip>
      )}
      
      {/* Visual divider before hierarchy items */}
      <Box 
        width="40px" 
        height="1px" 
        bg="gray.300" 
        my={2} 
        _dark={{ bg: "gray.600" }} 
      />
      
      {/* Main navigation items */}
      <VStack spacing={2} width="100%" flex="1" mb={4} overflowY="auto">
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
      
      {/* Visual divider before navigation actions */}
      <Box 
        width="40px" 
        height="1px" 
        bg="gray.300" 
        mt={1}
        mb={2}
        _dark={{ bg: "gray.600" }} 
      />
      
      {/* Simplified navigation controls */}
      <VStack spacing={2} width="100%" mb={2}>
        {/* Navigate up in hierarchy */}
        <InlineTooltip label="Navigate up in hierarchy" placement="right" delay={100}>
          <IconButton
            icon={<FiChevronUp size="1.2rem" />}
            aria-label="Navigate up the hierarchy"
            size="md"
            width="48px"
            height="48px"
            variant="ghost"
            borderRadius="6px"
            onClick={onNavigateUp}
            _hover={{ bg: hoverBgColor }}
          />
        </InlineTooltip>
        
        {/* Navigate to organization root */}
        <InlineTooltip label="Go to organization root" placement="right" delay={100}>
          <IconButton
            icon={<FiCompass size="1.2rem" />}
            aria-label="Navigate to organization root"
            size="md"
            width="48px"
            height="48px"
            variant="ghost"
            borderRadius="6px"
            onClick={onNavigateToRoot}
            _hover={{ bg: hoverBgColor }}
          />
        </InlineTooltip>
      </VStack>
    </Box>
  );
};