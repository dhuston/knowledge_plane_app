import React, { useEffect, useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { SigmaContainer, useLoadGraph, useSigma, useRegisterEvents } from '@react-sigma/core';
import Graph from 'graphology';
import { useComponentPerformance } from '../../../utils/performance';
import { useMapViewport } from '../providers/MapViewport';
import { useMapData } from '../providers/MapDataProvider';
import { createNodeRenderer } from './renderers/NodeRenderer';
import { createEdgeRenderer } from './renderers/EdgeRenderer';
import { createSpecializedNodeRenderer } from './renderers/SpecializedNodeRenderers';
import { processGraphData } from './utils/graphUtils';
import type { MapNode, MapEdge, MapNodeTypeEnum } from '../../../types/map';

interface EnhancedSigmaGraphProps {
  onNodeClick?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  onNodeHover?: (node: MapNode | null, position: { x: number; y: number } | null) => void;
  onStageClick?: () => void;
  customNodeRenderer?: any;
  customEdgeRenderer?: any;
  analyticsEnabled?: boolean;
}

/**
 * GraphContent - Inner component for Sigma graph content
 * This is separated to access the Sigma hooks that are only available inside SigmaContainer
 */
const GraphContent: React.FC<EnhancedSigmaGraphProps> = ({
  onNodeClick,
  onNodeHover,
  onStageClick,
  customNodeRenderer,
  customEdgeRenderer,
  analyticsEnabled,
}) => {
  // Performance monitoring
  const graphPerformance = useComponentPerformance('GraphContent');
  
  // Get map data and viewport from context
  const { mapData, selectedNode } = useMapData();
  const { zoomLevel, viewportPosition, setViewportPosition } = useMapViewport();
  
  // Access sigma tools
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  
  // Process graph data for rendering
  const graphData = useMemo(() => {
    return processGraphData(mapData.nodes, mapData.edges, {
      zoomLevel,
      selectedNode
    });
  }, [mapData.nodes, mapData.edges, zoomLevel, selectedNode]);
  
  // Load graph data into Sigma
  useEffect(() => {
    graphPerformance.start('loadGraph');
    
    // Create a new graph instance
    const graph = new Graph();
    
    // Add nodes
    graphData.nodes.forEach(node => {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, node.attributes);
      }
    });
    
    // Add edges
    graphData.edges.forEach(edge => {
      const edgeId = `e${edge.source}-${edge.target}`;
      if (!graph.hasEdge(edgeId) && graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdgeWithKey(edgeId, edge.source, edge.target, edge.attributes);
      }
    });
    
    // Load graph into Sigma
    loadGraph(graph);
    graphPerformance.end('loadGraph');
    
    // Apply camera position if available
    if (viewportPosition && sigma.getCamera()) {
      sigma.getCamera().setState({
        x: viewportPosition.x,
        y: viewportPosition.y,
        ratio: 1 / viewportPosition.zoom,
      });
    }
    
  }, [graphData, loadGraph, sigma, viewportPosition, graphPerformance]);
  
  // Create node renderer - use specialized renderers by default
  const nodeRenderer = useMemo(() => {
    return customNodeRenderer || createSpecializedNodeRenderer();
  }, [customNodeRenderer]);
  
  // Create edge renderer
  const edgeRenderer = useMemo(() => {
    return customEdgeRenderer || createEdgeRenderer();
  }, [customEdgeRenderer]);
  
  // Register event handlers
  useEffect(() => {
    if (!sigma) return;
    
    const handleNodeClick = (event: any) => {
      if (!onNodeClick) return;
      
      const nodeId = event.node;
      const graph = sigma.getGraph();
      const nodeType = graph.getNodeAttribute(nodeId, 'type');
      
      if (nodeId && nodeType) {
        onNodeClick(nodeId, nodeType);
      }
    };
    
    const handleNodeHover = (event: any) => {
      if (!onNodeHover) return;
      
      if (event.node) {
        const nodeId = event.node;
        const graph = sigma.getGraph();
        const nodeData = graph.getNodeAttributes(nodeId);
        
        // Find the original node data
        const originalNode = mapData.nodes.find(n => n.id === nodeId);
        
        if (originalNode) {
          // Convert graph coordinates to screen coordinates
          const screenPosition = sigma.graphToViewport({
            x: nodeData.x,
            y: nodeData.y,
          });
          
          onNodeHover(originalNode, screenPosition);
        }
      } else {
        onNodeHover(null, null);
      }
    };
    
    const handleCameraUpdate = () => {
      if (!sigma.getCamera()) return;
      
      const state = sigma.getCamera().getState();
      
      setViewportPosition({
        x: state.x,
        y: state.y,
        zoom: 1 / state.ratio,
      });
    };
    
    // Register all events
    const cleanup = registerEvents({
      clickNode: handleNodeClick,
      enterNode: handleNodeHover,
      leaveNode: () => onNodeHover && onNodeHover(null, null),
      clickStage: onStageClick,
      afterRender: handleCameraUpdate,
    });
    
    return cleanup;
  }, [sigma, registerEvents, onNodeClick, onNodeHover, onStageClick, mapData.nodes, setViewportPosition]);
  
  // Apply settings for renderers and visual styles
  useEffect(() => {
    if (!sigma) return;
    
    sigma.setSetting('nodeReducer', (node, data) => {
      if (node === selectedNode) {
        return {
          ...data,
          highlighted: true,
          size: data.size * 1.2,
          zIndex: 1,
        };
      }
      return data;
    });
    
    sigma.setSetting('edgeReducer', (edge, data) => {
      const [source, target] = sigma.getGraph().extremities(edge);
      if (source === selectedNode || target === selectedNode) {
        return {
          ...data,
          size: data.size * 1.5,
          color: data.color,
        };
      }
      return data;
    });
    
    // Set custom renderers if provided
    if (nodeRenderer) {
      sigma.setSetting('nodeRenderer', nodeRenderer);
    }
    
    if (edgeRenderer) {
      sigma.setSetting('edgeRenderer', edgeRenderer);
    }
    
    // Apply analytics-specific settings if enabled
    if (analyticsEnabled) {
      // Apply any analytics-specific visual settings here
    }
    
  }, [sigma, selectedNode, nodeRenderer, edgeRenderer, analyticsEnabled]);
  
  return null; // This component doesn't render anything directly
};

/**
 * EnhancedSigmaGraph - Wrapper component for the Sigma graph visualization
 */
const EnhancedSigmaGraph: React.FC<EnhancedSigmaGraphProps> = (props) => {
  // Get viewport height for the container
  const { zoomLevel } = useMapViewport();
  
  // Calculate optimal settings based on zoom level
  const settings = useMemo(() => ({
    renderLabels: zoomLevel > 0.6,
    labelSize: 12,
    labelWeight: 'normal',
    defaultNodeColor: '#999',
    defaultEdgeColor: '#ccc',
    defaultNodeType: 'circle',
    defaultEdgeType: 'line',
    labelGridCellSize: 60,
    labelRenderedSizeThreshold: 6,
  }), [zoomLevel]);
  
  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0}>
      <SigmaContainer settings={settings}>
        <GraphContent {...props} />
      </SigmaContainer>
    </Box>
  );
};

export default React.memo(EnhancedSigmaGraph);