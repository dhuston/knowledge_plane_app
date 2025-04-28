import React, { useEffect, useState, useCallback, useRef } from 'react';

// Sigma v2 React bindings
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  ControlsContainer,
  useSigma,
  FullScreenControl,
  useSetSettings,
  ZoomControl,
  useCamera,
} from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import forceAtlas2 from 'graphology-layout-forceatlas2';

import Graph from 'graphology';
// Sigma types
import type { MouseCoords } from 'sigma/types';

import { MapData, MapNode, MapNodeTypeEnum } from '../../types/map';
import { useApiClient } from '../../hooks/useApiClient';
import { Box, Spinner, Text, useToast, useDisclosure, useColorModeValue } from '@chakra-ui/react';

// Import custom components
import MapControls from './MapControls';
import MapSearch from './MapSearch';
import NodeTooltip from './NodeTooltip';

interface WebGLMapProps {
  onNodeClick: (node: MapNode | null) => void;
  onLoad?: () => void;
}

// Provide colors per node type (partial so we don't have to list every type)
const typeColor: Partial<Record<MapNodeTypeEnum, string>> = {
  [MapNodeTypeEnum.USER]: '#3182bd',
  [MapNodeTypeEnum.TEAM]: '#6baed6',
  [MapNodeTypeEnum.PROJECT]: '#fd8d3c',
  [MapNodeTypeEnum.GOAL]: '#74c476',
};

// --- Helper child component --------------------------------------------------

interface SigmaGraphLoaderProps {
  nodes: MapNode[];
  edges: { source: string; target: string }[];
  onStageClick: () => void;
  onSigmaNodeClick: (node: MapNode) => void;
  onNodeHover: (node: MapNode | null, position: { x: number; y: number } | null) => void;
  zoomLevel: number;
}

