/**
 * HierarchyContext.tsx
 * Context provider for organizational hierarchy navigation
 */
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useApiClient } from '../../hooks/useApiClient';
import { 
  OrganizationalUnitEntity, 
  OrganizationalUnitTypeEnum,
  HierarchyNavigationState
} from '../../types/hierarchy';
import { useAuth } from '../../context/AuthContext';

// Define context interface
interface HierarchyContextType {
  // State
  units: Record<string, OrganizationalUnitEntity>;
  currentPath: string[];
  selectedUnitId: string | null;
  expandedUnitIds: string[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filterType: OrganizationalUnitTypeEnum | null;

  // Actions
  selectUnit: (unitId: string | null) => void;
  expandUnit: (unitId: string) => void;
  collapseUnit: (unitId: string) => void;
  toggleUnit: (unitId: string) => void;
  navigateToParent: () => void;
  navigateToRoot: () => void;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: OrganizationalUnitTypeEnum | null) => void;
  refreshHierarchy: () => Promise<void>;
}

// Create the context with default values
export const HierarchyContext = createContext<HierarchyContextType>({
  // Default state
  units: {},
  currentPath: [],
  selectedUnitId: null,
  expandedUnitIds: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filterType: null,
  
  // Default actions (no-ops)
  selectUnit: () => {},
  expandUnit: () => {},
  collapseUnit: () => {},
  toggleUnit: () => {},
  navigateToParent: () => {},
  navigateToRoot: () => {},
  setSearchTerm: () => {},
  setFilterType: () => {},
  refreshHierarchy: async () => {}
});

interface HierarchyProviderProps {
  children: ReactNode;
  initialSelectedUnitId?: string | null;
}

