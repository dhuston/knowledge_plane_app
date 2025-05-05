/**
 * SigmaGraphLoader.tsx
 * Component that loads graph data into Sigma visualization engine
 * Handles node and edge rendering, interactions, and events
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// Sigma v2 React bindings
import {
  useLoadGraph,
  useRegisterEvents,
  useSigma,
  useSetSettings,
  useCamera,
} from '@react-sigma/core';
import forceAtlas2 from 'graphology-layout-forceatlas2';

// Import worker hook for layout computation
import useLayoutWorker from '../../hooks/useLayoutWorker';

import Graph from 'graphology';
// Sigma types
import type { MouseCoords } from 'sigma/types';

import { MapNode, MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { nodeStyles, edgeStyles, getEdgeStyleByNodeTypes, getAdaptiveNodeSize, getProgressColor, getStatusColor } from './styles/MapStyles';
import createNodeRenderer from './renderers/NodeRenderer';

// Define props interface 
interface SigmaGraphLoaderProps {
  nodes: MapNode[];
  edges: { 
    source: string; 
    target: string; 
    type?: MapEdgeTypeEnum;
  }[];
  onStageClick: () => void;
  onSigmaNodeClick: (node: MapNode) => void;
  onNodeHover: (node: MapNode | null, position: { x: number; y: number } | null) => void;
  zoomLevel: number;
  // New analytics props
  customNodeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  customEdgeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  analyticsEnabled?: boolean;
  // Data change callback for analytics
  onDataChange?: (nodes: MapNode[], edges: { source: string; target: string; type?: MapEdgeTypeEnum }[]) => void;
}

/**
 * SigmaGraphLoader component that handles loading graph data into Sigma
 * and setting up interactivity
 */
