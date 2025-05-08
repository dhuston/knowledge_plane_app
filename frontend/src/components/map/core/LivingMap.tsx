/**
 * LivingMap.tsx
 * Unified Living Map component that integrates all map functionality
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Flex, useToast, useColorModeValue } from '@chakra-ui/react';
import { SigmaContainer } from '@react-sigma/core';

// Import core components
import SigmaGraphLoader, { LayoutType } from './SigmaGraphLoader';
import MapControls from './controls/MapControls';
import NodeTooltip from './tooltips/NodeTooltip';

// Import types
import { MapNode, MapNodeTypeEnum, MapData, MapPosition } from '../../../types/map';

// Import hooks & utils
import { useApiClient } from '../../../hooks/useApiClient';

/**
 * Props for LivingMap component
 */
interface LivingMapProps {
  /** Whether the map should be centered on a specific node */
  centered?: boolean;
  /** ID of node to center on if centered=true */
  centerNodeId?: string;
  /** Initial filters to apply */
  initialFilters?: {
    types?: string[];
    statuses?: string[];
  };
  /** Callback when a node is selected */
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  /** Whether to cluster teams */
  clusterTeams?: boolean;
  /** Height of the map container */
  height?: string | number;
  /** Whether to show alignment overlays */
  showAlignmentOverlays?: boolean;
  /** Custom node renderer */
  customNodeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  /** Custom edge renderer */
  customEdgeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  /** Enable analytics mode */
  analyticsEnabled?: boolean;
  /** Data changed callback for analytics */
  onDataChange?: (nodes: MapNode[], edges: any[]) => void;
  /** Optional loading state override */
  loading?: boolean;
  /** Initial data if available */
  initialData?: MapData;
}

/**
 * LivingMap Component
 * 
 * Main component for visualizing the organization graph with interactions
 */
