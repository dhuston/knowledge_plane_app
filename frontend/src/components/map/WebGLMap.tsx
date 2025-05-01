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
import { Box, Spinner, Text, useToast, useDisclosure, useColorModeValue } from '@chakra-ui/react';

// Import custom components
import MapControls from './MapControls';
import MapSearch from './MapSearch';
import NodeTooltip from './NodeTooltip';
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

  // State for map data
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string; type?: MapEdgeTypeEnum }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for enhanced UX
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
  const { isOpen: isFilterOpen, onToggle: onFilterToggle } = useDisclosure();

  // Fetch initial graph (using mock data for demo)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!isMounted) return;

        // Mock nodes data
        // Enhanced mock nodes with relationship data
        const mockNodes: MapNode[] = [
          {
            id: 'user-1',
            type: MapNodeTypeEnum.USER,
            label: 'John Doe',
            data: { 
              name: 'John Doe', 
              title: 'Research Scientist',
              relationships: [
                { type: MapEdgeTypeEnum.MEMBER_OF, nodeId: 'team-1', label: 'Research Team' },
                { type: MapEdgeTypeEnum.OWNS, nodeId: 'asset-1', label: 'Research Paper' }
              ]
            }
          },
          {
            id: 'user-2',
            type: MapNodeTypeEnum.USER,
            label: 'Jane Smith',
            data: { 
              name: 'Jane Smith', 
              title: 'Project Manager',
              relationships: [
                { type: MapEdgeTypeEnum.MEMBER_OF, nodeId: 'team-1', label: 'Research Team' },
                { type: MapEdgeTypeEnum.REPORTS_TO, nodeId: 'user-1', label: 'John Doe' }
              ]
            }
          },
          {
            id: 'team-1',
            type: MapNodeTypeEnum.TEAM,
            label: 'Research Team',
            data: { 
              name: 'Research Team', 
              description: 'Core research team',
              memberCount: 2,
              relationships: [
                { type: MapEdgeTypeEnum.OWNS, nodeId: 'project-1', label: 'AI Research Project' }
              ]
            }
          },
          {
            id: 'project-1',
            type: MapNodeTypeEnum.PROJECT,
            label: 'AI Research Project',
            data: { 
              name: 'AI Research Project', 
              description: 'Advanced AI research initiative',
              status: 'In Progress',
              relationships: [
                { type: MapEdgeTypeEnum.ALIGNED_TO, nodeId: 'goal-1', label: 'Increase Research Output' },
                { type: MapEdgeTypeEnum.RELATED_TO, nodeId: 'asset-1', label: 'Research Paper' }
              ]
            }
          },
          {
            id: 'goal-1',
            type: MapNodeTypeEnum.GOAL,
            label: 'Increase Research Output',
            data: { 
              title: 'Increase Research Output', 
              type: 'team',
              progress: 65,
              relationships: []
            }
          },
          {
            id: 'asset-1',
            type: MapNodeTypeEnum.KNOWLEDGE_ASSET,
            label: 'Research Paper',
            data: { 
              title: 'Research Paper', 
              type: 'DOCUMENT',
              relationships: [
                { type: MapEdgeTypeEnum.RELATED_TO, nodeId: 'project-1', label: 'AI Research Project' }
              ]
            }
          }
        ];

        // Enhanced mock edges with relationship types
        const mockEdges = [
          { source: 'user-1', target: 'team-1', type: MapEdgeTypeEnum.MEMBER_OF },
          { source: 'user-2', target: 'team-1', type: MapEdgeTypeEnum.MEMBER_OF },
          { source: 'team-1', target: 'project-1', type: MapEdgeTypeEnum.OWNS },
          { source: 'project-1', target: 'goal-1', type: MapEdgeTypeEnum.ALIGNED_TO },
          { source: 'user-1', target: 'asset-1', type: MapEdgeTypeEnum.OWNS },
          { source: 'project-1', target: 'asset-1', type: MapEdgeTypeEnum.RELATED_TO },
          { source: 'user-2', target: 'user-1', type: MapEdgeTypeEnum.REPORTS_TO },
        ];

        setNodes(mockNodes);
        setEdges(mockEdges);

        // Notify parent with map data for analytics
        if (onDataChange) {
          onDataChange(mockNodes, mockEdges);
        }

        // Notify parent
        onLoad?.();
      } catch (err: unknown) {
        if (!isMounted) return;

        const msg = err instanceof Error ? err.message : 'Failed to load map data';
        setError(msg);
        toast({ title: 'Error', description: msg, status: 'error', duration: 6000, isClosable: true });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [onLoad, toast, onDataChange]);

  // State for link mode
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [sourceNode, setSourceNode] = useState<MapNode | null>(null);

  // Click handler wrapper for sigma
  const handleSigmaNodeClick = useCallback(
    (node: MapNode | null) => {
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
            onLinkNodes(sourceNode, node);
          }
          // Reset link mode
          setIsLinkMode(false);
          setSourceNode(null);
        }
      } else {
        // Normal node click behavior - wrap in try/catch to prevent crashes
        try {
          onNodeClick(node);
        } catch (err) {
          console.error("Error handling node click:", err);
          // Prevent the error from breaking the UI
        }
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

  // Handler specifically for stage clicks, passed down
  const handleStageClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  // Handler for node hover with delay for tooltip
  const hoveredNodeTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleNodeHover = useCallback((node: MapNode | null, position: { x: number; y: number } | null) => {
    // Clear any existing timeout
    if (hoveredNodeTimeout.current) {
      clearTimeout(hoveredNodeTimeout.current);
      hoveredNodeTimeout.current = null;
    }
    
    if (node) {
      // Immediately show the tooltip when hovering over a node
      setHoveredNode(node);
      setHoveredNodePosition(position);
    } else {
      // Add delay when leaving a node to allow clicking on the tooltip
      hoveredNodeTimeout.current = setTimeout(() => {
        setHoveredNode(null);
        setHoveredNodePosition(null);
      }, 300); // 300ms delay
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
    // We'll also need to reset the camera position in the SigmaGraphLoader
    // This is handled by the zoomLevel effect in SigmaGraphLoader
  }, []);

  // Full screen handler
  const handleFullScreen = useCallback(() => {
    const container = document.querySelector('.sigma-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {
        // Silent error handling for production code
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Create renderer props for SigmaGraphLoader based on analytics settings
  const getRendererProps = useCallback(() => {
    if (analyticsEnabled && analyticsRenderer) {
      const { createRenderer, metrics, clusters, options } = analyticsRenderer;
      
      // Create node renderer using provided function
      const nodeRenderer = createRenderer(metrics, clusters, options);
      
      // Only create edge renderer if we have the metrics and clusters
      let edgeRenderer;
      try {
        // Only attempt to use edge renderer if metrics and clusters exist
        if (metrics && clusters && typeof createAnalyticsEdgeRenderer === 'function') {
          edgeRenderer = createAnalyticsEdgeRenderer(metrics, clusters);
        }
      } catch (error) {
        console.error("Error creating edge renderer:", error);
      }
      
      return {
        nodeRenderer,
        edgeRenderer
      };
    }
    
    // Default renderer when analytics is disabled
    return { nodeRenderer: undefined, edgeRenderer: undefined };
  }, [analyticsEnabled, analyticsRenderer]);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100%">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  // Get renderer functions based on analytics mode
  const rendererProps = getRendererProps();

  return (
    <Box position="relative" width="100%" height="100%">
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
        <NodeTooltip
          node={hoveredNode}
          position={hoveredNodePosition}
          onViewDetails={(nodeId) => {
            // Prevent event propagation to avoid map refresh
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              console.log("Node details clicked:", node.id);
              try {
                handleSigmaNodeClick(node);
              } catch (err) {
                console.error("Error handling node click:", err);
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