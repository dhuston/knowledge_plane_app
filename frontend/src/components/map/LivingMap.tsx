import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Box, Flex, useToast, useColorModeValue } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiClient } from '../../hooks/useApiClient';
import { SigmaGraphLoader } from './SigmaGraphLoader';
import { MapControls } from './MapControls';
import { MapSearch } from './MapSearch';
import { NodeTooltip } from './NodeTooltip';
import { MapFilterPanel } from './filters/MapFilterPanel';
import StrategicAlignmentLayer from './overlays/StrategicAlignmentLayer';
import { useLayoutWorker } from '../../hooks/useLayoutWorker';
import { perfume, useComponentPerformance, measureAsync } from '../../utils/performance';
import type { MapData, MapNode, MapEdge, MapNodeTypeEnum, MapPosition } from '../../types/map';

interface LivingMapProps {
  centered?: boolean;
  centerNodeId?: string;
  initialFilters?: {
    types?: string[];
    statuses?: string[];
  };
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  clusterTeams?: boolean;
  height?: string | number;
  showAlignmentOverlays?: boolean;
}

export const LivingMap = ({
  centered = false,
  centerNodeId,
  initialFilters = {},
  onNodeSelect,
  clusterTeams = false,
  height = '100%',
  showAlignmentOverlays = true
}: LivingMapProps) => {
  // Performance monitoring
  const mapPerformance = useComponentPerformance('LivingMap');
  const renderCount = useRef(0);
  
  // Hooks
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const apiClient = useApiClient();
  const layoutWorker = useLayoutWorker();
  
  // State
  const [mapData, setMapData] = useState<MapData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    types: initialFilters.types || [],
    statuses: initialFilters.statuses || ['active', 'planning']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewportPosition, setViewportPosition] = useState<MapPosition | null>(null);
  const [sigma, setSigma] = useState<any>(null);
  const [visibleNodeIds, setVisibleNodeIds] = useState<number[]>([]);
  
  // Keep track of renders for performance monitoring
  renderCount.current += 1;
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && renderCount.current > 5) {
      console.warn(`[Performance] LivingMap rendered ${renderCount.current} times`);
    }
  });
  
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
      
      // Update visible node IDs
      setVisibleNodeIds(processedData.nodes.map(node => parseInt(node.id)));
      
      perfume.end('mapDataProcessing');
    } catch (error) {
      console.error('Error loading map data:', error);
      toast({
        title: 'Error loading map data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, getQueryParams, layoutWorker, toast]);
  
  // Load data on mount and when filters change
  useEffect(() => {
    mapPerformance.start();
    loadMapData();
    return () => mapPerformance.end();
  }, [loadMapData, mapPerformance]);
  
  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string, nodeType: MapNodeTypeEnum) => {
    perfume.start('nodeSelection');
    setSelectedNode(nodeId);
    
    if (onNodeSelect) {
      onNodeSelect(nodeId, nodeType);
    }
    
    perfume.end('nodeSelection');
  }, [onNodeSelect]);
  
  // Handle node hover
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);
  
  // Handle viewport change
  const handleViewportChange = useCallback((position: MapPosition) => {
    // Throttle viewport updates to avoid excessive API calls
    const now = Date.now();
    if (!viewportPosition || now - lastViewportUpdate.current > 500) {
      setViewportPosition(position);
      lastViewportUpdate.current = now;
    }
  }, [viewportPosition]);
  
  // Handle sigma initialization
  const handleSigmaInitialized = useCallback((sigmaInstance: any) => {
    setSigma(sigmaInstance);
  }, []);
  
  // Handle misalignment click
  const handleMisalignmentClick = useCallback((nodeId: number, misalignmentData: any) => {
    // Find the node with this ID
    const node = mapData.nodes.find(n => parseInt(n.id) === nodeId);
    if (node) {
      // Select the node
      handleNodeSelect(node.id, node.type);
      
      // Show a toast with misalignment information
      toast({
        title: `Misalignment Detected`,
        description: misalignmentData.description,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [mapData.nodes, handleNodeSelect, toast]);
  
  const lastViewportUpdate = useRef(0);
  
  // Memoized graph settings to prevent unnecessary re-renders
  const graphSettings = useMemo(() => ({
    nodeSizeMultiplier: 1.5,
    edgeThickness: 1.2,
    backgroundColor: useColorModeValue('#f8f9fa', '#1A202C'),
    animationDuration: 300,
  }), [useColorModeValue]);
  
  return (
    <Flex direction="column" height={height} width="100%">
      <Box bg={useColorModeValue('gray.50', 'gray.800')} position="relative" zIndex={2}>
        <Flex 
          justifyContent="flex-end" 
          p={2} 
          alignItems="center" 
          borderBottomWidth="1px"
          borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <MapFilterPanel 
            filters={filters} 
            setFilters={setFilters} 
            clusterTeams={clusterTeams} 
            onClusterToggle={() => {}} // Handle cluster toggle
          />
          <MapControls onReset={() => loadMapData()} isLoading={isLoading} />
        </Flex>
      </Box>
      
      <Box flex="1" position="relative">
        {/* The MapSearch component is now positioned absolutely within the map area */}
        <MapSearch 
          onNodeSelect={(nodeId) => {
            // Find the node to get its type
            const node = mapData.nodes.find(n => n.id === nodeId);
            if (node) {
              handleNodeSelect(nodeId, node.type);
            }
          }} 
          nodes={mapData.nodes} 
          placeholder="Search nodes, teams, projects..."
        />
        
        <SigmaGraphLoader
          nodes={mapData.nodes}
          edges={mapData.edges}
          settings={graphSettings}
          onNodeClick={handleNodeSelect}
          onNodeHover={handleNodeHover}
          onViewportChange={handleViewportChange}
          selectedNodeId={selectedNode}
          centerNodeId={centerNodeId}
          isLoading={isLoading}
          onSigmaInitialized={handleSigmaInitialized}
        />
        
        {hoveredNode && (
          <NodeTooltip nodeId={hoveredNode} nodes={mapData.nodes} />
        )}

        {/* Strategic alignment overlays layer */}
        {showAlignmentOverlays && sigma && (
          <StrategicAlignmentLayer 
            sigma={sigma} 
            visibleNodes={visibleNodeIds} 
            onMisalignmentClick={handleMisalignmentClick}
          />
        )}
      </Box>
    </Flex>
  );
};

export default LivingMap;