const LivingMap: React.FC<LivingMapProps> = ({
  centered = false,
  centerNodeId,
  initialFilters = {},
  onNodeSelect,
  clusterTeams = false,
  height = '100%',
  showAlignmentOverlays = true,
  customNodeRenderer,
  customEdgeRenderer,
  analyticsEnabled = false,
  onDataChange,
  loading: externalLoading,
  initialData,
}) => {
  // Hooks
  const toast = useToast();
  const apiClient = useApiClient();
  
  // State
  const [mapData, setMapData] = useState<MapData>(initialData || { nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{x: number, y: number} | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [viewportPosition, setViewportPosition] = useState<MapPosition | null>(null);
  const [sigma, setSigma] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [layoutType, setLayoutType] = useState<LayoutType>(() => {
    const saved = localStorage.getItem('map_layout_type') as LayoutType | null;
    return saved || 'cluster';
  });
  
  // Removed performance monitoring code
  
  // Use external loading state if provided
  useEffect(() => {
    if (externalLoading !== undefined) {
      setIsLoading(externalLoading);
    }
  }, [externalLoading]);
  
  // Generate graph API query parameters
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add filters
    const filters = initialFilters;
    if (filters.types && filters.types.length > 0) {
      params.append('types', filters.types.join(','));
    }
    
    if (filters.statuses && filters.statuses.length > 0) {
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
  }, [initialFilters, centered, centerNodeId, clusterTeams, viewportPosition]);
  
  // Load map data if not provided externally
  const loadMapData = useCallback(async () => {
    // Skip if we have initial data
    if (initialData) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const params = getQueryParams();
      // Using the now-public endpoint directly
      const response = await apiClient.get<MapData>(`/map/graph?${params.toString()}`);
      
      // Simplified data processing
      const processedData = response.data;
      setMapData(processedData);
      
      // Notify about data change if callback provided
      if (onDataChange) {
        onDataChange(processedData.nodes, processedData.edges);
      }
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
  }, [apiClient, getQueryParams, toast, initialData, onDataChange]);
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    // Removed performance monitoring
    if (!initialData) {
      loadMapData();
    }
  }, [loadMapData, initialData]);
  
  // Handle node selection
  const handleNodeSelect = useCallback((node: MapNode) => {
    // Removed performance monitoring
    setSelectedNode(node.id);
    
    if (onNodeSelect) {
      onNodeSelect(node.id, node.type);
    }
  }, [onNodeSelect]);
  
  // Handle stage click (deselection)
  const handleStageClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: MapNode | null, position: {x: number, y: number} | null) => {
    setHoveredNode(node);
    setHoveredNodePosition(position);
  }, []);
  
  // Handle viewport change
  const handleViewportChange = useCallback((position: MapPosition) => {
    setViewportPosition(position);
    setZoomLevel(position.zoom);
  }, []);
  
  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (sigma && sigma.getCamera()) {
      const camera = sigma.getCamera();
      const state = camera.getState();
      const newRatio = state.ratio / 1.2;
      
      camera.animate({ ratio: newRatio }, { duration: 200 });
      setZoomLevel(newRatio);
    } else {
      setZoomLevel(prev => prev / 1.2);
    }
  }, [sigma]);
  
  const handleZoomOut = useCallback(() => {
    if (sigma && sigma.getCamera()) {
      const camera = sigma.getCamera();
      const state = camera.getState();
      const newRatio = state.ratio * 1.2;
      
      camera.animate({ ratio: newRatio }, { duration: 200 });
      setZoomLevel(newRatio);
    } else {
      setZoomLevel(prev => prev * 1.2);
    }
  }, [sigma]);
  
  const handleResetZoom = useCallback(() => {
    if (sigma && sigma.getCamera()) {
      const camera = sigma.getCamera();
      camera.animate({ ratio: 1 }, { duration: 200 });
    }
    setZoomLevel(1);
  }, [sigma]);
  
  // Handle center view
  const handleCenterView = useCallback(() => {
    if (sigma && sigma.getCamera()) {
      const camera = sigma.getCamera();
      camera.animate({ 
        x: 0, 
        y: 0,
        ratio: 1
      }, { duration: 300 });
    }
  }, [sigma]);
  
  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayoutType(newLayout);
    localStorage.setItem('map_layout_type', newLayout);
    
    // Trigger layout change event for SigmaGraphLoader
    window.dispatchEvent(
      new CustomEvent('force-layout-change', { 
        detail: { 
          layoutType: newLayout,
          timestamp: Date.now()
        } 
      })
    );
  }, []);
  
  // Handle fullscreen
  const handleFullScreen = useCallback(() => {
    const container = document.querySelector('.sigma-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit full-screen mode:", err);
      });
    }
  }, []);
  
  // Handle sigma initialization
  const handleSigmaInitialized = useCallback((sigmaInstance: any) => {
    setSigma(sigmaInstance);
  }, []);
  
  // Memoized graph settings to prevent unnecessary re-renders
  const graphSettings = React.useMemo(() => ({
    nodeProgramClasses: {},
    edgeProgramClasses: {},
    defaultNodeColor: '#999',
    defaultEdgeColor: '#ccc',
    allowInvalidContainer: true,
    labelDensity: 0.07,
    labelGridCellSize: 60,
    labelRenderedSizeThreshold: 6,
    labelFont: 'Lato, sans-serif',
    zIndex: true
  }), []);
  
  const bgColor = useColorModeValue('#f8f9fa', '#1A202C');
  
  return (
    <Flex direction="column" height={height} width="100%" data-testid="living-map">
      {/* Main map area */}
      <Box flex="1" position="relative" bg={bgColor}>
        {/* Sigma container */}
        <SigmaContainer 
          style={{ width: '100%', height: '100%' }} 
          settings={graphSettings}
        >
          {/* Core graph loader */}
          <SigmaGraphLoader
            nodes={mapData.nodes}
            edges={mapData.edges}
            onStageClick={handleStageClick}
            onSigmaNodeClick={handleNodeSelect}
            onNodeHover={handleNodeHover}
            zoomLevel={zoomLevel}
            layoutType={layoutType}
            customNodeRenderer={customNodeRenderer}
            customEdgeRenderer={customEdgeRenderer}
            analyticsEnabled={analyticsEnabled}
            onDataChange={onDataChange}
            onViewportChange={handleViewportChange}
          />
        </SigmaContainer>
        
        {/* Map controls */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetZoom}
          onCenter={handleCenterView}
          onFullScreen={handleFullScreen}
          zoomLevel={zoomLevel}
          layoutType={layoutType}
          onLayoutChange={handleLayoutChange}
          isLoading={isLoading}
        />
        
        {/* Hover tooltip */}
        {hoveredNode && hoveredNodePosition && (
          <NodeTooltip
            node={hoveredNode}
            position={hoveredNodePosition}
          />
        )}
      </Box>
    </Flex>
  );
};

export default LivingMap;