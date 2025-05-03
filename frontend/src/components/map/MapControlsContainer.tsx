import React, { useState, useCallback } from 'react';
import { Flex, useColorModeValue } from '@chakra-ui/react';
import { MapSearch } from './MapSearch';
import { MapControls } from './MapControls';
import EnhancedMapFilterPanel from './filters/EnhancedMapFilterPanel';
import { useMapData } from './providers/MapDataProvider';
import { useMapFilters } from './providers/MapFiltersManager';
import { useMapViewport } from './providers/MapViewport';
import { useMapInteraction } from './MapInteractionHandler';

// Props for the component
interface MapControlsContainerProps {
  enableFilters?: boolean;
  enableLayers?: boolean;
  enableSettings?: boolean;
  enableLinkMode?: boolean;
  enableAnalytics?: boolean;
  onToggleAnalytics?: () => void;
  analyticsSettings?: {
    heatMapEnabled: boolean;
    clusterBoundariesEnabled: boolean;
    flowVisualizationEnabled: boolean;
    bottlenecksEnabled: boolean;
    currentMetric: string;
  };
  onToggleHeatMap?: () => void;
  onToggleClusterBoundaries?: () => void;
  onToggleFlowVisualization?: () => void;
  onToggleBottlenecks?: () => void;
  onChangeMetric?: (metric: string) => void;
  onNotificationFilterChange?: (params: any) => void;
}

/**
 * MapControlsContainer - Component that organizes map controls, search, and filters
 */
export const MapControlsContainer: React.FC<MapControlsContainerProps> = ({
  enableFilters = true,
  enableLayers = false,
  enableSettings = false,
  enableLinkMode = false,
  enableAnalytics = false,
  onToggleAnalytics,
  analyticsSettings,
  onToggleHeatMap,
  onToggleClusterBoundaries,
  onToggleFlowVisualization,
  onToggleBottlenecks,
  onChangeMetric,
  onNotificationFilterChange,
}) => {
  // Get data and state from contexts
  const { isLoading, loadMapData } = useMapData();
  const { filters, nodeCounts, resetFilters } = useMapFilters();
  const { zoomLevel, setZoomLevel, zoomIn, zoomOut, resetViewport, fullScreen } = useMapViewport();
  const { handleNodeSelect } = useMapInteraction();
  
  // Local state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  
  // Toggle filters panel
  const toggleFilters = useCallback(() => {
    setShowFilterPanel(prev => !prev);
  }, []);
  
  // Toggle link mode
  const toggleLinkMode = useCallback(() => {
    setIsLinkMode(prev => !prev);
  }, []);
  
  // Toggle analytics
  const handleToggleAnalytics = useCallback(() => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabled(newState);
    
    if (onToggleAnalytics) {
      onToggleAnalytics();
    }
  }, [analyticsEnabled, onToggleAnalytics]);
  
  // Handle center on selected node
  const handleCenter = useCallback(() => {
    // This is a simplification - in a full implementation you would center on the selected node
    resetViewport();
  }, [resetViewport]);
  
  return (
    <Flex p={2} bg={bgColor} alignItems="center" position="relative" zIndex={2}>
      {/* Search component */}
      <MapSearch
        nodes={[]} // This should come from the parent component or context
        onNodeSelect={handleNodeSelect}
      />
      
      {/* Filter toggle button and panel */}
      {enableFilters && (
        <>
          <MapControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={loadMapData}
            onCenter={handleCenter}
            onFullScreen={fullScreen}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onToggleFilters={toggleFilters}
            onToggleLayers={enableLayers ? () => {} : undefined}
            onToggleSettings={enableSettings ? () => {} : undefined}
            isLinkMode={isLinkMode}
            onToggleLinkMode={enableLinkMode ? toggleLinkMode : undefined}
            analyticsEnabled={analyticsEnabled}
            onToggleAnalytics={enableAnalytics ? handleToggleAnalytics : undefined}
            onToggleHeatMap={onToggleHeatMap}
            onToggleClusterBoundaries={onToggleClusterBoundaries}
            onToggleFlowVisualization={onToggleFlowVisualization}
            onToggleBottlenecks={onToggleBottlenecks}
            onChangeMetric={onChangeMetric}
            analyticsSettings={analyticsSettings}
            onNotificationFilterChange={onNotificationFilterChange}
          />
          
          {showFilterPanel && (
            <EnhancedMapFilterPanel
              isOpen={showFilterPanel}
              onClose={toggleFilters}
            />
          )}
        </>
      )}
    </Flex>
  );
};

export default MapControlsContainer;