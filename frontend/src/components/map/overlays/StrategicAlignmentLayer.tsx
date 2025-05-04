import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import MisalignmentOverlay from './MisalignmentOverlay';
import { MapOverlay } from '../../../types/strategic_alignment';

interface StrategicAlignmentLayerProps {
  sigma: any; // Sigma instance
  visibleNodes: number[];
  onMisalignmentClick?: (nodeId: number, misalignmentData: any) => void;
}

/**
 * Component that manages all strategic alignment overlays on the map
 * Renders misalignment indicators and handles data fetching
 */
const StrategicAlignmentLayer: React.FC<StrategicAlignmentLayerProps> = ({
  sigma,
  visibleNodes,
  onMisalignmentClick
}) => {
  const [overlays, setOverlays] = useState<MapOverlay[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all misalignment data for the map when visible nodes change
  useEffect(() => {
    const fetchMisalignments = async () => {
      if (!visibleNodes.length || loading) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/v1/strategic-alignment/map/misalignments/');
        const data = await response.json();
        
        if (data && data.overlays) {
          // Filter to only include overlays for visible nodes
          const visibleOverlays = data.overlays.filter(
            (overlay: MapOverlay) => visibleNodes.includes(overlay.node_id)
          );
          setOverlays(visibleOverlays);
        }
      } catch (error) {
        console.error("Error fetching misalignment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMisalignments();
  }, [visibleNodes, loading]);

  // Group overlays by node ID and type for efficient rendering
  const groupedOverlays: Record<string, MapOverlay[]> = {};
  overlays.forEach(overlay => {
    const key = `${overlay.node_id}_${overlay.node_type}`;
    if (!groupedOverlays[key]) {
      groupedOverlays[key] = [];
    }
    groupedOverlays[key].push(overlay);
  });

  return (
    <Box position="absolute" top={0} left={0} width="100%" height="100%" pointerEvents="none">
      {/* Render overlays for each node */}
      {Object.entries(groupedOverlays).map(([nodeKey, nodeOverlays]) => {
        const [nodeId, nodeType] = nodeKey.split('_');
        
        // We only need one overlay per node, since MisalignmentOverlay will 
        // fetch the specific data it needs
        return (
          <Box key={nodeKey} pointerEvents="auto">
            <MisalignmentOverlay
              nodeId={parseInt(nodeId)}
              nodeType={nodeType}
              sigma={sigma}
              onMisalignmentClick={onMisalignmentClick}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default StrategicAlignmentLayer;