/**
 * HierarchyNavigator.tsx
 * Container component for the Organizational Hierarchy Navigator
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Portal, useDisclosure } from '@chakra-ui/react';

// Import context provider, view component, and types
import { HierarchyProvider, useHierarchy } from './state/HierarchyContext';
import { HierarchyNavigatorView } from './HierarchyNavigatorView';
import { HierarchySearchPopover } from './HierarchySearchPopover';
import { OrganizationalUnitEntity } from '../../types/hierarchy';

// Props interface for component
interface HierarchyNavigatorProps {
  initialSelectedUnitId?: string | null;
  onUnitSelected?: (unitId: string) => void;
}

/**
 * Inner container component that uses the hierarchy context
 */
const HierarchyNavigatorContainer: React.FC<HierarchyNavigatorProps> = ({ onUnitSelected }) => {
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
    path
  } = useHierarchy();
  
  // UI state
  const { isOpen: isSearchOpen, onOpen: openSearch, onClose: closeSearch } = useDisclosure();
  
  // Handle node click with callback
  const handleUnitClick = useCallback((unitId: string) => {
    selectUnit(unitId);
    if (onUnitSelected) {
      onUnitSelected(unitId);
    }
  }, [selectUnit, onUnitSelected]);

  // Get the ordered hierarchy items to display
  const getHierarchyItems = useCallback(() => {
    // If we have a selected unit, show items along its path
    if (selectedUnitId && path && path.length > 0) {
      return path
        .filter(id => units[id]) // Only include units we have data for
        .map(id => units[id]);
    }
    
    // Fallback - just return the units we know about, sorted by level
    return Object.values(units)
      .sort((a, b) => a.level - b.level);
  }, [selectedUnitId, path, units]);
  
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
        onNavigateUp={navigateToParent}
        onNavigateToRoot={navigateToRoot}
      />
      
      {/* Search popover */}
      {isSearchOpen && (
        <Portal>
          <HierarchySearchPopover 
            isOpen={isSearchOpen} 
            onClose={closeSearch}
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