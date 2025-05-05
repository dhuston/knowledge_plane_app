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
const HierarchyContext = createContext<HierarchyContextType>({
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

const HierarchyProvider: React.FC<HierarchyProviderProps> = ({ 
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
    // Add diagnostic logs
    console.log("[HierarchyContext] Initialize effect triggered", { 
      hasUser: !!user, 
      userId: user?.id,
      selectedUnitId: navigationState.selectedUnitId,
      hasToken: !!localStorage.getItem('knowledge_plane_token')
    });
    
    if (user && !navigationState.selectedUnitId) {
      // If user is logged in and no unit is selected, start with user's position
      console.log("[HierarchyContext] Fetching user hierarchy position", { 
        userId: user.id 
      });
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
    
    // Log authentication state before making the request
    const token = localStorage.getItem('knowledge_plane_token');
    console.log("[fetchUserHierarchyPosition] Starting fetch", {
      hasToken: !!token,
      tokenLength: token?.length,
      apiClientBaseURL: apiClient.defaults.baseURL
    });
    
    try {
      // Check current headers - add diagnostic
      console.log("[fetchUserHierarchyPosition] API client headers:", {
        contentType: apiClient.defaults.headers?.['Content-Type'],
        authorization: token ? 'Bearer Token available' : 'No Bearer Token'
      });
      
      // Try multiple possible endpoints with fallbacks
      let response;
      let endpointUsed;
      
      try {
        // First try the organizations endpoint
        console.log("[fetchUserHierarchyPosition] Trying /api/v1/organizations/structure endpoint");
        response = await apiClient.get(`/api/v1/organizations/structure`);
        endpointUsed = '/api/v1/organizations/structure';
      } catch (e: any) {
        console.log("[fetchUserHierarchyPosition] First endpoint failed, trying fallback", {
          status: e.response?.status,
          message: e.message
        });
        
        try {
          // Try the map endpoint as fallback
          console.log("[fetchUserHierarchyPosition] Trying /api/v1/map/path endpoint");
          response = await apiClient.get(`/api/v1/map/path`);
          endpointUsed = '/api/v1/map/path';
        } catch (e2: any) {
          console.log("[fetchUserHierarchyPosition] Second endpoint failed, trying final fallback", {
            status: e2.response?.status,
            message: e2.message
          });
          
          // One more try with hierarchies endpoint
          console.log("[fetchUserHierarchyPosition] Trying /api/v1/hierarchies/current endpoint");
          response = await apiClient.get(`/api/v1/hierarchies/current`);
          endpointUsed = '/api/v1/hierarchies/current';
        }
      }
      
      console.log("[fetchUserHierarchyPosition] Response received:", {
        endpointUsed,
        status: response.status,
        hasData: !!response.data,
        hasPath: !!response.data?.path
      });
      
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
      } else if (response.data) {
        // Handle case where data is in a different format
        console.log("[fetchUserHierarchyPosition] Response has data but no path, trying alternative format:", response.data);
        
        // Try to extract data from possible formats based on endpoint
        const userPath = response.data.path || 
                        (response.data.structure ? response.data.structure.path : []) || 
                        (response.data.hierarchy ? response.data.hierarchy.path : []);
        
        const pathUnits = response.data.units || 
                          response.data.entities || 
                          {};
        
        if (userPath && userPath.length > 0) {
          setUnits(prevUnits => ({
            ...prevUnits,
            ...pathUnits
          }));
          
          // Select the user's team by default
          const teamId = userPath.find(id => pathUnits[id]?.type === 'TEAM' || pathUnits[id]?.entityType === 'team') || 
                         userPath[userPath.length - 1];
          
          setNavigationState(prev => ({
            ...prev,
            selectedUnitId: teamId,
            expandedUnitIds: [teamId],
            path: userPath
          }));
        } else {
          // No path data found in any format
          console.warn("[fetchUserHierarchyPosition] Could not extract path from response data");
          setError('Could not determine your position in the organization.');
        }
      }
    } catch (err: any) {
      // Enhanced error logging
      console.error('Error fetching hierarchy position:', err);
      console.log('[fetchUserHierarchyPosition] Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
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
      // Try multiple possible endpoints with fallbacks
      let response;
      let endpointUsed;
      
      console.log(`[fetchHierarchyUnit] Fetching details for unit ${unitId}`);
      
      try {
        // First try the organizations endpoint
        console.log("[fetchHierarchyUnit] Trying /api/v1/organizations/unit endpoint");
        response = await apiClient.get(`/api/v1/organizations/unit/${unitId}`);
        endpointUsed = '/api/v1/organizations/unit';
      } catch (e: any) {
        console.log("[fetchHierarchyUnit] First endpoint failed, trying fallback", {
          status: e.response?.status,
          message: e.message
        });
        
        try {
          // Try the map endpoint as fallback
          console.log("[fetchHierarchyUnit] Trying /api/v1/map/unit endpoint");
          response = await apiClient.get(`/api/v1/map/unit/${unitId}`);
          endpointUsed = '/api/v1/map/unit';
        } catch (e2: any) {
          console.log("[fetchHierarchyUnit] Second endpoint failed, trying final fallback", {
            status: e2.response?.status,
            message: e2.message
          });
          
          // One more try with hierarchies endpoint
          console.log("[fetchHierarchyUnit] Trying /api/v1/hierarchies/unit endpoint");
          response = await apiClient.get(`/api/v1/hierarchies/unit/${unitId}`);
          endpointUsed = '/api/v1/hierarchies/unit';
        }
      }
      
      console.log("[fetchHierarchyUnit] Response received:", {
        endpointUsed,
        status: response.status,
        hasData: !!response.data
      });
      
      if (response.data) {
        // Handle different response formats based on endpoint
        let fetchedUnit, childUnits;
        
        if (response.data.unit) {
          // Standard format
          fetchedUnit = response.data.unit;
          childUnits = response.data.children || [];
        } else if (response.data.entity) {
          // Alternative format
          fetchedUnit = response.data.entity;
          childUnits = response.data.childEntities || [];
        } else {
          // Direct unit data
          fetchedUnit = response.data;
          childUnits = response.data.children || [];
        }
        
        console.log("[fetchHierarchyUnit] Processed unit data:", { 
          unitId: fetchedUnit?.id,
          childCount: childUnits?.length
        });
        
        // Create a units map to merge with existing state
        const unitsMap: Record<string, OrganizationalUnitEntity> = {};
        
        // Only add the unit if it exists and has an id
        if (fetchedUnit && fetchedUnit.id) {
          unitsMap[fetchedUnit.id] = fetchedUnit;
          
          // Add child units to the map
          if (Array.isArray(childUnits)) {
            childUnits.forEach((unit: OrganizationalUnitEntity) => {
              if (unit && unit.id) {
                unitsMap[unit.id] = unit;
              }
            });
          }
          
          // Update state
          setUnits(prevUnits => ({
            ...prevUnits,
            ...unitsMap
          }));
          
          // Update path if this is the selected unit and it has path info
          if (navigationState.selectedUnitId === unitId && fetchedUnit.path) {
            setNavigationState(prev => ({
              ...prev,
              path: fetchedUnit.path || prev.path
            }));
          }
        } else {
          console.warn("[fetchHierarchyUnit] Received malformed unit data:", fetchedUnit);
          setError("Received invalid unit data from server.");
        }
      } else {
        console.warn("[fetchHierarchyUnit] No data in response");
        setError("No unit data received from server.");
      }
    } catch (err: any) {
      console.error(`Error fetching hierarchy unit ${unitId}:`, err);
      console.log('[fetchHierarchyUnit] Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
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
function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (context === undefined) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}

// Export all the necessary components and hooks
export { HierarchyContext, HierarchyProvider, useHierarchy };