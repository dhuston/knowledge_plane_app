/**
 * HierarchyNavigator.tsx
 * Container component for the Organizational Hierarchy Navigator
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Portal, useDisclosure } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// Import context provider, view component, and types
import { HierarchyProvider, useHierarchy } from './HierarchyContext';
import { HierarchyNavigatorView } from './HierarchyNavigatorView';
import { HierarchySearchPopover } from './HierarchySearchPopover';
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../types/hierarchy';

// Props interface for component
interface HierarchyNavigatorProps {
  initialSelectedUnitId?: string | null;
  onUnitSelected?: (unitId: string, unitType: OrganizationalUnitTypeEnum) => void;
}

/**
 * Inner container component that uses the hierarchy context
 */
const HierarchyNavigatorContainer: React.FC<HierarchyNavigatorProps> = ({ onUnitSelected }) => {
  // Router hook
  const navigate = useNavigate();

  // Access hierarchy state and actions from context
  const { 
    units, 
    selectedUnitId, 
    expandedUnitIds, 
    selectUnit,
    navigateToParent,
    navigateToRoot,
    isLoading, 
    error, 
    currentPath
  } = useHierarchy();
  
  // UI state
  const { isOpen: isSearchOpen, onOpen: openSearch, onClose: closeSearch } = useDisclosure();
  
  // Handle node click with navigation
  const handleUnitClick = useCallback((unitId: string) => {
    selectUnit(unitId);
    
    // Get the unit details
    const unit = units[unitId];
    if (unit) {
      // Call the prop callback if provided
      if (onUnitSelected) {
        onUnitSelected(unitId, unit.type);
      }
      
      // Navigate to the appropriate route based on unit type
      switch (unit.type) {
        case OrganizationalUnitTypeEnum.USER:
          navigate(`/users/${unitId}`);
          break;
        case OrganizationalUnitTypeEnum.TEAM:
          navigate(`/teams/${unitId}`);
          break;
        case OrganizationalUnitTypeEnum.DEPARTMENT:
          navigate(`/departments/${unitId}`);
          break;
        case OrganizationalUnitTypeEnum.DIVISION:
          navigate(`/divisions/${unitId}`);
          break;
        case OrganizationalUnitTypeEnum.ORGANIZATION:
          navigate(`/organization/${unitId}`);
          break;
        default:
          navigate(`/entity/${unitId}`);
      }
    }
  }, [selectUnit, units, navigate, onUnitSelected]);

  // Get the ordered hierarchy items to display
  const getHierarchyItems = useCallback(() => {
    // If we have a selected unit, show items along its path
    if (selectedUnitId && currentPath && currentPath.length > 0) {
      return currentPath
        .filter(id => units[id]) // Only include units we have data for
        .map(id => units[id]);
    }
    
    // Fallback - just return the units we know about, sorted by level
    return Object.values(units)
      .sort((a, b) => a.level - b.level);
  }, [selectedUnitId, currentPath, units]);
  
  // Handle navigate up with proper routing
  const handleNavigateUp = useCallback(() => {
    if (selectedUnitId && units[selectedUnitId]?.parentId) {
      const parentId = units[selectedUnitId].parentId;
      if (parentId) {
        handleUnitClick(parentId);
      }
    } else {
      navigateToParent();
    }
  }, [selectedUnitId, units, navigateToParent, handleUnitClick]);
  
  // Handle navigate to root with proper routing
  const handleNavigateToRoot = useCallback(() => {
    if (currentPath && currentPath.length > 0) {
      const rootId = currentPath[0];
      if (rootId) {
        handleUnitClick(rootId);
      }
    } else {
      navigateToRoot();
    }
  }, [currentPath, navigateToRoot, handleUnitClick]);
  
  // Sort items by organizational level
  const hierarchyItems = getHierarchyItems() || [];

  return (
    <>
      <HierarchyNavigatorView
        hierarchyItems={hierarchyItems}
        selectedUnitId={selectedUnitId}
        expandedUnitIds={expandedUnitIds}
        isLoading={isLoading}
        error={error}
        isSearchOpen={isSearchOpen}
        onSearchToggle={isSearchOpen ? closeSearch : openSearch}
        onUnitClick={handleUnitClick}
        onNavigateUp={handleNavigateUp}
        onNavigateToRoot={handleNavigateToRoot}
      />
      
      {/* Search popover */}
      {isSearchOpen && (
        <Portal>
          <HierarchySearchPopover 
            isOpen={isSearchOpen} 
            onClose={closeSearch}
            onUnitSelected={handleUnitClick}
          />
        </Portal>
      )}
    </>
  );
};

/**
 * Main component with context provider
 */
export const HierarchyNavigator: React.FC<HierarchyNavigatorProps> = (props) => {
  return (
    <HierarchyProvider initialSelectedUnitId={props.initialSelectedUnitId}>
      <HierarchyNavigatorContainer onUnitSelected={props.onUnitSelected} />
    </HierarchyProvider>
  );
};