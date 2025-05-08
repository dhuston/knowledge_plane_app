/**
 * MapControls.tsx
 * Standardized control panel for the map component
 */

import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  VStack,
  HStack,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus, FiMinus, FiRefreshCw, FiMaximize2, FiHome, FiGrid, FiCircle, FiTarget, FiLayout } from 'react-icons/fi';
import { LayoutType } from '../layouts';

interface MapControlsProps {
  /** Zoom in handler */
  onZoomIn?: () => void;
  /** Zoom out handler */
  onZoomOut?: () => void;
  /** Reset view handler */
  onReset?: () => void;
  /** Center view handler */
  onCenter?: () => void;
  /** Full screen handler */
  onFullScreen?: () => void;
  /** Current zoom level */
  zoomLevel?: number;
  /** Zoom level change handler */
  onZoomChange?: (level: number) => void;
  /** Current layout type */
  layoutType?: LayoutType;
  /** Layout change handler */
  onLayoutChange?: (layout: LayoutType) => void;
  /** Loading indicator */
  isLoading?: boolean;
}

/**
 * Standard control panel for map interactions
 */
const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onCenter,
  onFullScreen,
  zoomLevel = 1,
  onZoomChange,
  layoutType = 'cluster',
  onLayoutChange,
  isLoading = false,
}) => {
  // Styling
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      position="absolute"
      right={4}
      top="30%"
      bg={bg}
      borderRadius="md"
      boxShadow="md"
      border="1px solid"
      borderColor={borderColor}
      p={2}
      zIndex={10}
      data-testid="map-controls"
    >
      <VStack spacing={2}>
        {/* Zoom controls */}
        <Tooltip label="Zoom In" placement="left">
          <IconButton
            icon={<FiPlus />}
            aria-label="Zoom In"
            size="sm"
            onClick={onZoomIn}
            isDisabled={isLoading}
          />
        </Tooltip>
        
        <Tooltip label="Zoom Out" placement="left">
          <IconButton
            icon={<FiMinus />}
            aria-label="Zoom Out"
            size="sm"
            onClick={onZoomOut}
            isDisabled={isLoading}
          />
        </Tooltip>
        
        <Divider />
        
        {/* Reset/center controls */}
        <Tooltip label="Center View" placement="left">
          <IconButton
            icon={<FiHome />}
            aria-label="Center View"
            size="sm"
            onClick={onCenter}
            isDisabled={isLoading}
          />
        </Tooltip>
        
        <Tooltip label="Reset View" placement="left">
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Reset View"
            size="sm"
            onClick={onReset}
            isDisabled={isLoading}
            isLoading={isLoading}
          />
        </Tooltip>
        
        <Divider />
        
        {/* Layout selection */}
        {onLayoutChange && (
          <Menu closeOnSelect placement="left-start">
            <Tooltip label="Change Layout" placement="left">
              <MenuButton
                as={IconButton}
                icon={<FiLayout />}
                aria-label="Change Layout"
                size="sm"
                isDisabled={isLoading}
              />
            </Tooltip>
            <MenuList>
              <MenuItem 
                icon={<FiGrid />} 
                isDisabled={layoutType === 'grid'}
                onClick={() => onLayoutChange('grid')}
              >
                Grid Layout
              </MenuItem>
              <MenuItem 
                icon={<FiCircle />} 
                isDisabled={layoutType === 'circular'}
                onClick={() => onLayoutChange('circular')}
              >
                Circular Layout
              </MenuItem>
              <MenuItem 
                icon={<FiTarget />} 
                isDisabled={layoutType === 'radial'}
                onClick={() => onLayoutChange('radial')}
              >
                Radial Layout
              </MenuItem>
              <MenuItem 
                icon={<FiLayout />}
                isDisabled={layoutType === 'cluster'}
                onClick={() => onLayoutChange('cluster')}
              >
                Cluster Layout
              </MenuItem>
              <MenuItem 
                icon={<FiLayout />}
                isDisabled={layoutType === 'forceAtlas2'}
                onClick={() => onLayoutChange('forceAtlas2')}
              >
                Force Atlas 2
              </MenuItem>
            </MenuList>
          </Menu>
        )}
        
        {/* Full screen button */}
        {onFullScreen && (
          <Tooltip label="Toggle Fullscreen" placement="left">
            <IconButton
              icon={<FiMaximize2 />}
              aria-label="Toggle Fullscreen"
              size="sm"
              onClick={onFullScreen}
              isDisabled={isLoading}
            />
          </Tooltip>
        )}
      </VStack>
    </Box>
  );
};

export default MapControls;