import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  VStack,
  HStack,
  useColorModeValue,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Switch,
} from '@chakra-ui/react';
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiRefreshCw,
  FiHome,
  FiFilter,
  FiLayers,
  FiSettings,
  FiLink
} from 'react-icons/fi';
import { 
  MdOutlineAnalytics, 
  MdOutlineHub, 
  MdGroupWork, 
  MdTimeline, 
  MdWarning,
  MdMap // Using MdMap instead of MdHeatmap which doesn't exist
} from 'react-icons/md';
import { FaBell } from 'react-icons/fa';
import NotificationMapFilter from './notifications/NotificationMapFilter';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onCenter: () => void;
  onFullScreen: () => void;
  zoomLevel: number;
  onZoomChange: (value: number) => void;
  onToggleFilters?: () => void;
  onToggleLayers?: () => void;
  onToggleSettings?: () => void;
  isLinkMode?: boolean;
  onToggleLinkMode?: () => void;
  
  // Analytics-related props
  analyticsEnabled?: boolean;
  onToggleAnalytics?: () => void;
  onToggleHeatMap?: () => void;
  onToggleClusterBoundaries?: () => void;
  onToggleFlowVisualization?: () => void;
  onToggleBottlenecks?: () => void;
  onChangeMetric?: (metric: string) => void;
  analyticsSettings?: {
    heatMapEnabled: boolean;
    clusterBoundariesEnabled: boolean;
    flowVisualizationEnabled: boolean;
    bottlenecksEnabled: boolean;
    currentMetric: string;
  };
  
  // Notification-related props
  onNotificationFilterChange?: (params: {
    enabled: boolean;
    type?: string;
    severity?: string;
    includeRead: boolean;
  }) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onCenter,
  onFullScreen,
  zoomLevel,
  onZoomChange,
  onToggleFilters,
  onToggleLayers,
  onToggleSettings,
  isLinkMode = false,
  onToggleLinkMode,
  analyticsEnabled = false,
  onToggleAnalytics,
  onToggleHeatMap,
  onToggleClusterBoundaries,
  onToggleFlowVisualization,
  onToggleBottlenecks,
  onChangeMetric,
  analyticsSettings = {
    heatMapEnabled: false,
    clusterBoundariesEnabled: false,
    flowVisualizationEnabled: false,
    bottlenecksEnabled: false,
    currentMetric: 'betweenness'
  },
  onNotificationFilterChange
}) => {
  const bg = useColorModeValue('surface.500', '#363636'); // White : Lighter button color
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
  const analyticsColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box
      position="absolute"
      right="16px"
      top="50%"
      transform="translateY(-50%)"
      bg={bg}
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
      p={2}
      zIndex={10}
    >
      <VStack spacing={2}>
        {/* Zoom Controls */}
        <Tooltip label="Zoom In (+ or Scroll Up)" placement="left">
          <IconButton
            aria-label="Zoom In"
            icon={<FiZoomIn />}
            size="sm"
            variant="mapControl"
            onClick={onZoomIn}
          />
        </Tooltip>

        {/* Zoom Slider */}
        <Popover trigger="hover" placement="left">
          <PopoverTrigger>
            <Box height="60px" width="24px" cursor="pointer">
              <Slider
                orientation="vertical"
                min={0.1}
                max={2}
                step={0.1}
                value={zoomLevel}
                onChange={onZoomChange}
              >
                <SliderTrack bg="primary.300">
                  <SliderFilledTrack bg="#262626" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </PopoverTrigger>
          <PopoverContent width="100px">
            <PopoverArrow />
            <PopoverBody>
              <Text fontSize="sm">Zoom: {Math.round(zoomLevel * 100)}%</Text>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        <Tooltip label="Zoom Out (- or Scroll Down)" placement="left">
          <IconButton
            aria-label="Zoom Out"
            icon={<FiZoomOut />}
            size="sm"
            variant="mapControl"
            onClick={onZoomOut}
          />
        </Tooltip>

        <Divider />

        {/* Navigation Controls */}
        <Tooltip label="Center View" placement="left">
          <IconButton
            aria-label="Center View"
            icon={<FiHome />}
            size="sm"
            variant="mapControl"
            onClick={onCenter}
          />
        </Tooltip>

        <Tooltip label="Reset Layout" placement="left">
          <IconButton
            aria-label="Reset Layout"
            icon={<FiRefreshCw />}
            size="sm"
            variant="mapControl"
            onClick={onReset}
          />
        </Tooltip>

        <Tooltip label="Full Screen (F)" placement="left">
          <IconButton
            aria-label="Full Screen"
            icon={<FiMaximize />}
            size="sm"
            variant="mapControl"
            onClick={onFullScreen}
          />
        </Tooltip>

        <Divider />

        {/* Link Mode Toggle */}
        {onToggleLinkMode && (
          <Tooltip label={isLinkMode ? "Cancel Link Mode" : "Link Mode"} placement="left">
            <IconButton
              aria-label="Link Mode"
              icon={<FiLink />}
              size="sm"
              variant="mapControl"
              colorScheme={isLinkMode ? "blue" : undefined}
              onClick={onToggleLinkMode}
            />
          </Tooltip>
        )}

        {/* Notification Filter */}
        {onNotificationFilterChange && (
          <NotificationMapFilter onFilterChange={onNotificationFilterChange} />
        )}

        {/* Additional Controls */}
        {onToggleFilters && (
          <Tooltip label="Filters" placement="left">
            <IconButton
              aria-label="Filters"
              icon={<FiFilter />}
              size="sm"
              variant="mapControl"
              onClick={onToggleFilters}
            />
          </Tooltip>
        )}

        {onToggleLayers && (
          <Tooltip label="Layers" placement="left">
            <IconButton
              aria-label="Layers"
              icon={<FiLayers />}
              size="sm"
              variant="mapControl"
              onClick={onToggleLayers}
            />
          </Tooltip>
        )}

        {onToggleSettings && (
          <Tooltip label="Settings" placement="left">
            <IconButton
              aria-label="Settings"
              icon={<FiSettings />}
              size="sm"
              variant="mapControl"
              onClick={onToggleSettings}
            />
          </Tooltip>
        )}
        
        {/* Analytics Controls */}
        {onToggleAnalytics && (
          <>
            <Divider />
            
            <Tooltip label={analyticsEnabled ? "Analytics Options" : "Enable Analytics"} placement="left">
              <Box>
                <Menu closeOnSelect={false} placement="left">
                  <MenuButton
                    as={IconButton}
                    aria-label="Analytics"
                    icon={<MdOutlineAnalytics />}
                    size="sm"
                    variant="mapControl"
                    color={analyticsEnabled ? analyticsColor : undefined}
                    onClick={!analyticsEnabled ? onToggleAnalytics : undefined}
                  />
                  
                  {analyticsEnabled && (
                    <MenuList minWidth="240px">
                      <MenuItem closeOnSelect={false} command={
                        <Switch 
                          isChecked={analyticsSettings.heatMapEnabled} 
                          onChange={onToggleHeatMap} 
                          size="sm" 
                        />
                      }>
                        <HStack>
                          <MdMap />
                          <Text>Heat Map Overlay</Text>
                        </HStack>
                      </MenuItem>
                      
                      <MenuItem closeOnSelect={false} command={
                        <Switch 
                          isChecked={analyticsSettings.clusterBoundariesEnabled} 
                          onChange={onToggleClusterBoundaries} 
                          size="sm" 
                        />
                      }>
                        <HStack>
                          <MdGroupWork />
                          <Text>Cluster Boundaries</Text>
                        </HStack>
                      </MenuItem>
                      
                      <MenuItem closeOnSelect={false} command={
                        <Switch 
                          isChecked={analyticsSettings.flowVisualizationEnabled} 
                          onChange={onToggleFlowVisualization} 
                          size="sm" 
                        />
                      }>
                        <HStack>
                          <MdTimeline />
                          <Text>Flow Visualization</Text>
                        </HStack>
                      </MenuItem>
                      
                      <MenuItem closeOnSelect={false} command={
                        <Switch 
                          isChecked={analyticsSettings.bottlenecksEnabled} 
                          onChange={onToggleBottlenecks} 
                          size="sm" 
                        />
                      }>
                        <HStack>
                          <MdWarning />
                          <Text>Highlight Bottlenecks</Text>
                        </HStack>
                      </MenuItem>
                      
                      <MenuDivider />
                      
                      <Text px={3} py={1} fontSize="xs" fontWeight="medium" color="gray.500">
                        Metric:
                      </Text>
                      
                      <MenuItem 
                        onClick={() => onChangeMetric && onChangeMetric('betweenness')}
                        icon={<Box w={4} h={4} bg={analyticsSettings.currentMetric === 'betweenness' ? analyticsColor : 'transparent'} borderRadius="full" />}
                      >
                        Betweenness Centrality
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => onChangeMetric && onChangeMetric('closeness')}
                        icon={<Box w={4} h={4} bg={analyticsSettings.currentMetric === 'closeness' ? analyticsColor : 'transparent'} borderRadius="full" />}
                      >
                        Closeness Centrality
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => onChangeMetric && onChangeMetric('degree')}
                        icon={<Box w={4} h={4} bg={analyticsSettings.currentMetric === 'degree' ? analyticsColor : 'transparent'} borderRadius="full" />}
                      >
                        Degree Centrality
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => onChangeMetric && onChangeMetric('eigenvector')}
                        icon={<Box w={4} h={4} bg={analyticsSettings.currentMetric === 'eigenvector' ? analyticsColor : 'transparent'} borderRadius="full" />}
                      >
                        Eigenvector Centrality
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => onChangeMetric && onChangeMetric('clustering')}
                        icon={<Box w={4} h={4} bg={analyticsSettings.currentMetric === 'clustering' ? analyticsColor : 'transparent'} borderRadius="full" />}
                      >
                        Clustering Coefficient
                      </MenuItem>
                    </MenuList>
                  )}
                </Menu>
              </Box>
            </Tooltip>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default MapControls;
