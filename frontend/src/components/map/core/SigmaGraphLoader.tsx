import React, { useEffect, useState } from 'react';
import { useRegisterEvents, useSigma } from '@react-sigma/core';
import { MapNode, MapEdge } from '../../../types/map';

// Layout types
export type LayoutType = 'circle' | 'random' | 'force' | 'cluster';

// Props for the component
interface SigmaGraphLoaderProps {
  // Graph data
  nodes: MapNode[];
  edges: MapEdge[];
  // Callbacks
  onStageClick?: () => void;
  onSigmaNodeClick?: (node: MapNode) => void;
  onNodeHover?: (node: MapNode | null, position: { x: number, y: number } | null) => void;
  onLinkNodes?: (sourceNode: MapNode, targetNode: MapNode) => void;
  onViewportChange?: (position: { x: number, y: number, zoom: number }) => void;
  onDataChange?: (nodes: MapNode[], edges: MapEdge[]) => void;
  onLoad?: () => void;
  // Rendering options
  zoomLevel?: number;
  layoutType?: LayoutType;
  customNodeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  customEdgeRenderer?: (context: CanvasRenderingContext2D, data: Record<string, unknown>, settings: Record<string, unknown>) => boolean;
  analyticsEnabled?: boolean;
}

/**
 * SigmaGraphLoader Component
 * 
 * This component handles loading graph data into a Sigma instance and sets up interactions.
 */
const SigmaGraphLoader: React.FC<SigmaGraphLoaderProps> = ({
  nodes,
  edges,
  onStageClick,
  onSigmaNodeClick,
  onNodeHover,
  onLinkNodes,
  onViewportChange,
  onDataChange,
  onLoad,
  zoomLevel = 1,
  layoutType = 'force',
  customNodeRenderer,
  customEdgeRenderer,
  analyticsEnabled = false,
}) => {
  // Get Sigma instance from context
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Load graph data into Sigma on mount and when data changes
  useEffect(() => {
    if (!sigma || !nodes || !edges) return;

    // Simple function to reset the graph
    const resetGraph = () => {
      // Clear existing graph
      sigma.getGraph().clear();

      // Add nodes
      nodes.forEach(node => {
        sigma.getGraph().addNode(node.id, {
          ...node,
          x: Math.random(),  // Add simple random positions
          y: Math.random(),
          size: 10,  // Default size
          color: "#69b3a2"  // Default color
        });
      });

      // Add edges
      edges.forEach(edge => {
        if (sigma.getGraph().hasNode(edge.source) && sigma.getGraph().hasNode(edge.target)) {
          sigma.getGraph().addEdge(edge.source, edge.target, {
            ...edge,
            size: 1,
            color: "#ccc"
          });
        }
      });
    };

    // Reset and initialize the graph
    resetGraph();
    sigma.refresh();
    
    // Notify when load is complete
    if (onLoad) {
      onLoad();
    }
    
    // Data has been changed
    if (onDataChange && isInitialized) {
      onDataChange(nodes, edges);
    }
    
    // Mark as initialized after first load
    if (!isInitialized) {
      setIsInitialized(true);
    }

    return () => {
      // Clean up the graph when component unmounts or data changes
    };
  }, [sigma, nodes, edges, onLoad, onDataChange, isInitialized]);

  // Register Sigma events
  useEffect(() => {
    if (!registerEvents) return;

    // Register click event
    registerEvents({
      // Track clicks on the stage (background)
      clickStage: (e) => {
        if (onStageClick) {
          onStageClick();
        }
      },
      // Track clicks on nodes
      clickNode: (e) => {
        if (onSigmaNodeClick) {
          const nodeId = e.node;
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            onSigmaNodeClick(node);
          }
        }
      },
      // Track mouse movements for hover effects
      enterNode: (e) => {
        const nodeId = e.node;
        const node = nodes.find(n => n.id === nodeId);
        if (node && onNodeHover) {
          setHoveredNode(nodeId);
          
          // Get position in viewport coordinates
          const nodePosition = sigma.getNodeDisplayData(nodeId);
          if (nodePosition) {
            // Convert graph coordinates to viewport coordinates
            const viewportPos = sigma.graphToViewport({
              x: nodePosition.x,
              y: nodePosition.y
            });
            
            onNodeHover(node, { x: viewportPos.x, y: viewportPos.y });
          }
        }
      },
      leaveNode: () => {
        setHoveredNode(null);
        if (onNodeHover) {
          onNodeHover(null, null);
        }
      },
      // Track camera changes
      cameraUpdated: (e) => {
        if (onViewportChange) {
          const camera = sigma.getCamera();
          const state = camera.getState();
          
          onViewportChange({
            x: state.x,
            y: state.y,
            zoom: 1 / state.ratio
          });
        }
      }
    });

    return () => {
      // Clean up event listeners
    };
  }, [registerEvents, sigma, nodes, onStageClick, onSigmaNodeClick, onNodeHover, onViewportChange]);

  // Update zoom level when prop changes
  useEffect(() => {
    if (!sigma || !zoomLevel) return;
    
    const camera = sigma.getCamera();
    const currentState = camera.getState();
    
    // Only update if zoom has changed significantly
    if (Math.abs(1 / currentState.ratio - zoomLevel) > 0.01) {
      camera.animate({
        ratio: 1 / zoomLevel
      }, { duration: 300 });
    }
  }, [sigma, zoomLevel]);
  
  // Simplified layout handler
  useEffect(() => {
    if (!sigma || !layoutType) return;
    
    // Apply a basic layout based on the type
    const graph = sigma.getGraph();
    const nodeIds = graph.nodes();
    
    // Use a different layout strategy based on the type
    switch (layoutType) {
      case 'circle':
        // Simple circle layout
        const radius = Math.sqrt(nodeIds.length) * 0.5;
        nodeIds.forEach((nodeId, i) => {
          const angle = (i * 2 * Math.PI) / nodeIds.length;
          graph.setNodeAttribute(nodeId, "x", Math.cos(angle) * radius);
          graph.setNodeAttribute(nodeId, "y", Math.sin(angle) * radius);
        });
        break;
        
      case 'random':
        // Random layout
        nodeIds.forEach((nodeId) => {
          graph.setNodeAttribute(nodeId, "x", Math.random() * 2 - 1);
          graph.setNodeAttribute(nodeId, "y", Math.random() * 2 - 1);
        });
        break;
        
      case 'force':
      case 'cluster':
        // Default force-based layout (placeholder for now)
        break;
    }
    
    sigma.refresh();
  }, [sigma, layoutType]);
  
  // No visible UI in this component - it's just handling the Sigma instance
  return null;
};

export default SigmaGraphLoader;