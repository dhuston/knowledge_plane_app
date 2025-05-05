import React, { useState, useEffect, useCallback } from 'react';
import SimpleNodeTooltip from './SimpleNodeTooltip';
import { MapNode } from '../../types/map';

interface NodeTooltipProps {
  nodeId: string;
  nodes: MapNode[];
}

/**
 * NodeTooltip - A wrapper around SimpleNodeTooltip that adapts to the existing API
 * in the LivingMap component. This maintains backward compatibility while using
 * the new simplified implementation.
 */
export const NodeTooltip: React.FC<NodeTooltipProps> = ({ nodeId, nodes }) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [node, setNode] = useState<MapNode | null>(null);

  // Find the node from the nodes array
  useEffect(() => {
    const foundNode = nodes.find(n => n.id === nodeId);
    if (foundNode) {
      setNode(foundNode);
    } else {
      setNode(null);
    }
  }, [nodeId, nodes]);

  // Track mouse position for tooltip placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handler to open the node details
  const handleViewDetails = useCallback((nodeId: string) => {
    // This is a placeholder - in a real implementation you would navigate or open details panel
    console.log(`View details for node ${nodeId}`);
  }, []);

  return <SimpleNodeTooltip node={node} position={position} onViewDetails={handleViewDetails} />;
};

export default NodeTooltip;