const SigmaGraphLoader: React.FC<SigmaGraphLoaderProps> = ({
  nodes,
  edges,
  onStageClick,
  onSigmaNodeClick,
  onNodeHover,
  zoomLevel,
  customNodeRenderer,
  customEdgeRenderer,
  analyticsEnabled = false,
  onDataChange
}) => {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const camera = useCamera();
  const setSettings = useSetSettings();
  const nodeTypeMapRef = useRef<Map<string, MapNodeTypeEnum>>(new Map());
  const childrenMap = useRef<Map<string, Set<string>>>(new Map());
  const collapsedTeams = useRef<Set<string>>(new Set());
  
  // Layout worker for offloading heavy graph layout calculations
  const { computeLayout, isComputing, error: layoutError } = useLayoutWorker();

  // State for hover effects
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Track if large graph detected for optimization
  const [isLargeGraph, setIsLargeGraph] = useState(false);

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

  /**
   * Creates node attributes based on the node type and data
   */
  const createNodeAttributes = useCallback((node: MapNode) => {
    // Get node style based on type
    const style = nodeStyles[node.type] || { 
      color: '#999', 
      baseSize: 10, 
      borderColor: '#777'
    };
    
    // Apply data-driven size adjustments
    let nodeSize = style.baseSize;
    
    // Apply size adaptation based on zoom level
    nodeSize = getAdaptiveNodeSize(nodeSize, zoomLevel);
    
    // Special handling for team sizes based on members (if available)
    if (node.type === MapNodeTypeEnum.TEAM && node.data?.memberCount) {
      const memberCount = Number(node.data.memberCount);
      if (!isNaN(memberCount)) {
        // Scale size slightly based on member count
        nodeSize = nodeSize + Math.min(Math.log2(memberCount) * 1.5, 6);
      }
    }
    
    // Add visualization for completion status for goals and projects
    let statusIndicator = {};
    if (node.type === MapNodeTypeEnum.GOAL && node.data?.progress !== undefined) {
      const progress = Number(node.data.progress);
      if (!isNaN(progress)) {
        // Add progress to be used for custom rendering
        statusIndicator = { 
          progress: progress,
          progressColor: getProgressColor(progress)
        };
      }
    }
    
    // Add status visualization for projects
    if (node.type === MapNodeTypeEnum.PROJECT && node.data?.status) {
      const status = String(node.data.status).toLowerCase();
      // Store status info for reducer
      statusIndicator = {
        status: status,
        statusColor: getStatusColor(status)
      };
    }

    // Handle position data regardless of format
    let xPos = 0, yPos = 0;
    
    // Check if we have position data in any of these formats
    if (node.position && typeof node.position === 'object') {
      // Use position object if available
      xPos = node.position.x || 0;
      yPos = node.position.y || 0;
    } else if (typeof node.x === 'number' && typeof node.y === 'number') {
      // Fall back to direct x,y properties if available
      xPos = node.x;
      yPos = node.y;
    } else {
      // Last resort: use random position
      xPos = (Math.random() - 0.5) * 1000;
      yPos = (Math.random() - 0.5) * 1000;
    }

    return {
      label: node.label,
      size: nodeSize,
      color: style.color,
      entityType: node.type,
      x: xPos,
      y: yPos,
      originalApiData: node, // Store original node data
      borderColor: style.borderColor,
      borderWidth: style.borderWidth || 1,
      shape: style.shape || 'circle', // Add shape from nodeStyles
      pattern: style.pattern || 'solid', // Add pattern from nodeStyles
      ...statusIndicator,
    };
  }, [zoomLevel]);

  // Load graph & compute initial layout
  useEffect(() => {
    console.log(`SigmaGraphLoader: Initializing with ${nodes.length} nodes and ${edges.length} edges`);
    
    if (!loadGraph) {
      console.error("SigmaGraphLoader: loadGraph function is not available");
      return;
    }
    
    try {
      // Create a new graph instance
      const graph = new Graph();
      const nodeTypeMap = nodeTypeMapRef.current;

      // Clear existing maps
      nodeTypeMap.clear();
      childrenMap.current.clear();
      collapsedTeams.current.clear();

      // If we don't have any nodes, don't proceed
      if (nodes.length === 0) {
        console.log("SigmaGraphLoader: No nodes to display");
        // Still load an empty graph to prevent rendering errors
        loadGraph(graph);
        return;
      }

      console.log("SigmaGraphLoader: Adding nodes to graph");
      // Add nodes with enhanced styling based on node styles
      nodes.forEach((node, index) => {
        if (!node.id) {
          console.warn(`Node at index ${index} is missing ID:`, node);
          return; // Skip this node
        }
        
        try {
          // Store node type for reference
          nodeTypeMap.set(node.id, node.type);
          
          if (!graph.hasNode(node.id)) {
            const nodeAttrs = createNodeAttributes(node);
            graph.addNode(node.id, nodeAttrs);

            // Auto-collapse teams initially
            if (node.type === MapNodeTypeEnum.TEAM) {
              collapsedTeams.current.add(node.id);
            }
          }
        } catch (nodeErr) {
          console.error(`Error adding node ${node.id}:`, nodeErr);
        }
      });

      console.log("SigmaGraphLoader: Adding edges to graph");
      // Add edges with improved styling
      edges.forEach((edge, idx) => {
        try {
          const key = `e${idx}`;
          
          // Skip edges with missing source or target
          if (!edge.source || !edge.target) {
            console.warn(`Edge at index ${idx} is missing source or target:`, edge);
            return; // Skip this edge
          }
          
          // Skip edges where source or target doesn't exist in the graph
          if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
            console.warn(`Edge at index ${idx} has invalid source/target nodes:`, edge);
            return; // Skip this edge
          }
          
          if (!graph.hasEdge(key)) {
            // Get relationship type from edge if available
            const edgeType = edge.type as MapEdgeTypeEnum;
            let style = edgeStyles[edgeType];

            // Fallback to infer relationship by node types if no explicit type
            if (!style) {
              const sourceType = nodeTypeMap.get(edge.source);
              const targetType = nodeTypeMap.get(edge.target);

              if (sourceType && targetType) {
                style = getEdgeStyleByNodeTypes(sourceType, targetType);
              } else {
                // Default style if no defined relationship
                style = {
                  color: '#ccc',
                  size: 1,
                  type: 'line'
                };
              }
            }

            graph.addEdgeWithKey(key, edge.source, edge.target, {
              color: style.color,
              size: style.size,
              type: style.type,
              animated: style.animated,
              edgeType: edgeType, // Store the edge type for reference
              hidden: false // ALWAYS show edges by default
            });
          }

          // Build children map: if one end is TEAM and other is not TEAM, record
          const sourceType = nodeTypeMap.get(edge.source);
          const targetType = nodeTypeMap.get(edge.target);
          if (sourceType === MapNodeTypeEnum.TEAM && targetType !== MapNodeTypeEnum.TEAM) {
            if (!childrenMap.current.has(edge.source)) childrenMap.current.set(edge.source, new Set());
            childrenMap.current.get(edge.source)!.add(edge.target);
          } else if (targetType === MapNodeTypeEnum.TEAM && sourceType !== MapNodeTypeEnum.TEAM) {
            if (!childrenMap.current.has(edge.target)) childrenMap.current.set(edge.target, new Set());
            childrenMap.current.get(edge.target)!.add(edge.source);
          }
        } catch (edgeErr) {
          console.error(`Error adding edge at index ${idx}:`, edgeErr);
        }
      });

      console.log("SigmaGraphLoader: Processing collapsed teams");
      // Initially hide children of collapsed teams
      collapsedTeams.current.forEach((teamId) => {
        childrenMap.current.get(teamId)?.forEach((childId) => {
          if (graph.hasNode(childId)) graph.setNodeAttribute(childId, 'hidden', true);
        });
      });

      // Optimize layout based on graph size
      const nodeCount = graph.order; // Number of nodes in graph
      console.log(`SigmaGraphLoader: Preparing layout for ${nodeCount} nodes`);
      
      let iterations = 150;
      const settings = {
        slowDown: 5,
        gravity: 1.5,
        barnesHutOptimize: true,
        linLogMode: true,
        outboundAttractionDistribution: true,
        adjustSizes: true,
      };
      
      // Update large graph flag for future reference
      const isLargeGraphDetected = nodeCount > 200;
      setIsLargeGraph(isLargeGraphDetected);
      
      // Scale down iterations and adjust settings for larger graphs
      if (nodeCount > 500) {
        // For very large graphs, use minimal iterations
        iterations = 50;
        settings.slowDown = 10;
        settings.gravity = 2.0;
      } else if (nodeCount > 200) {
        // For medium graphs, use moderate iterations
        iterations = 100;
        settings.slowDown = 8;
        settings.gravity = 1.8;
      }
      
      console.log("SigmaGraphLoader: Setting initial node positions");
      // Set initial positions for nodes without defined positions
      graph.nodes().forEach((nodeId) => {
        if (!graph.hasNodeAttribute(nodeId, 'x') || !graph.hasNodeAttribute(nodeId, 'y')) {
          // Use a consistent approach for all entity types - pure random positioning
          // This prevents any predetermined layout patterns that might look like mock data
          graph.setNodeAttribute(nodeId, 'x', (Math.random() - 0.5) * 1000);
          graph.setNodeAttribute(nodeId, 'y', (Math.random() - 0.5) * 1000);
        }
      });
      
      // For large graphs, use the web worker for layout computation
      if (isLargeGraphDetected) {
        console.log(`SigmaGraphLoader: Using worker for large graph layout (${nodeCount} nodes)`);
        // loadGraph first for immediate feedback, then update positions
        loadGraph(graph);
        
        // Compute layout in worker
        computeLayout(graph, {
          iterations,
          settings
        }).then(updatedGraph => {
          console.log("SigmaGraphLoader: Worker layout completed successfully");
          // Refresh the sigma instance with updated positions
          if (sigma) sigma.refresh();
        }).catch(err => {
          console.error("SigmaGraphLoader: Worker layout error:", err);
          
          // Fallback to direct calculation if worker fails
          console.warn("SigmaGraphLoader: Falling back to direct layout calculation");
          try {
            forceAtlas2.assign(graph, {
              iterations: iterations / 2, // Reduce iterations in fallback
              settings
            });
            if (sigma) sigma.refresh();
          } catch (fallbackErr) {
            console.error("SigmaGraphLoader: Fallback layout error:", fallbackErr);
          }
        });
        
        // Return early since we're handling this asynchronously
        return;
      }
      
      // For smaller graphs, compute directly
      console.log("SigmaGraphLoader: Computing layout directly");
      console.time('ForceAtlas2 layout');
      try {
        forceAtlas2.assign(graph, {
          iterations,
          settings
        });
        console.timeEnd('ForceAtlas2 layout');
      } catch (layoutErr) {
        console.error("SigmaGraphLoader: Error in layout calculation:", layoutErr);
        console.timeEnd('ForceAtlas2 layout');
      }

      // Now load the positioned graph into Sigma
      console.log("SigmaGraphLoader: Loading graph into Sigma");
      loadGraph(graph);
      
      // Notify parent component about data for analytics
      if (onDataChange && typeof onDataChange === 'function') {
        console.log("SigmaGraphLoader: Notifying parent of data change");
        // Use the original nodes and edges from props for analytics
        onDataChange(nodes, edges);
      }
    } catch (graphErr) {
      console.error("SigmaGraphLoader: Critical error building graph:", graphErr);
    }
  }, [edges, loadGraph, nodes, createNodeAttributes, onDataChange, computeLayout, sigma]);

  // Reference to track when graph is loaded
  const graphLoadedRef = useRef(false);
  
  // Effect to register events and set reducers for hover/interaction
  useEffect(() => {
    // Only proceed if sigma is ready and there's a graph
    if (!sigma) return undefined;
    
    try {
      const graph = sigma.getGraph(); // Get graph instance via useSigma hook
      if (!graph) return undefined; // Exit early if graph isn't ready
      
      // Mark graph as loaded
      graphLoadedRef.current = true;
      
      let dragging = false;
      let draggedNode: string | null = null;

      // Register the events - store the cleanup function
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
            // Get team position once instead of repeatedly
            const teamX = isCollapsed ? null : graph.getNodeAttribute(node, 'x');
            const teamY = isCollapsed ? null : graph.getNodeAttribute(node, 'y');
            
            // Use a batch update approach to minimize graph operations
            const childUpdates = Array.from(children)
              .filter(childId => graph.hasNode(childId))
              .map(childId => {
                const updates: Record<string, any> = {
                  hidden: !isCollapsed
                };
                
                if (!isCollapsed) {
                  // Collapsing - store original position and move to team position
                  updates.originalX = graph.getNodeAttribute(childId, 'x');
                  updates.originalY = graph.getNodeAttribute(childId, 'y');
                  updates.x = teamX;
                  updates.y = teamY;
                } else {
                  // Expanding - restore original positions if available
                  const originalX = graph.getNodeAttribute(childId, 'originalX');
                  const originalY = graph.getNodeAttribute(childId, 'originalY');
                  if (originalX !== undefined && originalY !== undefined) {
                    updates.x = originalX;
                    updates.y = originalY;
                  }
                }
                
                return { id: childId, attributes: updates };
              });
              
            // Apply all updates in a single batch
            childUpdates.forEach(update => {
              Object.entries(update.attributes).forEach(([key, value]) => {
                graph.setNodeAttribute(update.id, key, value);
              });
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

    // Set Reducers for hover effects and node/edge appearance - Combined both setSettings calls into a single one
    setSettings({
      // Node appearance reducer with enhanced visualization
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
          shape?: string;
          pattern?: string;
          progress?: number;
          status?: string;
        };

        // Start with existing data
        const newData = { ...nodeData, highlighted: nodeData.highlighted || false };

        // When analytics is enabled, let standard reducer handle things unless hovering
        if (analyticsEnabled && !hoveredNode) {
          return newData;
        }

        // Get node type and apply base styling
        const nodeType = graph.getNodeAttribute(node, 'entityType') as MapNodeTypeEnum;
        const isCollapsed = graph.getNodeAttribute(node, 'collapsed') || false;

        // Get style information for the node type
        const style = nodeStyles[nodeType] || { 
          color: '#999', 
          baseSize: 10, 
          borderColor: '#777',
          shape: 'circle',
          pattern: 'solid'
        };

        // Apply base color, shape and pattern
        newData.color = style.color;
        newData.shape = style.shape || 'circle';  // Default to circle
        newData.pattern = style.pattern || 'solid'; // Default to solid pattern

        // Apply adaptive sizing for zoom level
        newData.size = getAdaptiveNodeSize(style.baseSize, zoomLevel);

        // Apply border properties from style
        if (style.borderColor) newData.borderColor = style.borderColor;
        if (style.borderWidth) newData.borderWidth = style.borderWidth;

        // Special styling for team nodes based on collapsed state
        if (nodeType === MapNodeTypeEnum.TEAM) {
          // Add a border to indicate collapsed/expanded state
          newData.borderColor = isCollapsed ? '#4A5568' : '#2B6CB0';
          newData.borderWidth = 2;

          // Slightly larger size for collapsed teams (indicating they contain hidden nodes)
          if (isCollapsed) {
            const childCount = childrenMap.current.get(node as string)?.size || 0;
            if (childCount > 0) {
              newData.size = newData.size + Math.min(childCount, 5); // Increase size based on child count, up to a limit
            }
          }
        }

        // Apply data-driven styling for goals and projects
        if (nodeType === MapNodeTypeEnum.GOAL) {
          const progress = graph.getNodeAttribute(node, 'progress');
          if (typeof progress === 'number' && !isNaN(progress)) {
            newData.progress = progress;
            // We'll render the progress indicator in the custom renderer
          }
        }

        if (nodeType === MapNodeTypeEnum.PROJECT) {
          const status = graph.getNodeAttribute(node, 'status');
          if (status) {
            newData.status = status;
            // Status indicator will be shown through the pattern or decoration
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
          edgeType?: MapEdgeTypeEnum;
          animated?: boolean;
        };

        const newData = { ...edgeData, hidden: edgeData.hidden || false };
        const [source, target] = graph.extremities(edge);

        // When analytics is enabled, let standard reducer handle things unless hovering
        if (analyticsEnabled && !hoveredNode) {
          return newData;
        }

        // Ensure we only use supported edge types
        if (newData.type && newData.type !== 'line' && newData.type !== 'arrow') {
          newData.type = 'line'; // Default to line if unsupported type
        }

        // Hide edges connected to hidden nodes
        if (graph.getNodeAttribute(source, 'hidden') || graph.getNodeAttribute(target, 'hidden')) {
          newData.hidden = true;
          return newData;
        }

        // Force edges to always be visible
        newData.hidden = false;
        
        // Always show edges, but apply hover effects when hovering
        if (hoveredNode) {
          if (graph.hasExtremity(edge, hoveredNode)) {
            // Edges connected to hovered node get emphasized
            newData.size = (newData.size || 1) * 1.5;
            newData.color = newData.color || '#666';
                
            // Make important relationships more visible on hover
            const importantTypes = [
              MapEdgeTypeEnum.REPORTS_TO, 
              MapEdgeTypeEnum.LEADS, 
              MapEdgeTypeEnum.OWNS, 
              MapEdgeTypeEnum.ALIGNED_TO
            ];
                
            if (newData.edgeType && importantTypes.includes(newData.edgeType)) {
              // Emphasize important relationships
              newData.size = (newData.size || 1) * 2;
                  
              // Add animation to important connections on hover
              if (!newData.animated) {
                newData.animated = true;
              }
            }
          } else {
            // Other edges get faded but still visible
            newData.color = "#E2E2E280"; // Semi-transparent
            newData.size = (newData.size || 1) * 0.5;
          }
        } else {
          // When not hovering, all edges are visible at default size
          newData.color = newData.color || "#AAAAAA";
          newData.size = newData.size || 1;
          // Force edges to be visible ALWAYS
          newData.hidden = false;
        }

        return newData;
      },
      
      // Use the custom node renderer if provided or fall back to the default
      nodeRenderer: customNodeRenderer || createNodeRenderer(nodeStyles),
      
      // Use the custom edge renderer if provided (or undefined for default)
      edgeRenderer: customEdgeRenderer
    });

      // Return proper cleanup function
      return () => {
        try {
          // Clean up the event registrations
          if (typeof cleanupEvents === 'function') {
            cleanupEvents();
          }
          // Reset variables
          dragging = false;
          draggedNode = null;
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      };
    } catch (error) {
      console.error("Error setting up sigma events:", error);
      // Return empty cleanup function if setup failed
      return () => {
        // Nothing to clean up
      };
    }
  }, [sigma, registerEvents, setSettings, hoveredNode, onSigmaNodeClick, onStageClick, onNodeHover, zoomLevel, customNodeRenderer, customEdgeRenderer, analyticsEnabled]);

  // No visible output from this component - it just connects to Sigma
  return null;
};

export default SigmaGraphLoader;