const SigmaGraphLoader: React.FC<SigmaGraphLoaderProps> = ({
  nodes,
  edges,
  onStageClick,
  onSigmaNodeClick,
  onNodeHover,
  zoomLevel
}) => {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const camera = useCamera();
  const setSettings = useSetSettings();
  const nodeTypeMapRef = useRef<Map<string, MapNodeTypeEnum>>(new Map());
  const childrenMap = useRef<Map<string, Set<string>>>(new Map());
  const collapsedTeams = useRef<Set<string>>(new Set());

  // State for hover effects
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Apply zoom level from props
  useEffect(() => {
    if (camera) {
      // Use the correct camera API method
      camera.goto(
        { ratio: 1 / zoomLevel }, // Convert zoom level to ratio (inverse relationship)
        { duration: 200 }
      );
    }
  }, [zoomLevel, camera]);

  // Load graph & compute initial layout
  useEffect(() => {
    const graph = new Graph();
    const nodeTypeMap = nodeTypeMapRef.current;

    // Clear existing maps
    nodeTypeMap.clear();
    childrenMap.current.clear();
    collapsedTeams.current.clear();

    // Add nodes with improved styling
    nodes.forEach((n) => {
      nodeTypeMap.set(n.id, n.type);
      if (!graph.hasNode(n.id)) {
        // Base size by type
        let nodeSize = 10;
        switch (n.type) {
          case MapNodeTypeEnum.TEAM:
            nodeSize = 15;
            break;
          case MapNodeTypeEnum.DEPARTMENT:
            nodeSize = 18;
            break;
          case MapNodeTypeEnum.PROJECT:
            nodeSize = 12;
            break;
          case MapNodeTypeEnum.GOAL:
            nodeSize = 14;
            break;
          default:
            nodeSize = 10;
        }

        graph.addNode(n.id, {
          label: n.label,
          size: nodeSize,
          color: typeColor[n.type] || '#999',
          entityType: n.type,
          x: n.position?.x ?? Math.random(),
          y: n.position?.y ?? Math.random(),
          originalApiData: n, // Store original node data
          // Add border for certain node types
          borderColor: n.type === MapNodeTypeEnum.GOAL ? '#2C7A7B' : undefined,
          borderWidth: n.type === MapNodeTypeEnum.GOAL ? 2 : 0,
        });

        // Auto-collapse teams initially
        if (n.type === MapNodeTypeEnum.TEAM) {
          collapsedTeams.current.add(n.id);
        }
      }
    });

    // Add edges with improved styling
    edges.forEach((e, idx) => {
      const key = `e${idx}`;
      if (!graph.hasEdge(key)) {
        // Style edges based on relationship type
        const sourceType = nodeTypeMap.get(e.source);
        const targetType = nodeTypeMap.get(e.target);

        let edgeColor = '#ccc';
        let edgeSize = 1;
        let edgeType = 'line'; // Only use 'line' or 'arrow' - 'dashed' is not supported

        // Style based on relationship
        if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.TEAM) {
          edgeColor = '#90CDF4'; // Light blue for team membership
          // Use a lighter color instead of dashed line
          edgeColor = '#BEE3F8';
        } else if (sourceType === MapNodeTypeEnum.PROJECT && targetType === MapNodeTypeEnum.GOAL) {
          edgeColor = '#68D391'; // Green for goal alignment
          edgeSize = 2;
          edgeType = 'arrow';
        } else if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.USER) {
          edgeColor = '#F687B3'; // Pink for user-to-user relationships
          edgeType = 'arrow';
        }

        graph.addEdgeWithKey(key, e.source, e.target, {
          color: edgeColor,
          size: edgeSize,
          type: edgeType
        });
      }

      // Build children map: if one end is TEAM and other is not TEAM, record
      const sourceType = nodeTypeMap.get(e.source);
      const targetType = nodeTypeMap.get(e.target);
      if (sourceType === MapNodeTypeEnum.TEAM && targetType !== MapNodeTypeEnum.TEAM) {
        if (!childrenMap.current.has(e.source)) childrenMap.current.set(e.source, new Set());
        childrenMap.current.get(e.source)!.add(e.target);
      } else if (targetType === MapNodeTypeEnum.TEAM && sourceType !== MapNodeTypeEnum.TEAM) {
        if (!childrenMap.current.has(e.target)) childrenMap.current.set(e.target, new Set());
        childrenMap.current.get(e.target)!.add(e.source);
      }
    });

    // Initially hide children of collapsed teams
    collapsedTeams.current.forEach((teamId) => {
      childrenMap.current.get(teamId)?.forEach((childId) => {
        if (graph.hasNode(childId)) graph.setNodeAttribute(childId, 'hidden', true);
      });
    });

    // Compute a ForceAtlas2 layout synchronously with improved settings
    forceAtlas2.assign(graph, {
      iterations: 150,
      settings: {
        slowDown: 5,
        gravity: 1.5,
        barnesHutOptimize: true,
        linLogMode: true,
        outboundAttractionDistribution: true,
        adjustSizes: true,
      }
    });

    console.log(`[WebGLMap] Graphology graph created. Node count: ${graph.order}, Edge count: ${graph.size}`);

    // Now load the positioned graph into Sigma
    loadGraph(graph);
  }, [edges, loadGraph, nodes, setSettings]);

  // Effect to register events and set reducers for hover/interaction
  useEffect(() => {
    const graph = sigma.getGraph(); // Get graph instance via useSigma hook
    let dragging = false;
    let draggedNode: string | null = null;

    // Register the events
    const cleanupEvents = registerEvents({
      // Mouse enter node - show hover effects and tooltip
      enterNode: ({ node }) => {
        setHoveredNode(node);

        // Get node data for tooltip
        const nodeAttrs = graph.getNodeAttributes(node) as {
          originalApiData?: MapNode;
          x?: number;
          y?: number;
        };

        if (nodeAttrs.originalApiData && typeof nodeAttrs.x === 'number' && typeof nodeAttrs.y === 'number') {
          // Convert graph coordinates to screen coordinates for tooltip positioning
          const screenPosition = sigma.graphToViewport({
            x: nodeAttrs.x,
            y: nodeAttrs.y
          });

          // Pass node data and position to parent for tooltip
          onNodeHover(nodeAttrs.originalApiData, screenPosition);
        }
      },

      // Mouse leave node - hide hover effects and tooltip
      leaveNode: () => {
        setHoveredNode(null);
        onNodeHover(null, null);
      },

      // Click node - handle team expansion/collapse or node selection
      clickNode: ({ node }) => {
        const nodeAttrs = graph.getNodeAttributes(node) as {
          entityType?: MapNodeTypeEnum;
          label?: string;
          originalApiData?: MapNode;
        };

        const type = nodeAttrs.entityType ?? nodeTypeMapRef.current.get(node);

        // Special handling for team nodes - expand/collapse
        if (type === MapNodeTypeEnum.TEAM) {
           const isCollapsed = collapsedTeams.current.has(node as string);
           const children = childrenMap.current.get(node as string);

           if (children) {
                children.forEach((childId) => {
                   if(graph.hasNode(childId)) {
                     // Toggle visibility
                     graph.setNodeAttribute(childId, 'hidden', !isCollapsed);

                     // Animate the transition
                     if (!isCollapsed) {
                       // Collapsing - animate nodes moving to team position
                       const teamX = graph.getNodeAttribute(node, 'x');
                       const teamY = graph.getNodeAttribute(node, 'y');
                       graph.setNodeAttribute(childId, 'originalX', graph.getNodeAttribute(childId, 'x'));
                       graph.setNodeAttribute(childId, 'originalY', graph.getNodeAttribute(childId, 'y'));
                       graph.setNodeAttribute(childId, 'x', teamX);
                       graph.setNodeAttribute(childId, 'y', teamY);
                     } else {
                       // Expanding - restore original positions if available
                       const originalX = graph.getNodeAttribute(childId, 'originalX');
                       const originalY = graph.getNodeAttribute(childId, 'originalY');
                       if (originalX !== undefined && originalY !== undefined) {
                         graph.setNodeAttribute(childId, 'x', originalX);
                         graph.setNodeAttribute(childId, 'y', originalY);
                       }
                     }
                   }
                });
           }

           // Update collapsed state
           if (isCollapsed) collapsedTeams.current.delete(node as string);
           else collapsedTeams.current.add(node as string);

           // Update visual indicator for collapsed/expanded state
           graph.setNodeAttribute(node, 'collapsed', !isCollapsed);

           sigma.refresh(); // Refresh needed after attribute change
        } else {
          // For non-team nodes, pass the original MapNode data back up
          if (nodeAttrs.originalApiData) {
              onSigmaNodeClick(nodeAttrs.originalApiData);
          }
        }
      },

      // Mouse down on node - start dragging
      downNode: ({ node }) => {
          dragging = true;
          draggedNode = node as string;
          if (graph.hasNode(draggedNode)) {
              graph.setNodeAttribute(draggedNode, 'highlighted', true);
              graph.setNodeAttribute(draggedNode, 'zIndex', 1); // Bring to front while dragging
          }
          sigma.refresh();
      },

      // Mouse move - handle node dragging
      mousemove: (e: MouseCoords) => {
          if (dragging && draggedNode && graph.hasNode(draggedNode)) {
              const pos = sigma.viewportToGraph(e);
              graph.setNodeAttribute(draggedNode, 'x', pos.x);
              graph.setNodeAttribute(draggedNode, 'y', pos.y);

              // If dragging a team node, move its collapsed children too
              const nodeType = graph.getNodeAttribute(draggedNode, 'entityType');
              if (nodeType === MapNodeTypeEnum.TEAM && collapsedTeams.current.has(draggedNode)) {
                const children = childrenMap.current.get(draggedNode);
                if (children) {
                  children.forEach(childId => {
                    if (graph.hasNode(childId) && graph.getNodeAttribute(childId, 'hidden')) {
                      graph.setNodeAttribute(childId, 'x', pos.x);
                      graph.setNodeAttribute(childId, 'y', pos.y);
                    }
                  });
                }
              }
          }
      },

      // Mouse up - end dragging
      mouseup: () => {
          if (draggedNode && graph.hasNode(draggedNode)) {
              graph.removeNodeAttribute(draggedNode, 'highlighted');
              graph.removeNodeAttribute(draggedNode, 'zIndex');
              sigma.refresh();
          }
          dragging = false;
          draggedNode = null;
      },

      // Click on empty space - deselect
      clickStage: () => {
        onStageClick();
        onNodeHover(null, null);
      },
    });

    // Set Reducers for hover effects and node/edge appearance
    setSettings({
      // Node appearance reducer
      nodeReducer: (node, data) => {
        // Define type for reducer data matching Sigma's attributes
        const nodeData = data as {
          highlighted?: boolean;
          color?: string;
          size?: number;
          x?: number;
          y?: number;
          zIndex?: number;
          label?: string;
          borderColor?: string;
          borderWidth?: number;
          collapsed?: boolean;
        };

        // Start with existing data
        const newData = { ...nodeData, highlighted: nodeData.highlighted || false };

        // Get node type and apply base styling
        const nodeType = graph.getNodeAttribute(node, 'entityType') as MapNodeTypeEnum;
        const isCollapsed = graph.getNodeAttribute(node, 'collapsed') || false;

        // Apply base color and size
        newData.color = typeColor[nodeType] || '#999';

        // Apply size based on node type
        switch (nodeType) {
          case MapNodeTypeEnum.TEAM:
            newData.size = 15;
            break;
          case MapNodeTypeEnum.DEPARTMENT:
            newData.size = 18;
            break;
          case MapNodeTypeEnum.PROJECT:
            newData.size = 12;
            break;
          case MapNodeTypeEnum.GOAL:
            newData.size = 14;
            break;
          default:
            newData.size = 10;
        }

        // Special styling for team nodes based on collapsed state
        if (nodeType === MapNodeTypeEnum.TEAM) {
          // Add a border to indicate collapsed/expanded state
          newData.borderColor = isCollapsed ? '#4A5568' : '#2B6CB0';
          newData.borderWidth = 2;

          // Slightly larger size for collapsed teams (indicating they contain hidden nodes)
          if (isCollapsed) {
            const childCount = childrenMap.current.get(node as string)?.size || 0;
            if (childCount > 0) {
              newData.size = 15 + Math.min(childCount, 5); // Increase size based on child count, up to a limit
            }
          }
        }

        // Apply hover effects
        if (hoveredNode) {
            if (node === hoveredNode) {
                // Hovered node gets highlighted and slightly larger
                newData.highlighted = true;
                newData.size = newData.size * 1.2;
                newData.zIndex = 1; // Bring to front
            } else if (graph.neighbors(hoveredNode).includes(node)) {
                // Connected nodes get slightly highlighted
                newData.highlighted = true;
            } else {
                // Other nodes get faded out
                newData.color = "#E2E2E2";
                newData.highlighted = false;
            }
        }

        return newData;
      },

      // Edge appearance reducer
      edgeReducer: (edge, data) => {
        const edgeData = data as {
          hidden?: boolean;
          color?: string;
          size?: number;
          label?: string;
          type?: string;
        };

        const newData = { ...edgeData, hidden: edgeData.hidden || false };
        const [source, target] = graph.extremities(edge);

        // Ensure we only use supported edge types
        if (newData.type && newData.type !== 'line' && newData.type !== 'arrow') {
          newData.type = 'line'; // Default to line if unsupported type
        }

        // Hide edges connected to hidden nodes
        if (graph.getNodeAttribute(source, 'hidden') || graph.getNodeAttribute(target, 'hidden')) {
            newData.hidden = true;
            return newData;
        }

        // Apply hover effects
        if (hoveredNode) {
            if (graph.hasExtremity(edge, hoveredNode)) {
                // Edges connected to hovered node get emphasized
                newData.size = (newData.size || 1) * 1.5;
                newData.color = newData.color || '#666';
            } else {
                // Other edges get hidden or faded
                newData.hidden = true;
            }
        }

        return newData;
      },
    });

    return cleanupEvents;
  }, [sigma, registerEvents, setSettings, hoveredNode, onSigmaNodeClick, onStageClick, onNodeHover]);

  return null;
};

