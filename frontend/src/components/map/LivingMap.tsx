/**
 * LivingMap.tsx
 * Enhanced map visualization component using Sigma with viewport-based loading and LOD
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapData, MapNodeTypeEnum, MapNode } from '../../types/map';
import { Box, Spinner, Text, useToast, IconButton, useDisclosure, Tooltip } from '@chakra-ui/react';
import { FaFilter, FaChartBar } from 'react-icons/fa';
import { useApiClient } from '../../hooks/useApiClient';
import { useDeltaStream } from '../../hooks/useDeltaStream';
import { useFeatureFlags } from '../../utils/featureFlags';
import debounce from 'lodash/debounce';

// Import the ContextDrawer and NodeSelection context
import ContextDrawer from '../panels/ContextDrawer';
import { useNodeSelection } from '../../context/NodeSelectionContext';

// Add custom CSS for the full-page map
const fullPageMapStyles = {
  '.sigma-container': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  }
};

// Import from the shared styles
import { nodeStyles } from './styles/MapStyles';

// Import Sigma components
import { 
  SigmaContainer, 
  ControlsContainer, 
  LayoutForceAtlas2Control,
  useCamera
} from '@react-sigma/core';
import SigmaGraphLoader from './SigmaGraphLoader';

// Import extracted components
import MapSearchBar, { SearchResult } from './search/MapSearchBar';
import SearchResultsList from './search/SearchResultsList';
import MapFilterPanel, { MapFilters, AVAILABLE_STATUSES } from './filters/MapFilterPanel';
import MapLoadingOverlay from './loading/MapLoadingOverlay';

// Define viewport type for camera position tracking
interface Viewport {
  x: number;
  y: number;
  ratio: number;
  angle: number;
}

// Define sigma graph data types
interface SigmaNode {
  id: string;
  label: string;
  color: string;
  size: number;
  x: number;
  y: number;
  entityType: MapNodeTypeEnum;
  originalApiData: MapNode;
}

interface MapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: Record<string, unknown>;
}

interface SigmaEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  color: string;
  size: number;
  type?: string;
  originalApiData: MapEdge;
}

interface SigmaGraphData {
  nodes: SigmaNode[];
  edges: SigmaEdge[];
}

// Define delta update types
interface DeltaUpdate {
  added?: {
    nodes?: MapNode[];
    edges?: MapEdge[];
  };
  removed?: {
    nodeIds?: string[];
    edgeIds?: string[];
  };
  updated?: {
    nodes?: MapNode[];
    edges?: MapEdge[];
  };
}

interface LivingMapProps {
  onNodeClick: (nodeId: string | null) => void;
  isClustered?: boolean;
  projectOverlaps: Record<string, string[]>;
  onMapLoad?: () => void;
}

// Camera controller component to track viewport changes
const CameraController: React.FC<{
  onViewportChange: (viewport: Viewport) => void;
  throttleMs?: number;
}> = ({ onViewportChange, throttleMs = 300 }) => {
  const camera = useCamera();
  const lastUpdateRef = useRef<number>(0);
  
  // Track camera changes and report back to parent
  useEffect(() => {
    if (!camera) return;
    
    const handler = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > throttleMs) {
        lastUpdateRef.current = now;
        const state = camera.getState();
        onViewportChange({
          x: state.x,
          y: state.y,
          ratio: state.ratio,
          angle: state.angle
        });
      }
    };
    
    // Subscribe to camera state changes
    camera.addListener('updated', handler);
    return () => {
      camera.removeListener('updated', handler);
    };
  }, [camera, onViewportChange, throttleMs]);
  
  return null;
};

const LivingMap: React.FC<LivingMapProps> = ({
  onNodeClick,
  onMapLoad,
}) => {
  // Node selection is now managed by the NodeSelectionContext
  const toast = useToast();
  const apiClient = useApiClient();
  const { flags } = useFeatureFlags();
  const isMounted = useRef(true);
  const lastDeltaUpdateRef = useRef<number>(0);
  const lastViewportFetchRef = useRef<number>(0);
  // Define a type for our debounced function
  type DebouncedFetchFn = {
    (filters: MapFilters, viewportData: Viewport): void;
    cancel: () => void;
  };
  
  const debouncedFetchMapDataRef = useRef<DebouncedFetchFn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiData, setRawApiData] = useState<MapData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [sigmaGraphData, setSigmaGraphData] = useState<SigmaGraphData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, ratio: 1, angle: 0 });
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<MapFilters>({
    types: Object.values(MapNodeTypeEnum),
    statuses: ['active', 'planning'],
    depth: 1,
    clusterTeams: true
  });
  
  // Node and edge counts for stats
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});
  
  // Pagination support for large data sets
  const [hasMoreData, setHasMoreData] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 250; // Maximum nodes per page

  // Create a debounced fetch function that stays stable between renders
  const debouncedFetchMapData = useMemo(
    () => {
      const debouncedFn = debounce(
        (filters: MapFilters, viewportData: Viewport) => {
          fetchMapData(filters, viewportData);
        },
        300 // 300ms debounce time
      );
      
      // Store in ref for cleanup access without circular dependency
      debouncedFetchMapDataRef.current = debouncedFn;
      return debouncedFn;
    }, 
    [] // Empty dependency array to avoid circular dependency with fetchMapData
  );

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      // Cancel any pending debounced operations on unmount
      if (debouncedFetchMapDataRef.current && debouncedFetchMapDataRef.current.cancel) {
        debouncedFetchMapDataRef.current.cancel(); 
      }
    };
  }, []);

  // Handle viewport changes with proper debounce
  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
    // Update zoom level for LOD renderer
    setZoomLevel(1 / newViewport.ratio);
    
    // Only fetch new data if the camera has moved significantly
    if (Math.abs(newViewport.ratio - viewport.ratio) > 0.3 ||
        Math.abs(newViewport.x - viewport.x) > 200 ||
        Math.abs(newViewport.y - viewport.y) > 200) {
      // Use debounced function to prevent excessive API calls
      debouncedFetchMapData(filters, newViewport);
    }
  }, [viewport, filters, debouncedFetchMapData]);

  // Effect for Processing API Data for Sigma
  useEffect(() => {
    if (!rawApiData || !isMounted.current) return;

    setIsLoading(true);

    try {
      // Use memoization for expensive graph data processing
      const processApiData = () => {
        const nodesToProcess = rawApiData.nodes || [];
        const edgesToProcess = rawApiData.edges || [];
        const nodeIdsToRender = new Set(nodesToProcess.map(n => n.id));
        
        // Optimize node type counting with a single pass
        const counts: Record<string, number> = {};
        nodesToProcess.forEach(node => {
          counts[node.type] = (counts[node.type] || 0) + 1;
        });
        
        // Process nodes in one pass with proper typing
        const nodes: SigmaNode[] = nodesToProcess.map(node => ({
          id: node.id,
          label: node.label || node.id, // Ensure we have a label
          color: nodeStyles[node.type]?.color || '#999',
          size: nodeStyles[node.type]?.baseSize || 10,
          x: node.position?.x ?? Math.random() * 1000, 
          y: node.position?.y ?? Math.random() * 1000,
          entityType: node.type,
          originalApiData: node
        }));

        // Process edges in one pass with proper typing
        const edges: SigmaEdge[] = [];
        (edgesToProcess || []).forEach(edge => {
          if (nodeIdsToRender.has(edge.source) && nodeIdsToRender.has(edge.target)) {
            edges.push({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label || undefined,
              color: '#ccc',
              size: 1,
              type: edge.type,
              originalApiData: edge
            });
          }
        });

        return { nodes, edges, counts, hasMoreData: nodesToProcess.length >= PAGE_SIZE };
      };

      // Process the data with proper typing
      const { nodes, edges, counts, hasMoreData } = processApiData();
      
      // Update state with processed data
      setNodeCounts(counts);
      setHasMoreData(hasMoreData);

      // Update or replace the graph data
      if (currentPage > 1) {
        // Append new data to existing graph
        setSigmaGraphData(prevData => {
          if (!prevData) return { nodes, edges };
          
          // Optimize merging of existing and new data
          const existingNodeIds = new Set(prevData.nodes.map(n => n.id));
          const newNodes = nodes.filter(node => !existingNodeIds.has(node.id));
          
          const existingEdgeIds = new Set(prevData.edges.map(e => e.id));
          const newEdges = edges.filter(edge => !existingEdgeIds.has(edge.id));
          
          return {
            nodes: [...prevData.nodes, ...newNodes],
            edges: [...prevData.edges, ...newEdges]
          };
        });
      } else {
        // Replace existing graph with new data
        setSigmaGraphData({ nodes, edges });
      }

      if (isMounted.current && onMapLoad) {
        setTimeout(() => { if(isMounted.current && onMapLoad) onMapLoad(); }, 100);
      }

    } catch (processingError) {
      if (!isMounted.current) return;

      const msg = processingError instanceof Error ? processingError.message : "Unknown graph processing error";
      setError(msg);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [rawApiData, onMapLoad, currentPage, nodeStyles]);

  // Data Fetching Logic - Enhanced with filters and pagination
  const fetchMapData = useCallback(async (filterOptions: MapFilters, viewportData?: Viewport, page: number = 1) => {
    if (!isMounted.current || !apiClient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params: Record<string, string> = {
        page: page.toString(),
        limit: PAGE_SIZE.toString()
      };
      
      // Add type filters
      if (filterOptions.types && filterOptions.types.length > 0 && 
          filterOptions.types.length < Object.values(MapNodeTypeEnum).length) {
        params.types = filterOptions.types.join(',');
      }
      
      // Add status filters
      if (filterOptions.statuses && filterOptions.statuses.length > 0) {
        params.statuses = filterOptions.statuses.join(',');
      }
      
      // Add depth parameter
      params.depth = filterOptions.depth.toString();
      
      // Add cluster teams parameter
      params.cluster_teams = filterOptions.clusterTeams.toString();
      
      // Add center node if specified
      if (filterOptions.centerNodeId) {
        params.center_node_id = filterOptions.centerNodeId;
      }
      
      // Add viewport params if available
      if (viewportData) {
        params.view_x = Math.round(viewportData.x).toString();
        params.view_y = Math.round(viewportData.y).toString();
        params.view_ratio = viewportData.ratio.toFixed(2);
      }
      
      const response = await apiClient.get<MapData>('/map/data', { params });
      
      if (!isMounted.current) return;
      
      setCurrentPage(page);
      setRawApiData(response.data);
    } catch (fetchError: unknown) {
      if (!isMounted.current) return;
      
      const message = fetchError instanceof Error ? fetchError.message : 'An unknown error occurred';
      setError(message);
      toast({
        title: 'Error fetching map data',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [apiClient, toast]);

  // Initial Map Load
  useEffect(() => {
    if (!rawApiData) {
      fetchMapData(filters);
    }
  }, [rawApiData, fetchMapData, filters]);
  
  // Load more data when scrolling out or requesting next page
  const loadMoreData = useCallback(() => {
    if (hasMoreData && !isLoading) {
      fetchMapData(filters, viewport, currentPage + 1);
    }
  }, [hasMoreData, isLoading, fetchMapData, filters, viewport, currentPage]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MapFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      // Reset pagination when filters change
      fetchMapData(updated, viewport, 1);
      return updated;
    });
  }, [fetchMapData, viewport]);

  // Delta Update Logic - fully implemented for real-time updates
  const applyDeltaUpdates = useCallback((deltaData: DeltaUpdate) => {
    if (!deltaData || !sigmaGraphData) return;
    
    // Create new graph data with updates
    const updatedNodes = [...sigmaGraphData.nodes];
    const updatedEdges = [...sigmaGraphData.edges];
    let hasChanges = false;
    
    // Add new nodes
    if (deltaData.added?.nodes && deltaData.added.nodes.length > 0) {
      const newNodes = deltaData.added.nodes.map(node => ({
        id: node.id,
        label: node.label || node.id,
        color: nodeStyles[node.type]?.color || '#999',
        size: nodeStyles[node.type]?.baseSize || 10,
        x: node.position?.x ?? Math.random() * 1000, 
        y: node.position?.y ?? Math.random() * 1000,
        entityType: node.type,
        originalApiData: node
      }));
      updatedNodes.push(...newNodes);
      hasChanges = true;
    }
    
    // Remove nodes
    if (deltaData.removed?.nodeIds && deltaData.removed.nodeIds.length > 0) {
      const nodeIdsToRemove = new Set(deltaData.removed.nodeIds);
      const filteredNodes = updatedNodes.filter(node => !nodeIdsToRemove.has(node.id));
      if (filteredNodes.length !== updatedNodes.length) {
        updatedNodes.length = 0;
        updatedNodes.push(...filteredNodes);
        hasChanges = true;
      }
    }
    
    // Update existing nodes
    if (deltaData.updated?.nodes && deltaData.updated.nodes.length > 0) {
      const nodeMap = new Map(updatedNodes.map(node => [node.id, node]));
      deltaData.updated.nodes.forEach(updatedNode => {
        const existingNode = nodeMap.get(updatedNode.id);
        if (existingNode) {
          // Update node properties
          existingNode.label = updatedNode.label || existingNode.label;
          existingNode.color = nodeStyles[updatedNode.type]?.color || existingNode.color;
          if (updatedNode.position) {
            existingNode.x = updatedNode.position.x;
            existingNode.y = updatedNode.position.y;
          }
          existingNode.originalApiData = updatedNode;
          hasChanges = true;
        }
      });
    }
    
    // Handle edges - add new edges
    if (deltaData.added?.edges && deltaData.added.edges.length > 0) {
      const newEdges = deltaData.added.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || undefined,
        color: '#ccc',
        size: 1,
        type: edge.type,
        originalApiData: edge
      }));
      updatedEdges.push(...newEdges);
      hasChanges = true;
    }
    
    // Remove edges
    if (deltaData.removed?.edgeIds && deltaData.removed.edgeIds.length > 0) {
      const edgeIdsToRemove = new Set(deltaData.removed.edgeIds);
      const filteredEdges = updatedEdges.filter(edge => !edgeIdsToRemove.has(edge.id));
      if (filteredEdges.length !== updatedEdges.length) {
        updatedEdges.length = 0;
        updatedEdges.push(...filteredEdges);
        hasChanges = true;
      }
    }
    
    // Only update state if there were actual changes
    if (hasChanges) {
      setSigmaGraphData({ nodes: updatedNodes, edges: updatedEdges });
      
      // Update node counts
      const newCounts: Record<string, number> = {};
      updatedNodes.forEach(node => {
        newCounts[node.entityType] = (newCounts[node.entityType] || 0) + 1;
      });
      setNodeCounts(newCounts);
    }
  }, [sigmaGraphData, nodeStyles]);

  // Delta handler calls the adapted applyDeltaUpdates
  const handleDeltaUpdate = useCallback((deltaData: DeltaUpdate) => {
    const now = Date.now();
    if (now - lastDeltaUpdateRef.current < 1000) {
      // Throttle frequent updates
    } else {
      lastDeltaUpdateRef.current = now;
      applyDeltaUpdates(deltaData);
    }
  }, [applyDeltaUpdates, lastDeltaUpdateRef]);

  // Connect to delta stream
  useDeltaStream(handleDeltaUpdate);

  // Handle search node selection
  const handleSearch = useCallback(() => {
    if (searchResults.length) {
      // Select the first search result
      handleNodeSelect(searchResults[0].id);
    }
  }, [searchResults, handleNodeSelect]);

  // Enhanced search with type filtering - using useMemo for better performance
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Only perform filtering when we have both query and data
    if (sigmaGraphData?.nodes) {
      // Use useMemo to memoize the search results calculation
      const getFilteredResults = () => {
        const matches: SearchResult[] = [];
        sigmaGraphData.nodes.forEach((node) => {
          if (node.label?.toLowerCase().includes(query)) {
            matches.push({ 
              id: node.id, 
              label: node.label || node.id,
              type: node.entityType
            });
          }
        });
        return matches.slice(0, 8);
      };
      
      // Memoize the expensive filtering operation
      const results = useMemo(getFilteredResults, [query, sigmaGraphData.nodes]);
      
      setSearchResults(results);
    }
  }, [searchQuery, sigmaGraphData]);

  // Filter Panel State
  const { isOpen: isFilterPanelOpen, onToggle: onFilterPanelToggle } = useDisclosure();

  // Render Logic
  if (isLoading && !sigmaGraphData) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Spinner size="xl" /></Box>;
  }
  
  if (error && !sigmaGraphData) {
    return <Box p={5}><Text color="red.500">Error: {error}</Text></Box>;
  }

  // Use the NodeSelectionContext for node selection
  const { selectNode } = useNodeSelection();
  
  // Handle node selection with proper memory to prevent errors on subsequent selections
  const selectedNodeRef = useRef<MapNode | null>(null);
  
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    if (nodeId === null) {
      // Deselection - pass null to clear selection
      selectNode(null);
      selectedNodeRef.current = null;
    } else if (sigmaGraphData?.nodes) {
      // Find and set the selected node
      const node = sigmaGraphData.nodes.find(n => n.originalApiData.id === nodeId);
      
      if (node) {
        // Store the full node data in a ref to use for subsequent operations
        selectedNodeRef.current = node.originalApiData;
        
        // Use the central selectNode function from context
        selectNode(node.originalApiData);
      } else if (selectedNodeRef.current) {
        // If we can't find the node in the graph but we have a previously selected node,
        // we can try to find it in the related nodes of that one
        const relationships = selectedNodeRef.current.data?.relationships || [];
        const relatedNodeId = relationships.find(rel => 
          rel.targetId === nodeId || rel.sourceId === nodeId
        );
        
        if (relatedNodeId) {
          // We found a related node - use its data if available
          const relatedNode = relatedNodeId.targetId === nodeId 
            ? relatedNodeId.target 
            : relatedNodeId.source;
            
          if (relatedNode) {
            // We have the full node data
            selectNode(relatedNode);
            selectedNodeRef.current = relatedNode;
          } else {
            // Create a placeholder node with minimal data
            const placeholderNode: MapNode = {
              id: nodeId,
              label: `Node ${nodeId}`,
              type: MapNodeTypeEnum.USER,  // Default type
              data: {}
            };
            selectNode(placeholderNode);
            selectedNodeRef.current = placeholderNode;
          }
        } else {
          // Create a minimal placeholder node
          const placeholderNode: MapNode = {
            id: nodeId,
            label: `Node ${nodeId}`,
            type: MapNodeTypeEnum.USER,  // Default type
            data: {}
          };
          selectNode(placeholderNode);
          selectedNodeRef.current = placeholderNode;
        }
      }
    }
    
    // Call the parent's onNodeClick if provided (keeping backward compatibility)
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [sigmaGraphData, selectNode, onNodeClick]);

  return (
    <Box height="100%" width="100%" position="relative">
      <Box 
        position="absolute" 
        inset="0" 
        background="#f8f8f8" 
        tabIndex={0} // Make the map container focusable
        role="application" 
        aria-label="Interactive map visualization"
        onKeyDown={(e) => {
          // Add keyboard navigation for map
          const step = 50;  // Pixels to move per keystroke
          const zoomStep = 0.1; // Zoom factor per keystroke
          
          switch (e.key) {
            case 'ArrowUp':
              // Move camera up
              if (e.altKey) {
                // Alt+Arrow = zoom in
                const newZoom = zoomLevel * (1 + zoomStep);
                setZoomLevel(newZoom);
              } else {
                // Move viewport
                handleViewportChange({
                  ...viewport,
                  y: viewport.y - step / viewport.ratio
                });
              }
              e.preventDefault();
              break;
              
            case 'ArrowDown':
              // Move camera down
              if (e.altKey) {
                // Alt+Arrow = zoom out
                const newZoom = zoomLevel * (1 - zoomStep);
                setZoomLevel(newZoom);
              } else {
                handleViewportChange({
                  ...viewport,
                  y: viewport.y + step / viewport.ratio
                });
              }
              e.preventDefault();
              break;
              
            case 'ArrowLeft':
              // Move camera left
              handleViewportChange({
                ...viewport,
                x: viewport.x - step / viewport.ratio
              });
              e.preventDefault();
              break;
              
            case 'ArrowRight':
              // Move camera right
              handleViewportChange({
                ...viewport,
                x: viewport.x + step / viewport.ratio
              });
              e.preventDefault();
              break;
              
            case '+':
              // Zoom in
              const newZoomIn = zoomLevel * (1 + zoomStep);
              setZoomLevel(newZoomIn);
              e.preventDefault();
              break;
              
            case '-':
              // Zoom out
              const newZoomOut = zoomLevel * (1 - zoomStep);
              setZoomLevel(newZoomOut);
              e.preventDefault();
              break;
              
            case 'Home':
              // Reset view
              handleViewportChange({ x: 0, y: 0, ratio: 1, angle: 0 });
              e.preventDefault();
              break;
          }
        }}
        // Add screen reader instructions
        aria-describedby="map-instructions"
      >
        {/* Visually hidden instructions for screen reader users */}
        <Box 
          id="map-instructions" 
          position="absolute" 
          width="1px" 
          height="1px" 
          padding="0" 
          margin="-1px" 
          overflow="hidden" 
          clip="rect(0, 0, 0, 0)" 
          border="0"
        >
          Use arrow keys to navigate the map. Alt plus arrow up or down to zoom. Plus and minus keys also control zoom. Press Home key to reset the view.
        </Box>
        
        {sigmaGraphData ? (
          <SigmaContainer 
            style={{ width: '100%', height: '100%' }} 
            settings={{ 
              allowInvalidContainer: true,
              // Enable labels only at high zoom levels
              renderLabels: viewport.ratio < 0.6,
              // Always render edges - this is what we want
              renderEdges: true,
              // Limit edge labels at low zoom levels
              renderEdgeLabels: viewport.ratio < 0.4,
              // Ensure edge rendering is prioritized
              edgeProgramClasses: { 
                def: { backgroundColor: '#fff' } 
              }
            }}
            className="full-page-sigma-container" // Add a class for custom styling
            sx={fullPageMapStyles} // Apply the custom styles
          >
            <CameraController onViewportChange={handleViewportChange} />
            
            <SigmaGraphLoader
              nodes={useMemo(() => 
                sigmaGraphData.nodes.map(node => node.originalApiData), 
                [sigmaGraphData.nodes]
              )}
              edges={useMemo(() => 
                sigmaGraphData.edges.map(edge => ({
                  source: edge.source,
                  target: edge.target,
                  type: edge.type
                })), 
                [sigmaGraphData.edges]
              )}
              onSigmaNodeClick={useCallback(
                (node: MapNode | null) => handleNodeSelect(node?.id || null), 
                [handleNodeSelect]
              )}
              onStageClick={useCallback(
                () => handleNodeSelect(null), 
                [handleNodeSelect]
              )}
              onNodeHover={useCallback(
                (_node: MapNode | null) => {
                  // We'll implement this when needed
                }, 
                []
              )}
              zoomLevel={zoomLevel}
            />
            
            <ControlsContainer position={"bottom-right"}>
              <LayoutForceAtlas2Control autoRunFor={1000} settings={{
                gravity: 1.5,
                barnesHutOptimize: true,
                linLogMode: true,
                outboundAttractionDistribution: true,
                adjustSizes: true,
              }} />
            </ControlsContainer>
          </SigmaContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            {isLoading ? <Spinner size="xl" /> : <Text>No graph data to display.</Text>}
          </Box>
        )}
      </Box>

      {/* Filter Toggle Button */}
      <IconButton
        aria-label="Toggle Filters Panel"
        icon={<FaFilter />}
        size="sm"
        position="absolute"
        top="15px"
        right="15px"
        zIndex={4}
        onClick={onFilterPanelToggle}
        colorScheme={isFilterPanelOpen ? 'blue' : 'gray'}
        variant={isFilterPanelOpen ? 'solid' : 'outline'}
        aria-expanded={isFilterPanelOpen}
        aria-controls="filter-panel"
        aria-haspopup="dialog"
      />
      
      {/* Analytics Toggle - only shown if feature flag is enabled */}
      {flags.enableAnalytics && (
        <Tooltip label="Toggle Analytics View">
          <IconButton
            aria-label="Toggle Analytics View"
            icon={<FaChartBar />}
            size="sm"
            position="absolute"
            top="15px"
            right="60px"
            zIndex={4}
            onClick={() => {
              // This would typically update some analytics state
              toast({
                title: "Analytics mode toggled",
                description: "Map analytics view has been enabled",
                status: "info",
                duration: 2000,
              });
            }}
            colorScheme="teal"
            variant="outline"
          />
        </Tooltip>
      )}

      {/* Enhanced Filter Panel */}
      {isFilterPanelOpen && (
        <MapFilterPanel
          filters={filters}
          updateFilters={updateFilters}
          nodeCounts={nodeCounts}
          nodeCount={sigmaGraphData?.nodes.length || 0}
          edgeCount={sigmaGraphData?.edges.length || 0}
          hasMoreData={hasMoreData}
          loadMoreData={loadMoreData}
        />
      )}

      {/* Search Bar */}
      <MapSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Search Suggestions Dropdown */}
      <SearchResultsList
        results={searchResults}
        onResultClick={handleNodeSelect}
        visible={searchResults.length > 0}
      />

      {/* Loading Indicator Overlay */}
      <MapLoadingOverlay isLoading={isLoading} />
      
      {/* Context Drawer - simplified with context */}
      <ContextDrawer />
    </Box>
  );
};

export default LivingMap;