/**
 * WebGLMap.tsx
 * Main component for rendering the knowledge graph using Sigma.js
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';

// Sigma v2 React bindings
import {
  SigmaContainer,
  ControlsContainer,
} from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';

import { MapNode, MapEdgeTypeEnum, MapNodeTypeEnum } from '../../types/map';
import { useApiClient } from '../../hooks/useApiClient';
import { 
  Box, 
  Spinner, 
  Text, 
  useToast, 
  useDisclosure, 
  useColorModeValue, 
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton
} from '@chakra-ui/react';

// Import error handling utilities
import { AppError, ErrorCategory, extractErrorMessage, createApiError } from '../../utils/errorHandling';

// Import custom components
import MapControls from './MapControls';
import MapSearch from './MapSearch';
import SimpleNodeTooltip from './SimpleNodeTooltip';
import SigmaGraphLoader from './SigmaGraphLoader';

// Import analytics related components and types
import { NodeMetrics } from '../analytics/AnalyticsEngine';
import { 
  createAnalyticsRenderer, 
  createAnalyticsEdgeRenderer,
  AnalyticsRendererOptions
} from './renderers/AnalyticsRenderer';

// Import styles
import { nodeStyles, edgeStyles } from './styles/MapStyles';

interface WebGLMapProps {
  onNodeClick: (node: MapNode | null) => void;
  onLoad?: () => void;
  onLinkNodes?: (sourceNode: MapNode, targetNode: MapNode) => void;
  // New props for analytics support
  onDataChange?: (nodes: MapNode[], edges: { source: string; target: string; type?: MapEdgeTypeEnum }[]) => void;
  analyticsEnabled?: boolean;
  analyticsRenderer?: {
    createRenderer: typeof createAnalyticsRenderer;
    metrics: Record<string, NodeMetrics>;
    clusters: Record<string, string[]>;
    options: AnalyticsRendererOptions;
  };
}

// Define fallback nodes and edges for error cases
const FALLBACK_NODES: MapNode[] = [
  {
    id: 'org-1',
    label: 'Organization',
    type: MapNodeTypeEnum.DEPARTMENT,
    data: { color: '#3182ce', size: 10 }
  },
  {
    id: 'team-1',
    label: 'Core Team',
    type: MapNodeTypeEnum.TEAM,
    data: { color: '#38a169', size: 8 }
  },
  {
    id: 'user-1',
    label: 'Sample User',
    type: MapNodeTypeEnum.USER,
    data: { color: '#4299e1', size: 6 }
  },
  {
    id: 'project-1',
    label: 'Demo Project',
    type: MapNodeTypeEnum.PROJECT,
    data: { color: '#805ad5', size: 7 }
  },
  {
    id: 'goal-1',
    label: 'Example Goal',
    type: MapNodeTypeEnum.GOAL,
    data: { color: '#dd6b20', size: 7 }
  }
];

const FALLBACK_EDGES = [
  { source: 'user-1', target: 'team-1', type: MapEdgeTypeEnum.MEMBER_OF },
  { source: 'team-1', target: 'org-1', type: MapEdgeTypeEnum.REPORTS_TO },
  { source: 'team-1', target: 'project-1', type: MapEdgeTypeEnum.OWNS },
  { source: 'project-1', target: 'goal-1', type: MapEdgeTypeEnum.ALIGNED_TO }
];

const WebGLMap: React.FC<WebGLMapProps> = ({ 
  onNodeClick, 
  onLoad, 
  onLinkNodes,
  onDataChange,
  analyticsEnabled = false,
  analyticsRenderer 
}) => {
  const apiClient = useApiClient();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const errorBg = useColorModeValue('red.50', 'red.900');

  // State for map data
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string; type?: MapEdgeTypeEnum }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [usedFallbackData, setUsedFallbackData] = useState(false);

  // State for enhanced UX
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
  const { isOpen: isFilterOpen, onToggle: onFilterToggle } = useDisclosure();
  const requestAbortController = useRef<AbortController | null>(null);

  // Check API availability
  const checkApiAvailability = useCallback(async () => {
    try {
      const isAvailable = await apiClient.isApiAvailable();
      setApiAvailable(isAvailable);
      return isAvailable;
    } catch (err) {
      setApiAvailable(false);
      return false;
    }
  }, [apiClient]);

  // Fetch initial graph from the API with improved error handling
  const fetchMapData = useCallback(async () => {
    // Cancel any previous request
    if (requestAbortController.current) {
      requestAbortController.current.abort();
    }
    
    // Create a new abort controller for this request
    requestAbortController.current = new AbortController();
    const signal = requestAbortController.current.signal;
    
    setIsLoading(true);
    setError(null);
    
    // Check API availability first
    const apiIsAvailable = await checkApiAvailability();
    if (!apiIsAvailable) {
      console.warn("WebGLMap: API is not available, using fallback data");
      setUsedFallbackData(true);
      setNodes(FALLBACK_NODES);
      setEdges(FALLBACK_EDGES);
      
      // Notify parent with fallback data for analytics
      if (onDataChange) {
        onDataChange(FALLBACK_NODES, FALLBACK_EDGES);
      }
      
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("WebGLMap: Fetching map data from API...");
      
      // Try multiple endpoint paths to find one that works
      let response;
      let endpointUsed;
      
      try {
        // First try the correct endpoint path
        response = await apiClient.get('/map/graph', { signal });
        endpointUsed = '/map/graph';
        console.log("WebGLMap: Successfully fetched data from /map/graph");
      } catch (err1) {
        if (signal.aborted) {
          throw new AppError("Request aborted", ErrorCategory.NETWORK);
        }
        
        console.warn("WebGLMap: Failed to fetch from /map/graph:", err1);
        
        try {
          // Try with hardcoded API v1 path as fallback
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
          const rawResponse = await fetch(`${apiBaseUrl}/api/v1/map/graph`, { signal });
          if (!rawResponse.ok) {
            throw new AppError(
              `HTTP error! status: ${rawResponse.status}`,
              rawResponse.status === 404 ? ErrorCategory.NOT_FOUND : ErrorCategory.SERVER
            );
          }
          response = { data: await rawResponse.json() };
          endpointUsed = 'direct fetch';
          console.log("WebGLMap: Successfully fetched data with direct fetch");
        } catch (err2) {
          if (signal.aborted) {
            throw new AppError("Request aborted", ErrorCategory.NETWORK);
          }
          
          console.error("WebGLMap: Failed with direct fetch:", err2);
          
          // Fall back to mock data in development but show error in production
          if (process.env.NODE_ENV === 'development') {
            console.warn("WebGLMap: Using fallback data in development mode");
            setUsedFallbackData(true);
            setNodes(FALLBACK_NODES);
            setEdges(FALLBACK_EDGES);
            
            if (onDataChange) {
              onDataChange(FALLBACK_NODES, FALLBACK_EDGES);
            }
            
            setIsLoading(false);
            return;
          }
          
          throw new AppError(
            "Failed to fetch map data from all available endpoints", 
            ErrorCategory.NETWORK,
            err2
          );
        }
      }
      
      if (signal.aborted) {
        throw new AppError("Request aborted", ErrorCategory.NETWORK);
      }
      
      console.log(`WebGLMap: Data received from ${endpointUsed}`);
      
      if (response.data && response.data.nodes && response.data.edges) {
        // Validate and sanitize node data to prevent rendering errors
        const validatedNodes = response.data.nodes.map((node: any) => ({
          ...node,
          // Ensure node has required properties with defaults if missing
          type: node.type || MapNodeTypeEnum.USER,
          label: node.label || `Node ${node.id}`,
          data: node.data || {}
        })).filter((node: any) => node.id); // Filter out nodes without IDs
        
        // Validate edges to ensure they reference existing nodes
        const nodeIds = new Set(validatedNodes.map((node: any) => node.id));
        const validatedEdges = response.data.edges
          .filter((edge: any) => edge.source && edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target))
          .map((edge: any) => ({
            source: edge.source,
            target: edge.target,
            type: edge.type || edge.label || MapEdgeTypeEnum.RELATED_TO
          }));
        
        setNodes(validatedNodes);
        setEdges(validatedEdges);
        
        // Notify parent with validated data for analytics
        if (onDataChange) {
          onDataChange(validatedNodes, validatedEdges);
        }
        
        console.log(`WebGLMap: Loaded ${validatedNodes.length} nodes and ${validatedEdges.length} edges`);
        
        // Clear any previous error
        setError(null);
      } else {
        console.warn("WebGLMap: Received empty or invalid data, using fallbacks");
        setUsedFallbackData(true);
        setNodes(FALLBACK_NODES);
        setEdges(FALLBACK_EDGES);
        
        // Notify parent with fallback data
        if (onDataChange) {
          onDataChange(FALLBACK_NODES, FALLBACK_EDGES);
        }
      }

      // Notify parent
      onLoad?.();
    } catch (err: unknown) {
      // Skip error handling if the request was aborted
      if (signal.aborted) {
        return;
      }
      
      // Convert to AppError with appropriate category
      const appError = err instanceof AppError ? err : 
                      createApiError(err, 'loading map data');
      
      console.error("WebGLMap: Error loading map data:", appError);
      
      // Set the structured error for UI rendering
      setError(appError);
      
      // Show a toast notification
      toast({ 
        title: 'Map Loading Error', 
        description: extractErrorMessage(appError, 'Failed to load map data'), 
        status: 'error', 
        duration: 6000, 
        isClosable: true 
      });
      
      // Use fallback data in development
      if (process.env.NODE_ENV === 'development') {
        console.warn("WebGLMap: Using fallback data after error in development mode");
        setUsedFallbackData(true);
        setNodes(FALLBACK_NODES);
        setEdges(FALLBACK_EDGES);
        
        if (onDataChange) {
          onDataChange(FALLBACK_NODES, FALLBACK_EDGES);
        }
      } else {
        // In production, show empty state
        setNodes([]);
        setEdges([]);
        
        if (onDataChange) {
          onDataChange([], []);
        }
      }
    } finally {
      setIsLoading(false);
      requestAbortController.current = null;
    }
  }, [apiClient, checkApiAvailability, onDataChange, onLoad, toast]);

  // On component mount, fetch data
  useEffect(() => {
    fetchMapData();
    
    // Cleanup function to abort any pending requests on unmount
    return () => {
      if (requestAbortController.current) {
        requestAbortController.current.abort();
      }
    };
  }, [fetchMapData]);

  // State for link mode
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [sourceNode, setSourceNode] = useState<MapNode | null>(null);

  // Click handler wrapper for sigma with enhanced error handling
  const handleSigmaNodeClick = useCallback(
    (node: MapNode | null) => {
      try {
        // Prevent refresh errors by ensuring node has required properties
        if (node && !node.type) {
          console.log("Node missing type, using default");
          node.type = MapNodeTypeEnum.USER; // Set a default type if missing
        }
        
        // If in link mode, handle linking logic
        if (isLinkMode && node) {
          if (!sourceNode) {
            // First node selected in link mode
            setSourceNode(node);
            toast({
              title: "Source node selected",
              description: `Select a target node to create a link from "${node.label}"`,
              status: "info",
              duration: 5000,
              isClosable: true,
            });
          } else if (sourceNode.id !== node.id) {
            // Second node selected, create the link
            if (onLinkNodes) {
              try {
                onLinkNodes(sourceNode, node);
              } catch (linkError) {
                console.error("Error creating link between nodes:", linkError);
                toast({
                  title: "Link Creation Error",
                  description: "Failed to create link between nodes",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }
            // Reset link mode
            setIsLinkMode(false);
            setSourceNode(null);
          }
        } else {
          // Normal node click behavior
          if (onNodeClick) {
            onNodeClick(node);
          }
        }
      } catch (err) {
        console.error("Error handling node click:", err);
        toast({
          title: "Error",
          description: "Failed to handle node selection",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [onNodeClick, isLinkMode, sourceNode, onLinkNodes, toast]
  );

  // Toggle link mode
  const toggleLinkMode = useCallback(() => {
    if (isLinkMode) {
      // Cancel link mode
      setIsLinkMode(false);
      setSourceNode(null);
      toast({
        title: "Link mode canceled",
        status: "info",
        duration: 3000,
      });
    } else {
      // Enter link mode
      setIsLinkMode(true);
      toast({
        title: "Link mode activated",
        description: "Select a source node to begin linking",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isLinkMode, toast]);

  // Handler specifically for stage clicks with error handling
  const handleStageClick = useCallback(() => {
    try {
      onNodeClick(null);
    } catch (err) {
      console.error("Error handling stage click:", err);
      // Silently handle error - stage clicks aren't critical
    }
  }, [onNodeClick]);

  // Handler for node hover with delay for tooltip
  const hoveredNodeTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleNodeHover = useCallback((node: MapNode | null, position: { x: number; y: number } | null) => {
    try {
      // Clear any existing timeout
      if (hoveredNodeTimeout.current) {
        clearTimeout(hoveredNodeTimeout.current);
        hoveredNodeTimeout.current = null;
      }
      
      if (node) {
        // Ensure the node has all required properties to prevent UI errors
        const validNode = {
          ...node,
          type: node.type || MapNodeTypeEnum.USER,
          label: node.label || `Node ${node.id}`,
          data: node.data || {}
        };
        
        // Immediately show the tooltip when hovering over a node
        setHoveredNode(validNode);
        setHoveredNodePosition(position);
      } else {
        // Add delay when leaving a node to allow clicking on the tooltip
        hoveredNodeTimeout.current = setTimeout(() => {
          setHoveredNode(null);
          setHoveredNodePosition(null);
        }, 300); // 300ms delay
      }
    } catch (err) {
      console.error("Error handling node hover:", err);
      // Reset state in error case
      setHoveredNode(null);
      setHoveredNodePosition(null);
    }
  }, []);
  
  // Cleanup effect for hover timeout
  useEffect(() => {
    // Cleanup function to clear the timeout when component unmounts
    return () => {
      if (hoveredNodeTimeout.current) {
        clearTimeout(hoveredNodeTimeout.current);
        hoveredNodeTimeout.current = null;
      }
    };
  }, []);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
  }, []);

  const handleZoomChange = useCallback((value: number) => {
    setZoomLevel(value);
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Center view handler
  const handleCenterView = useCallback(() => {
    // Reset to default view
    setZoomLevel(1);
  }, []);

  // Full screen handler with enhanced error handling
  const handleFullScreen = useCallback(() => {
    try {
      const container = document.querySelector('.sigma-container');
      if (!container) return;

      if (!document.fullscreenElement) {
        container.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
          toast({
            title: "Full Screen Error",
            description: "Could not enter full screen mode",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.error("Error attempting to exit full-screen mode:", err);
        });
      }
    } catch (err) {
      console.error("Fullscreen API error:", err);
      toast({
        title: "Browser Support Issue",
        description: "Full screen mode is not supported in your browser",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Create renderer props for SigmaGraphLoader based on analytics settings
  const getRendererProps = useCallback(() => {
    if (analyticsEnabled && analyticsRenderer) {
      try {
        const { createRenderer, metrics, clusters, options } = analyticsRenderer;
        
        // Validate required properties
        if (!metrics || !clusters || !createRenderer) {
          console.warn("Analytics renderer missing required properties");
          return { nodeRenderer: undefined, edgeRenderer: undefined };
        }
        
        // Create node renderer using provided function
        const nodeRenderer = createRenderer(metrics, clusters, options);
        
        // Only create edge renderer if we have the metrics and clusters
        let edgeRenderer;
        try {
          // Only attempt to use edge renderer if metrics and clusters exist
          if (typeof createAnalyticsEdgeRenderer === 'function') {
            edgeRenderer = createAnalyticsEdgeRenderer(metrics, clusters);
          }
        } catch (error) {
          console.error("Error creating edge renderer:", error);
        }
        
        return {
          nodeRenderer,
          edgeRenderer
        };
      } catch (err) {
        console.error("Error setting up analytics renderers:", err);
        return { nodeRenderer: undefined, edgeRenderer: undefined };
      }
    }
    
    // Default renderer when analytics is disabled
    return { nodeRenderer: undefined, edgeRenderer: undefined };
  }, [analyticsEnabled, analyticsRenderer]);

  // Handler to retry loading data
  const handleRetry = useCallback(() => {
    fetchMapData();
  }, [fetchMapData]);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100%" flexDirection="column" gap={4}>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        <Text color="gray.500" fontSize="md">Loading map data...</Text>
      </Box>
    );
  }

  // Error state with fallback UI
  if (error && (!nodes.length || !usedFallbackData)) {
    return (
      <Box 
        p={4} 
        bg={errorBg} 
        borderRadius="md" 
        m={4} 
        maxW="600px" 
        mx="auto"
      >
        <Alert 
          status="error" 
          variant="solid" 
          borderRadius="md" 
          flexDirection="column" 
          alignItems="center"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Map Loading Error
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            <Text mb={4}>{extractErrorMessage(error, 'Failed to load map data')}</Text>
            <VStack spacing={3}>
              <Button colorScheme="white" variant="outline" onClick={handleRetry}>
                Retry Loading
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  onClick={() => {
                    setNodes(FALLBACK_NODES);
                    setEdges(FALLBACK_EDGES);
                    setUsedFallbackData(true);
                    setError(null);
                  }}
                >
                  Use Demo Data
                </Button>
              )}
            </VStack>
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  // Warning banner when using fallback data
  const renderFallbackWarning = () => {
    if (usedFallbackData) {
      return (
        <Alert status="warning" position="absolute" top="0" left="0" right="0" zIndex={1000}>
          <AlertIcon />
          <AlertTitle mr={2}>Using demo data</AlertTitle>
          <AlertDescription>
            Couldn't connect to server. Showing example map data.
          </AlertDescription>
          <Button ml="auto" size="sm" onClick={handleRetry}>Retry</Button>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setUsedFallbackData(false)} />
        </Alert>
      );
    }
    return null;
  };

  // Get renderer functions based on analytics mode
  const rendererProps = getRendererProps();

  return (
    <Box position="absolute" inset="0">
      {renderFallbackWarning()}
      
      <SigmaContainer style={{ width: '100%', height: '100%' }} settings={{ allowInvalidContainer: true }}>
        <SigmaGraphLoader
          nodes={nodes}
          edges={edges}
          onSigmaNodeClick={handleSigmaNodeClick}
          onStageClick={handleStageClick}
          onNodeHover={handleNodeHover}
          zoomLevel={zoomLevel}
          // Add custom renderers for analytics mode
          customNodeRenderer={rendererProps.nodeRenderer}
          customEdgeRenderer={rendererProps.edgeRenderer}
          analyticsEnabled={analyticsEnabled}
        />
        {/* Built-in Sigma Controls - We'll keep these as fallbacks */}
        <ControlsContainer position={'bottom-right'}>
          <LayoutForceAtlas2Control autoRunFor={2000} />
        </ControlsContainer>
      </SigmaContainer>

      {/* Enhanced Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
        onCenter={handleCenterView}
        onFullScreen={handleFullScreen}
        zoomLevel={zoomLevel}
        onZoomChange={handleZoomChange}
        onToggleFilters={onFilterToggle}
        isLinkMode={isLinkMode}
        onToggleLinkMode={toggleLinkMode}
      />

      {/* Enhanced Search Component */}
      <MapSearch
        nodes={nodes}
        onNodeSelect={(nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            handleSigmaNodeClick(node);
          }
        }}
        placeholder="Search nodes..."
      />

      {/* Node Tooltip */}
      {hoveredNode && hoveredNodePosition && (
        <SimpleNodeTooltip
          node={hoveredNode}
          position={hoveredNodePosition}
          onViewDetails={(nodeId) => {
            // Prevent event propagation to avoid map refresh
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              try {
                handleSigmaNodeClick(node);
              } catch (err) {
                console.error("Error handling node click from tooltip:", err);
              }
            }
          }}
        />
      )}

      {/* Color legend - Enhanced with better styling and shapes */}
      <Box
        position="absolute"
        bottom="16px"
        left="16px"
        bg={bg}
        p={3}
        borderRadius="md"
        boxShadow="sm"
        fontSize="xs"
        zIndex={10}
        border="1px solid"
        borderColor={borderColor}
      >
        {/* Entity Types Legend */}
        <Text fontWeight="medium" mb={2}>Entity Types</Text>
        {Object.entries(nodeStyles).map(([key, style]) => (
          <Box key={key} display="flex" alignItems="center" mb={1} _last={{ mb: 0 }}>
            {/* Render shape indicator based on shape type */}
            <Box 
              boxSize="14px" 
              borderRadius={style.shape === 'circle' ? '50%' : 
                           style.shape === 'square' ? '0px' : '50%'} 
              bg={style.color} 
              mr={2} 
              border="1px solid"
              borderColor={style.borderColor || style.color}
              transform={style.shape === 'diamond' ? 'rotate(45deg)' : 
                         style.shape === 'triangle' ? 'translateY(2px)' : 'none'}
            />
            <Text textTransform="capitalize">{key.toLowerCase().replace('_', ' ')}</Text>
          </Box>
        ))}
        
        {/* Relationship Types Legend */}
        <Text fontWeight="medium" mt={3} mb={2}>Relationship Types</Text>
        {/* Only show important relationship types to avoid legend clutter */}
        {[
          MapEdgeTypeEnum.REPORTS_TO,
          MapEdgeTypeEnum.MEMBER_OF,
          MapEdgeTypeEnum.ALIGNED_TO,
          MapEdgeTypeEnum.OWNS,
        ].map(edgeType => {
          // Get style from edgeStyles defined in MapStyles.ts
          const style = edgeStyles[edgeType];
          
          return (
            <Box key={edgeType} display="flex" alignItems="center" mb={1} _last={{ mb: 0 }}>
              <Box display="flex" alignItems="center" w="14px" mr={2}>
                <Box 
                  h="2px" 
                  w="14px" 
                  bg={style.color}
                  position="relative"
                >
                  {/* Arrow for directed edges */}
                  {style.type === 'arrow' && (
                    <Box
                      position="absolute"
                      right="-2px"
                      top="-2px"
                      w="0"
                      h="0"
                      borderTop="3px solid transparent"
                      borderBottom="3px solid transparent"
                      borderLeft={`5px solid ${style.color}`}
                    />
                  )}
                </Box>
              </Box>
              <Text textTransform="capitalize">{edgeType.toLowerCase().replace('_', ' ')}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default WebGLMap;