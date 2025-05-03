/**
 * HierarchyContext.tsx
 * Context provider for organizational hierarchy navigation
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useApiClient } from '../../../hooks/useApiClient';
import { useAuth } from '../../../context/AuthContext';
import { OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Import reducer and service
import { 
  hierarchyReducer, 
  initialHierarchyState, 
  HierarchyState,
  HierarchyActionType 
} from './HierarchyReducer';
import { HierarchyService } from '../services/HierarchyService';

// Define context interface
interface HierarchyContextType extends HierarchyState {
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
  ...initialHierarchyState,
  
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
  // Initialize state using reducer
  const [state, dispatch] = useReducer(hierarchyReducer, {
    ...initialHierarchyState,
    selectedUnitId: initialSelectedUnitId
  });
  
  // Hooks
  const apiClient = useApiClient();
  const { user } = useAuth();
  
  // Create hierarchy service
  const hierarchyService = React.useMemo(() => new HierarchyService(apiClient), [apiClient]);
  
  // Initialize hierarchy based on current user
  useEffect(() => {
    const initializeHierarchy = async () => {
      // Don't try to fetch if we've already had an error
      if (state.error) {
        return;
      }
      
      if (user && !state.selectedUnitId) {
        // If user is logged in and no unit is selected, start with user's position
        await fetchUserHierarchyPosition();
      } else if (state.selectedUnitId) {
        // If a specific unit is selected, fetch its details
        await fetchHierarchyUnit(state.selectedUnitId);
      }
    };
    
    initializeHierarchy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.selectedUnitId, state.error]);
  
  // Fetch user's position in the hierarchy
  const fetchUserHierarchyPosition = async () => {
    dispatch({ type: HierarchyActionType.SET_LOADING, payload: true });
    dispatch({ type: HierarchyActionType.SET_ERROR, payload: null });
    
    try {
      // Check if we have authentication
      if (!user) {
        dispatch({ 
          type: HierarchyActionType.SET_ERROR, 
          payload: 'You need to be logged in to view the organization hierarchy.' 
        });
        return;
      }
      
      // Make API request through the service which includes mock fallback
      const response = await hierarchyService.fetchUserPath();
      
      if (response && response.path) {
        // Add units to state
        dispatch({ 
          type: HierarchyActionType.ADD_UNITS, 
          payload: response.units || {} 
        });
        
        // Set the path
        dispatch({
          type: HierarchyActionType.SET_PATH,
          payload: response.path
        });
        
        // Select the user's team by default
        const userPath = response.path;
        const pathUnits = response.units || {};
        
        const teamId = userPath.find(id => pathUnits[id]?.type === OrganizationalUnitTypeEnum.TEAM) || 
                       userPath[userPath.length - 1];
        
        // Select the team
        if (teamId) {
          dispatch({ 
            type: HierarchyActionType.SELECT_UNIT, 
            payload: teamId 
          });
        }
      } else {
        console.warn('Empty or invalid hierarchy response received');
        dispatch({ 
          type: HierarchyActionType.SET_ERROR, 
          payload: 'Failed to load organization data. The backend service may not be available.' 
        });
      }
    } catch (err) {
      console.error('Error fetching hierarchy position:', err);
      
      // Show the most user-friendly error message possible
      const errorMessage = err instanceof Error 
        ? err.message
        : 'Failed to load your position in the organization. Please try again later.';
      
      dispatch({ 
        type: HierarchyActionType.SET_ERROR, 
        payload: errorMessage
      });
    } finally {
      dispatch({ type: HierarchyActionType.SET_LOADING, payload: false });
    }
  };
  
  // Fetch specific unit and its children
  const fetchHierarchyUnit = async (unitId: string) => {
    if (!unitId) return;
    
    dispatch({ type: HierarchyActionType.SET_LOADING, payload: true });
    dispatch({ type: HierarchyActionType.SET_ERROR, payload: null });
    
    try {
      // Check if we have authentication
      if (!user) {
        dispatch({ 
          type: HierarchyActionType.SET_ERROR, 
          payload: 'You need to be logged in to view the organization hierarchy.' 
        });
        return;
      }
      
      const response = await hierarchyService.fetchUnit(unitId);
      
      if (response && response.unit) {
        // Add unit to state
        const unitsToAdd = {
          [response.unit.id]: response.unit
        };
        
        // Add child units
        if (response.children && response.children.length > 0) {
          response.children.forEach(childUnit => {
            unitsToAdd[childUnit.id] = childUnit;
          });
        }
        
        // Update state
        dispatch({ 
          type: HierarchyActionType.ADD_UNITS, 
          payload: unitsToAdd 
        });
        
        // Update path if this is the selected unit
        if (state.selectedUnitId === unitId && response.unit.path) {
          dispatch({
            type: HierarchyActionType.SET_PATH,
            payload: response.unit.path
          });
        }
      } else {
        console.warn(`Empty or invalid unit response for ${unitId}`);
        dispatch({ 
          type: HierarchyActionType.SET_ERROR, 
          payload: 'Failed to load organizational unit data. The backend service may not be available.' 
        });
      }
    } catch (err) {
      console.error(`Error fetching hierarchy unit ${unitId}:`, err);
      
      // Show the most user-friendly error message possible
      const errorMessage = err instanceof Error 
        ? err.message
        : 'Failed to load organizational unit. Please try again later.';
      
      dispatch({ 
        type: HierarchyActionType.SET_ERROR, 
        payload: errorMessage
      });
    } finally {
      dispatch({ type: HierarchyActionType.SET_LOADING, payload: false });
    }
  };
  
  // Action handlers
  const selectUnit = useCallback((unitId: string | null) => {
    dispatch({ type: HierarchyActionType.SELECT_UNIT, payload: unitId });
    
    // Fetch unit data if needed
    if (unitId && !state.units[unitId]) {
      fetchHierarchyUnit(unitId);
    }
  }, [state.units]);
  
  const expandUnit = useCallback((unitId: string) => {
    dispatch({ type: HierarchyActionType.EXPAND_UNIT, payload: unitId });
    
    // Fetch unit data if needed
    if (!state.units[unitId]) {
      fetchHierarchyUnit(unitId);
    }
  }, [state.units]);
  
  const collapseUnit = useCallback((unitId: string) => {
    dispatch({ type: HierarchyActionType.COLLAPSE_UNIT, payload: unitId });
  }, []);
  
  const toggleUnit = useCallback((unitId: string) => {
    dispatch({ type: HierarchyActionType.TOGGLE_UNIT, payload: unitId });
    
    // Fetch unit data if needed and expanding
    if (!state.units[unitId] && !state.expandedUnitIds.includes(unitId)) {
      fetchHierarchyUnit(unitId);
    }
  }, [state.units, state.expandedUnitIds]);
  
  // Navigate to parent unit
  const navigateToParent = useCallback(() => {
    if (!state.selectedUnitId || !state.units[state.selectedUnitId]) return;
    
    const currentUnit = state.units[state.selectedUnitId];
    if (currentUnit.parentId) {
      selectUnit(currentUnit.parentId);
    }
  }, [state.selectedUnitId, state.units, selectUnit]);
  
  // Navigate to root (organization)
  const navigateToRoot = useCallback(() => {
    // Find organization unit - it should be the first in the path
    if (state.path.length > 0) {
      const orgId = state.path[0];
      if (orgId) {
        selectUnit(orgId);
      }
    }
  }, [state.path, selectUnit]);
  
  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: HierarchyActionType.SET_SEARCH_TERM, payload: term });
  }, []);
  
  // Set filter type
  const setFilterType = useCallback((type: OrganizationalUnitTypeEnum | null) => {
    dispatch({ type: HierarchyActionType.SET_FILTER_TYPE, payload: type });
  }, []);
  
  // Refresh the entire hierarchy
  const refreshHierarchy = useCallback(async () => {
    // Reset error state
    dispatch({ type: HierarchyActionType.SET_ERROR, payload: null });
    dispatch({ type: HierarchyActionType.SET_LOADING, payload: true });
    
    try {
      // Start by fetching user's position
      await fetchUserHierarchyPosition();
      
      // Then fetch any expanded units
      const promises = state.expandedUnitIds.map(id => fetchHierarchyUnit(id));
      await Promise.all(promises);
    } catch (err) {
      console.error('Error refreshing hierarchy:', err);
      dispatch({ 
        type: HierarchyActionType.SET_ERROR, 
        payload: 'Failed to refresh organizational hierarchy. Please try again later.' 
      });
    } finally {
      dispatch({ type: HierarchyActionType.SET_LOADING, payload: false });
    }
  }, [state.expandedUnitIds]);
  
  // Build context value with safety checks
  const contextValue: HierarchyContextType = {
    // Use safe default values in case state properties are undefined
    units: state.units || {},
    selectedUnitId: state.selectedUnitId || null,
    expandedUnitIds: state.expandedUnitIds || [],
    path: state.path || [],
    searchTerm: state.searchTerm || '',
    filterType: state.filterType || null,
    isLoading: state.isLoading || false,
    error: state.error || null,
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