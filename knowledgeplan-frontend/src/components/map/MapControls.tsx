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
}) => {
  const bg = useColorModeValue('surface.500', '#363636'); // White : Lighter button color
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green

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
      </VStack>
    </Box>
  );
};

export default MapControls;
