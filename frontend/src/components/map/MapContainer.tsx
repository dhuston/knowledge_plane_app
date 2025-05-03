import React, { memo, useCallback, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { MapDataProvider } from './providers/MapDataProvider';
import { MapFiltersManager } from './providers/MapFiltersManager';
import { MapViewportProvider } from './providers/MapViewport';
import { MapInteractionHandler } from './MapInteractionHandler';
import MapControlsContainer from './MapControlsContainer';
import { useComponentPerformance } from '../../utils/performance';
import type { MapNodeTypeEnum } from '../../types/map';

interface MapContainerProps {
  height?: string | number;
  centered?: boolean;
  centerNodeId?: string;
  initialFilters?: {
    types?: MapNodeTypeEnum[];
    statuses?: string[];
  };
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
  clusterTeams?: boolean;
  enableFilters?: boolean;
  enableLayers?: boolean;
  enableAnalytics?: boolean;
  customNodeRenderer?: any;
  customEdgeRenderer?: any;
}

/**
 * MapContainer - Main component for the Living Map visualization
 *
 * This component combines all the map subcomponents and context providers
 * to create a complete map visualization experience.
 */
const MapContainer: React.FC<MapContainerProps> = ({
  height = '100%',
  centered = false,
  centerNodeId,
  initialFilters = {},
  onNodeSelect,
  clusterTeams = false,
  enableFilters = true,
  enableLayers = false,
  enableAnalytics = false,
  customNodeRenderer,
  customEdgeRenderer,
}) => {
  // Performance monitoring
  const mapPerformance = useComponentPerformance('MapContainer');
  
  // Analytics state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [analyticsSettings, setAnalyticsSettings] = useState({
    heatMapEnabled: false,
    clusterBoundariesEnabled: false,
    flowVisualizationEnabled: false,
    bottlenecksEnabled: false,
    currentMetric: 'betweenness'
  });
  
  // Analytics handlers
  const toggleAnalytics = useCallback(() => {
    setAnalyticsEnabled(prev => !prev);
  }, []);
  
  const toggleHeatMap = useCallback(() => {
    setAnalyticsSettings(prev => ({
      ...prev,
      heatMapEnabled: !prev.heatMapEnabled
    }));
  }, []);
  
  const toggleClusterBoundaries = useCallback(() => {
    setAnalyticsSettings(prev => ({
      ...prev,
      clusterBoundariesEnabled: !prev.clusterBoundariesEnabled
    }));
  }, []);
  
  const toggleFlowVisualization = useCallback(() => {
    setAnalyticsSettings(prev => ({
      ...prev,
      flowVisualizationEnabled: !prev.flowVisualizationEnabled
    }));
  }, []);
  
  const toggleBottlenecks = useCallback(() => {
    setAnalyticsSettings(prev => ({
      ...prev,
      bottlenecksEnabled: !prev.bottlenecksEnabled
    }));
  }, []);
  
  const changeMetric = useCallback((metric: string) => {
    setAnalyticsSettings(prev => ({
      ...prev,
      currentMetric: metric
    }));
  }, []);
  
  // Start performance measurement on mount
  React.useEffect(() => {
    mapPerformance.start();
    return () => mapPerformance.end();
  }, [mapPerformance]);
  
  return (
    <MapDataProvider
      initialFilters={initialFilters}
      centered={centered}
      centerNodeId={centerNodeId}
      clusterTeams={clusterTeams}
      onNodeSelect={onNodeSelect}
    >
      <MapFiltersManager initialFilters={{
        types: initialFilters.types || [],
        statuses: initialFilters.statuses || ['active', 'planning'],
        clusterTeams,
        depth: 1
      }}>
        <MapViewportProvider>
          <Flex direction="column" height={height} width="100%">
            <MapControlsContainer
              enableFilters={enableFilters}
              enableLayers={enableLayers}
              enableAnalytics={enableAnalytics}
              onToggleAnalytics={toggleAnalytics}
              analyticsSettings={analyticsSettings}
              onToggleHeatMap={toggleHeatMap}
              onToggleClusterBoundaries={toggleClusterBoundaries}
              onToggleFlowVisualization={toggleFlowVisualization}
              onToggleBottlenecks={toggleBottlenecks}
              onChangeMetric={changeMetric}
            />
            <Box flex="1" position="relative">
              <MapInteractionHandler
                onNodeSelect={onNodeSelect}
                analyticsEnabled={analyticsEnabled}
                customNodeRenderer={customNodeRenderer}
                customEdgeRenderer={customEdgeRenderer}
              />
            </Box>
          </Flex>
        </MapViewportProvider>
      </MapFiltersManager>
    </MapDataProvider>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(MapContainer);