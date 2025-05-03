import React, { useState, useCallback, createContext, useContext } from 'react';
import { useMapData } from './providers/MapDataProvider';
import { useMapViewport } from './providers/MapViewport';
import { NodeTooltip } from './NodeTooltip';
import EnhancedSigmaGraph from './graph/EnhancedSigmaGraph';
import type { MapNode, MapNodeTypeEnum, MapPosition } from '../../types/map';

// Define the interaction context type
interface MapInteractionContextType {
  hoveredNode: string | null;
  hoveredNodeData: MapNode | null;
  hoveredPosition: { x: number; y: number } | null;
  handleNodeSelect: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  handleStageClick: () => void;
}

// Create the context
export const MapInteractionContext = createContext<MapInteractionContextType | undefined>(undefined);

// Props for the component
interface MapInteractionHandlerProps {
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  graphSettings?: Record<string, any>;
  analyticsEnabled?: boolean;
  customNodeRenderer?: any;
  customEdgeRenderer?: any;
}

/**
 * MapInteractionHandler - Component that manages user interactions with the map
 */
export const MapInteractionHandler: React.FC<MapInteractionHandlerProps> = ({
  onNodeSelect,
  graphSettings = {},
  analyticsEnabled = false,
  customNodeRenderer,
  customEdgeRenderer,
}) => {
  // Get map data and viewport from context
  const { mapData, selectedNode, setSelectedNode } = useMapData();
  const { viewportPosition, setViewportPosition, zoomLevel } = useMapViewport();
  
  // State for hover effects
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<MapNode | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string, nodeType: MapNodeTypeEnum) => {
    setSelectedNode(nodeId);
    
    // Also call the external handler if provided
    if (onNodeSelect) {
      onNodeSelect(nodeId, nodeType);
    }
  }, [onNodeSelect, setSelectedNode]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node: MapNode | null, position: { x: number; y: number } | null) => {
    if (node) {
      setHoveredNode(node.id);
      setHoveredNodeData(node);
      setHoveredPosition(position);
    } else {
      setHoveredNode(null);
      setHoveredNodeData(null);
      setHoveredPosition(null);
    }
  }, []);
  
  // Handle viewport change
  const handleViewportChange = useCallback((position: MapPosition) => {
    setViewportPosition(position);
  }, [setViewportPosition]);
  
  // Handle stage click (background)
  const handleStageClick = useCallback(() => {
    setSelectedNode(null);
    setHoveredNode(null);
    setHoveredNodeData(null);
    setHoveredPosition(null);
  }, [setSelectedNode]);
  
  // Default graph settings merged with props
  const defaultGraphSettings = {
    nodeSizeMultiplier: 1.5,
    edgeThickness: 1.2,
    animationDuration: 300,
    ...graphSettings,
  };
  
  // Expose interaction context
  const interactionContextValue: MapInteractionContextType = {
    hoveredNode,
    hoveredNodeData,
    hoveredPosition,
    handleNodeSelect,
    handleStageClick
  };
  
  return (
    <MapInteractionContext.Provider value={interactionContextValue}>
      {/* Use our new EnhancedSigmaGraph component */}
      <EnhancedSigmaGraph
        onNodeClick={handleNodeSelect}
        onNodeHover={handleNodeHover}
        onStageClick={handleStageClick}
        customNodeRenderer={customNodeRenderer}
        customEdgeRenderer={customEdgeRenderer}
        analyticsEnabled={analyticsEnabled}
      />
      
      {hoveredNodeData && hoveredPosition && (
        <NodeTooltip
          node={hoveredNodeData}
          position={hoveredPosition}
          onViewDetails={(nodeId) => {
            if (hoveredNodeData) {
              handleNodeSelect(nodeId, hoveredNodeData.type);
            }
          }}
        />
      )}
    </MapInteractionContext.Provider>
  );
};

// Custom hook for accessing the map interaction context
export const useMapInteraction = (): MapInteractionContextType => {
  const context = useContext(MapInteractionContext);
  
  if (context === undefined) {
    throw new Error('useMapInteraction must be used within a MapInteractionHandler');
  }
  
  return context;
};