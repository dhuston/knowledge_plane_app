import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useApiClient } from '../../../hooks/useApiClient';
import { useLayoutWorker } from '../../../hooks/useLayoutWorker';
import { perfume, measureAsync } from '../../../utils/performance';
import type { MapData, MapPosition, MapNodeTypeEnum } from '../../../types/map';

// Define the context type
interface MapDataContextType {
  mapData: MapData;
  isLoading: boolean;
  error: Error | null;
  loadMapData: () => Promise<void>;
  refreshMapData: () => Promise<void>;
  selectedNode: string | null;
  setSelectedNode: (nodeId: string | null) => void;
}

// Create the context
export const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

// Props for the provider component
interface MapDataProviderProps {
  children: ReactNode;
  initialFilters?: {
    types?: string[];
    statuses?: string[];
  };
  centered?: boolean;
  centerNodeId?: string;
  clusterTeams?: boolean;
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
}

/**
 * MapDataProvider - Context provider component that manages map data fetching and state
 */
export const MapDataProvider: React.FC<MapDataProviderProps> = ({
  children,
  initialFilters = {},
  centered = false,
  centerNodeId,
  clusterTeams = false,
  onNodeSelect,
}) => {
  // Hooks
  const apiClient = useApiClient();
  const layoutWorker = useLayoutWorker();
  
  // State
  const [mapData, setMapData] = useState<MapData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState({
    types: initialFilters.types || [],
    statuses: initialFilters.statuses || ['active', 'planning']
  });
  const [viewportPosition, setViewportPosition] = useState<MapPosition | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Generate graph API query parameters
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.types.length > 0) {
      params.append('types', filters.types.join(','));
    }
    
    if (filters.statuses.length > 0) {
      params.append('statuses', filters.statuses.join(','));
    }
    
    // Add centering parameters
    if (centered && centerNodeId) {
      params.append('center_node_id', centerNodeId);
      params.append('depth', '2');
    }
    
    // Add clustering parameter
    if (clusterTeams) {
      params.append('cluster_teams', 'true');
    }
    
    // Add viewport parameters if available
    if (viewportPosition) {
      params.append('view_x', viewportPosition.x.toString());
      params.append('view_y', viewportPosition.y.toString());
      params.append('view_ratio', viewportPosition.zoom.toString());
    }
    
    return params;
  }, [filters, centered, centerNodeId, clusterTeams, viewportPosition]);
  
  // Load map data
  const loadMapData = useCallback(async () => {
    try {
      perfume.start('mapDataFetch');
      setIsLoading(true);
      setError(null);
      
      const params = getQueryParams();
      const response = await apiClient.get<MapData>(`/api/v1/map/data?${params.toString()}`);
      
      perfume.end('mapDataFetch');
      perfume.start('mapDataProcessing');
      
      // Process data if needed (like layout calculations or data transformations)
      const processedData = await measureAsync('mapDataProcessing', async () => {
        if (response.data.nodes.length > 50) {
          // For large data sets, use web worker for layout calculations
          return await layoutWorker.processMapData(response.data);
        }
        return response.data;
      });
      
      setMapData(processedData);
      perfume.end('mapDataProcessing');
    } catch (err) {
      console.error('Error loading map data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading map data'));
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, getQueryParams, layoutWorker]);
  
  // Refresh map data - same as loadMapData but keeps the current code pattern
  const refreshMapData = useCallback(() => {
    return loadMapData();
  }, [loadMapData]);
  
  // Handle node selection with external callback
  const handleNodeSelect = useCallback((nodeId: string | null, nodeType?: MapNodeTypeEnum) => {
    setSelectedNode(nodeId);
    
    if (nodeId && nodeType && onNodeSelect) {
      onNodeSelect(nodeId, nodeType);
    }
  }, [onNodeSelect]);
  
  // Update selected node with context-aware handler
  const updateSelectedNode = useCallback((nodeId: string | null) => {
    // Find the node to get its type
    if (nodeId) {
      const node = mapData.nodes.find(n => n.id === nodeId);
      if (node) {
        handleNodeSelect(nodeId, node.type);
      } else {
        setSelectedNode(nodeId);
      }
    } else {
      setSelectedNode(null);
    }
  }, [mapData.nodes, handleNodeSelect]);
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    loadMapData();
  }, [loadMapData]);
  
  // Expose the context value
  const contextValue: MapDataContextType = {
    mapData,
    isLoading,
    error,
    loadMapData,
    refreshMapData,
    selectedNode,
    setSelectedNode: updateSelectedNode
  };
  
  return (
    <MapDataContext.Provider value={contextValue}>
      {children}
    </MapDataContext.Provider>
  );
};

// Custom hook for accessing the map data context
export const useMapData = (): MapDataContextType => {
  const context = useContext(MapDataContext);
  
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  
  return context;
};