export const HierarchyProvider: React.FC<HierarchyProviderProps> = ({ 
  children, 
  initialSelectedUnitId = null 
}) => {
  // State
  const [units, setUnits] = useState<Record<string, OrganizationalUnitEntity>>({});
  const [navigationState, setNavigationState] = useState<HierarchyNavigationState>({
    selectedUnitId: initialSelectedUnitId,
    expandedUnitIds: initialSelectedUnitId ? [initialSelectedUnitId] : [],
    path: [],
    searchTerm: '',
    filterType: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const apiClient = useApiClient();
  const { user } = useAuth();
  
  // Initialize hierarchy based on current user
  useEffect(() => {
    if (user && !navigationState.selectedUnitId) {
      // If user is logged in and no unit is selected, start with user's position
      fetchUserHierarchyPosition();
    } else if (navigationState.selectedUnitId) {
      // If a specific unit is selected, fetch its details
      fetchHierarchyUnit(navigationState.selectedUnitId);
    }
  }, [user, navigationState.selectedUnitId]);
  
  // Fetch user's position in the hierarchy
  const fetchUserHierarchyPosition = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user's position in the hierarchy
      const response = await apiClient.get(`/hierarchy/path`);
      
      if (response.data && response.data.path) {
        // Update state with user's path and units
        const userPath = response.data.path;
        const pathUnits = response.data.units || {};
        
        setUnits(prevUnits => ({
          ...prevUnits,
          ...pathUnits
        }));
        
        // Select the user's team by default
        const teamId = userPath.find(id => units[id]?.type === OrganizationalUnitTypeEnum.TEAM) || 
                       userPath[userPath.length - 1];
        
        setNavigationState(prev => ({
          ...prev,
          selectedUnitId: teamId,
          expandedUnitIds: [teamId],
          path: userPath
        }));
      }
    } catch (err) {
      console.error('Error fetching hierarchy position:', err);
      setError('Failed to load your position in the organization. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch specific unit and its children
  const fetchHierarchyUnit = async (unitId: string) => {
    if (!unitId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch unit details
      const response = await apiClient.get(`/hierarchy/unit/${unitId}`);
      
      if (response.data) {
        // Update units with fetched data
        const fetchedUnit = response.data.unit;
        const childUnits = response.data.children || [];
        
        // Create a units map to merge with existing state
        const unitsMap: Record<string, OrganizationalUnitEntity> = {
          [fetchedUnit.id]: fetchedUnit
        };
        
        // Add child units to the map
        childUnits.forEach((unit: OrganizationalUnitEntity) => {
          unitsMap[unit.id] = unit;
        });
        
        // Update state
        setUnits(prevUnits => ({
          ...prevUnits,
          ...unitsMap
        }));
        
        // Update path if this is the selected unit
        if (navigationState.selectedUnitId === unitId) {
          setNavigationState(prev => ({
            ...prev,
            path: fetchedUnit.path || prev.path
          }));
        }
      }
    } catch (err) {
      console.error(`Error fetching hierarchy unit ${unitId}:`, err);
      setError(`Failed to load organizational unit. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh the entire hierarchy
  const refreshHierarchy = async () => {
    // Reset state
    setIsLoading(true);
    setError(null);
    
    try {
      // Start by fetching user's position
      await fetchUserHierarchyPosition();
      
      // Then fetch any expanded units
      const promises = navigationState.expandedUnitIds.map(id => fetchHierarchyUnit(id));
      await Promise.all(promises);
    } catch (err) {
      console.error('Error refreshing hierarchy:', err);
      setError('Failed to refresh organizational hierarchy. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Select a unit and add to expanded list if not already there
  const selectUnit = useCallback((unitId: string | null) => {
    setNavigationState(prev => ({
      ...prev,
      selectedUnitId: unitId,
      expandedUnitIds: unitId 
        ? [...new Set([...prev.expandedUnitIds, unitId])] 
        : prev.expandedUnitIds
    }));
    
    // Fetch unit data if needed
    if (unitId && !units[unitId]) {
      fetchHierarchyUnit(unitId);
    }
  }, [units]);
  
  // Expand a unit and fetch its children if needed
  const expandUnit = useCallback((unitId: string) => {
    setNavigationState(prev => ({
      ...prev,
      expandedUnitIds: [...new Set([...prev.expandedUnitIds, unitId])]
    }));
    
    // Fetch unit data if needed
    if (!units[unitId]) {
      fetchHierarchyUnit(unitId);
    }
  }, [units]);
  
  // Collapse a unit
  const collapseUnit = useCallback((unitId: string) => {
    setNavigationState(prev => ({
      ...prev,
      expandedUnitIds: prev.expandedUnitIds.filter(id => id !== unitId)
    }));
  }, []);
  
  // Toggle a unit's expanded state
  const toggleUnit = useCallback((unitId: string) => {
    setNavigationState(prev => {
      const isExpanded = prev.expandedUnitIds.includes(unitId);
      
      return {
        ...prev,
        expandedUnitIds: isExpanded
          ? prev.expandedUnitIds.filter(id => id !== unitId)
          : [...prev.expandedUnitIds, unitId]
      };
    });
    
    // Fetch unit data if needed and expanding
    if (!units[unitId] && !navigationState.expandedUnitIds.includes(unitId)) {
      fetchHierarchyUnit(unitId);
    }
  }, [units, navigationState.expandedUnitIds]);
  
  // Navigate to parent unit
  const navigateToParent = useCallback(() => {
    if (!navigationState.selectedUnitId || !units[navigationState.selectedUnitId]) return;
    
    const currentUnit = units[navigationState.selectedUnitId];
    if (currentUnit.parentId) {
      selectUnit(currentUnit.parentId);
    }
  }, [navigationState.selectedUnitId, units, selectUnit]);
  
  // Navigate to root (organization)
  const navigateToRoot = useCallback(() => {
    // Find organization unit - it should be the first in the path
    if (navigationState.path.length > 0) {
      const orgId = navigationState.path[0];
      if (orgId) {
        selectUnit(orgId);
      }
    }
  }, [navigationState.path, selectUnit]);
  
  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setNavigationState(prev => ({
      ...prev,
      searchTerm: term
    }));
  }, []);
  
  // Set filter type
  const setFilterType = useCallback((type: OrganizationalUnitTypeEnum | null) => {
    setNavigationState(prev => ({
      ...prev,
      filterType: type
    }));
  }, []);
  
  // Provide context value
  const contextValue: HierarchyContextType = {
    // State
    units,
    currentPath: navigationState.path,
    selectedUnitId: navigationState.selectedUnitId,
    expandedUnitIds: navigationState.expandedUnitIds,
    isLoading,
    error,
    searchTerm: navigationState.searchTerm,
    filterType: navigationState.filterType,
    
    // Actions
    selectUnit,
    expandUnit,
    collapseUnit,
    toggleUnit,
    navigateToParent,
    navigateToRoot,
    setSearchTerm,
    setFilterType,
    refreshHierarchy
  };
  
  return (
    <HierarchyContext.Provider value={contextValue}>
      {children}
    </HierarchyContext.Provider>
  );
};

// Custom hook for using the hierarchy context
export const useHierarchy = () => useContext(HierarchyContext);