// ----------------------------------------------------------------------------

const WebGLMap: React.FC<WebGLMapProps> = ({ onNodeClick, onLoad }) => {
  const apiClient = useApiClient();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // State for map data
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for enhanced UX
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
  const { isOpen: isFilterOpen, onToggle: onFilterToggle } = useDisclosure();

  // Fetch initial graph
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get<MapData>('/map/data');

        if (!isMounted) return;

        setNodes(res.data.nodes);
        setEdges(res.data.edges.map((e) => ({ source: e.source, target: e.target })));

        // Notify parent
        onLoad?.();
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error('Error loading graph', err);
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
  }, [apiClient, onLoad, toast]);

  // Click handler wrapper for sigma
  const handleSigmaNodeClick = useCallback(
    (node: MapNode | null) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  // Handler specifically for stage clicks, passed down
  const handleStageClick = useCallback(() => {
    onNodeClick(null);
  }, [onNodeClick]);

  // Handler for node hover
  const handleNodeHover = useCallback((node: MapNode | null, position: { x: number; y: number } | null) => {
    setHoveredNode(node);
    setHoveredNodePosition(position);
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
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

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
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              handleSigmaNodeClick(node);
            }
          }}
        />
      )}

      {/* Color legend - Enhanced with better styling */}
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
        <Text fontWeight="medium" mb={2}>Node Types</Text>
        {Object.entries(typeColor).map(([key, color]) => (
          <Box key={key} display="flex" alignItems="center" mb={1} _last={{ mb: 0 }}>
            <Box boxSize="12px" borderRadius="50%" bg={color} mr={2} />
            <Text textTransform="capitalize">{key.toLowerCase()}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WebGLMap;