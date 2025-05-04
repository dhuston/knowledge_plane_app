import React, { useEffect, useState } from 'react';
import { Badge, Box, Tooltip } from '@chakra-ui/react';
import { WarningIcon, InfoIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { MapOverlay } from '../../../types/strategic_alignment';
import { MisalignmentSeverity, MisalignmentType } from '../../../types/strategic_alignment';

interface MisalignmentOverlayProps {
  nodeId: number;
  nodeType: string;
  sigma: any; // Sigma instance
  onMisalignmentClick?: (nodeId: number, misalignmentData: any) => void;
}

/**
 * Component that renders misalignment indicators on map nodes
 */
const MisalignmentOverlay: React.FC<MisalignmentOverlayProps> = ({
  nodeId,
  nodeType,
  sigma,
  onMisalignmentClick
}) => {
  const [overlayData, setOverlayData] = useState<MapOverlay | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Fetch misalignment data for this node
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/v1/strategic-alignment/map/misalignments/?node_id=${nodeId}&node_type=${nodeType}`);
        const data = await response.json();
        
        // Find the relevant overlay for this node
        if (data && data.overlays) {
          const nodeOverlay = data.overlays.find(
            (o: MapOverlay) => o.node_id === nodeId && o.node_type === nodeType
          );
          if (nodeOverlay) {
            setOverlayData(nodeOverlay);
          }
        }
      } catch (error) {
        console.error("Error fetching misalignment data:", error);
      }
    };

    fetchData();
  }, [nodeId, nodeType]);

  // Update position when sigma updates
  useEffect(() => {
    if (!sigma || !overlayData) return;

    const updatePosition = () => {
      const nodeDisplayData = sigma.getNodeDisplayData(nodeId);
      if (nodeDisplayData) {
        setPosition({
          x: nodeDisplayData.x,
          y: nodeDisplayData.y - nodeDisplayData.size - 10 // Position above the node
        });
      }
    };

    // Initial position update
    updatePosition();

    // Listen for sigma render events to update position
    sigma.on('render', updatePosition);

    return () => {
      sigma.off('render', updatePosition);
    };
  }, [sigma, nodeId, overlayData]);

  // If no overlay data for this node, don't render anything
  if (!overlayData) return null;

  // Determine the icon based on severity
  const getIcon = (severity: string) => {
    switch (severity) {
      case MisalignmentSeverity.CRITICAL:
      case MisalignmentSeverity.HIGH:
        return <WarningIcon color="red.500" />;
      case MisalignmentSeverity.MEDIUM:
        return <WarningIcon color="orange.500" />;
      case MisalignmentSeverity.LOW:
      default:
        return <InfoIcon color="blue.500" />;
    }
  };

  // Determine color based on severity
  const getColor = (severity: string) => {
    switch (severity) {
      case MisalignmentSeverity.CRITICAL:
        return "red.500";
      case MisalignmentSeverity.HIGH:
        return "red.400";
      case MisalignmentSeverity.MEDIUM:
        return "orange.400";
      case MisalignmentSeverity.LOW:
      default:
        return "blue.400";
    }
  };

  // Get label for misalignment type
  const getMisalignmentLabel = (type: string) => {
    switch (type) {
      case MisalignmentType.UNALIGNED_PROJECT:
        return "Unaligned Project";
      case MisalignmentType.CONFLICTING_GOALS:
        return "Conflicting Goals";
      case MisalignmentType.RESOURCE_MISALLOCATION:
        return "Resource Misallocation";
      case MisalignmentType.STRATEGIC_GAP:
        return "Strategic Gap";
      case MisalignmentType.DUPLICATED_EFFORT:
        return "Duplicated Effort";
      default:
        return "Misalignment";
    }
  };

  // Handle click on misalignment indicator
  const handleClick = () => {
    if (onMisalignmentClick && overlayData) {
      onMisalignmentClick(nodeId, overlayData.overlay_data);
    }
  };

  return (
    <Tooltip
      label={`${getMisalignmentLabel(overlayData.overlay_data.type)}: ${overlayData.overlay_data.description}`}
      placement="top"
      hasArrow
    >
      <Box
        position="absolute"
        left={`${position.x}px`}
        top={`${position.y}px`}
        transform="translate(-50%, -50%)"
        zIndex={10}
        cursor="pointer"
        onClick={handleClick}
      >
        <Badge 
          colorScheme={getColor(overlayData.overlay_data.severity)} 
          borderRadius="full"
          boxShadow="0px 0px 5px rgba(0,0,0,0.3)"
          display="flex"
          alignItems="center"
          padding="2px 5px"
        >
          {getIcon(overlayData.overlay_data.severity)}
        </Badge>
      </Box>
    </Tooltip>
  );
};

export default MisalignmentOverlay;