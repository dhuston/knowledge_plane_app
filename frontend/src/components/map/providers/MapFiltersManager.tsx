import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { MapNodeTypeEnum } from '../../../types/map';
import { useMapData } from './MapDataProvider';

// Define the filters state interface
export interface FiltersState {
  types: MapNodeTypeEnum[];
  statuses: string[];
  clusterTeams: boolean;
  depth: number;
}

// Define the context type
interface MapFiltersContextType {
  filters: FiltersState;
  setFilters: (newFilters: Partial<FiltersState>) => void;
  toggleNodeType: (type: MapNodeTypeEnum) => void;
  toggleStatus: (status: string) => void;
  toggleClusterTeams: () => void;
  setDepth: (depth: number) => void;
  resetFilters: () => void;
  availableNodeTypes: MapNodeTypeEnum[];
  availableStatuses: string[];
  nodeCounts: Record<string, number>;
}

// Default available statuses
export const AVAILABLE_STATUSES = ['active', 'planning', 'completed', 'blocked', 'archived'];

// Create the context
export const MapFiltersContext = createContext<MapFiltersContextType | undefined>(undefined);

// Props for the provider component
interface MapFiltersManagerProps {
  children: ReactNode;
  initialFilters?: Partial<FiltersState>;
}

/**
 * MapFiltersManager - Context provider component for managing map filters
 */
export const MapFiltersManager: React.FC<MapFiltersManagerProps> = ({
  children,
  initialFilters = {}
}) => {
  // Get map data to extract available node types and counts
  const { mapData, loadMapData } = useMapData();
  
  // Default filter state
  const defaultFilters: FiltersState = {
    types: [],
    statuses: ['active', 'planning'],
    clusterTeams: true,
    depth: 1,
  };
  
  // Merge initial filters with defaults
  const [filters, setFiltersState] = useState<FiltersState>({
    ...defaultFilters,
    ...initialFilters,
  });
  
  // Calculate node counts from map data
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});
  
  // Extract available node types from data
  const [availableNodeTypes, setAvailableNodeTypes] = useState<MapNodeTypeEnum[]>([]);
  
  // Update node counts when map data changes
  useEffect(() => {
    if (mapData.nodes.length > 0) {
      // Count nodes by type
      const counts: Record<string, number> = {};
      const types = new Set<MapNodeTypeEnum>();
      
      mapData.nodes.forEach(node => {
        counts[node.type] = (counts[node.type] || 0) + 1;
        types.add(node.type);
      });
      
      setNodeCounts(counts);
      setAvailableNodeTypes(Array.from(types));
    }
  }, [mapData]);
  
  // Set filters with partial updates
  const setFilters = useCallback((newFilters: Partial<FiltersState>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
  }, []);
  
  // Toggle a node type filter
  const toggleNodeType = useCallback((type: MapNodeTypeEnum) => {
    setFiltersState(prevFilters => {
      const isSelected = prevFilters.types.includes(type);
      const newTypes = isSelected
        ? prevFilters.types.filter(t => t !== type)
        : [...prevFilters.types, type];
      
      return {
        ...prevFilters,
        types: newTypes,
      };
    });
  }, []);
  
  // Toggle a status filter
  const toggleStatus = useCallback((status: string) => {
    setFiltersState(prevFilters => {
      const isSelected = prevFilters.statuses.includes(status);
      const newStatuses = isSelected
        ? prevFilters.statuses.filter(s => s !== status)
        : [...prevFilters.statuses, status];
      
      return {
        ...prevFilters,
        statuses: newStatuses,
      };
    });
  }, []);
  
  // Toggle team clustering
  const toggleClusterTeams = useCallback(() => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      clusterTeams: !prevFilters.clusterTeams,
    }));
  }, []);
  
  // Set relationship depth
  const setDepth = useCallback((depth: number) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      depth,
    }));
  }, []);
  
  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, [defaultFilters]);
  
  // Reload map data when filters change
  useEffect(() => {
    loadMapData();
  }, [filters, loadMapData]);
  
  // Expose the context value
  const contextValue: MapFiltersContextType = {
    filters,
    setFilters,
    toggleNodeType,
    toggleStatus,
    toggleClusterTeams,
    setDepth,
    resetFilters,
    availableNodeTypes,
    availableStatuses: AVAILABLE_STATUSES,
    nodeCounts,
  };
  
  return (
    <MapFiltersContext.Provider value={contextValue}>
      {children}
    </MapFiltersContext.Provider>
  );
};

// Custom hook for accessing the map filters context
export const useMapFilters = (): MapFiltersContextType => {
  const context = useContext(MapFiltersContext);
  
  if (context === undefined) {
    throw new Error('useMapFilters must be used within a MapFiltersManager');
  }
  
  return context;
};