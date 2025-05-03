import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { MapPosition } from '../../../types/map';

// Define the context type
interface MapViewportContextType {
  viewportPosition: MapPosition | null;
  setViewportPosition: (position: MapPosition) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  centerOnNode: (nodeId: string) => void;
  fullScreen: () => void;
  isFullScreen: boolean;
  maxZoom: number;
  minZoom: number;
}

// Create the context
export const MapViewportContext = createContext<MapViewportContextType | undefined>(undefined);

// Default settings
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

// Props for the provider component
interface MapViewportProviderProps {
  children: ReactNode;
  initialZoom?: number;
  initialPosition?: MapPosition;
}

/**
 * MapViewport - Context provider component for managing map viewport state
 */
export const MapViewportProvider: React.FC<MapViewportProviderProps> = ({
  children,
  initialZoom = DEFAULT_ZOOM,
  initialPosition = null,
}) => {
  // State
  const [zoomLevel, setZoomLevelState] = useState(initialZoom);
  const [viewportPosition, setViewportPositionState] = useState<MapPosition | null>(initialPosition);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Keep track of the last viewport update time to throttle updates
  const lastViewportUpdate = useRef(0);
  
  // Reference to map container element
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Set zoom level with bounds checking
  const setZoomLevel = useCallback((zoom: number) => {
    const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    setZoomLevelState(boundedZoom);
  }, []);
  
  // Set viewport position with throttling
  const setViewportPosition = useCallback((position: MapPosition) => {
    // Throttle viewport updates to avoid excessive API calls
    const now = Date.now();
    if (!viewportPosition || now - lastViewportUpdate.current > 500) {
      setViewportPositionState(position);
      lastViewportUpdate.current = now;
    }
  }, [viewportPosition]);
  
  // Zoom in by one step
  const zoomIn = useCallback(() => {
    setZoomLevel(Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP));
  }, [zoomLevel, setZoomLevel]);
  
  // Zoom out by one step
  const zoomOut = useCallback(() => {
    setZoomLevel(Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP));
  }, [zoomLevel, setZoomLevel]);
  
  // Reset viewport to default position and zoom
  const resetViewport = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
    setViewportPositionState(null);
  }, [setZoomLevel]);
  
  // Center on a specific node (placeholder - actual implementation needs SigmaGraph reference)
  const centerOnNode = useCallback((nodeId: string) => {
    // This is a placeholder - actual implementation depends on Sigma API
    console.log(`Center on node: ${nodeId}`);
    
    // In a real implementation, you would:
    // 1. Find the node's position in the graph
    // 2. Use Sigma's camera to animate to that position
  }, []);
  
  // Toggle fullscreen mode
  const fullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen().then(() => {
          setIsFullScreen(true);
        }).catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit full-screen mode: ${err.message}`);
        });
      }
    }
  }, []);
  
  // Listen for fullscreen changes from other sources
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Expose the context value
  const contextValue: MapViewportContextType = {
    viewportPosition,
    setViewportPosition,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetViewport,
    centerOnNode,
    fullScreen,
    isFullScreen,
    maxZoom: MAX_ZOOM,
    minZoom: MIN_ZOOM,
  };
  
  return (
    <MapViewportContext.Provider value={contextValue}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {children}
      </div>
    </MapViewportContext.Provider>
  );
};

// Custom hook for accessing the map viewport context
export const useMapViewport = (): MapViewportContextType => {
  const context = useContext(MapViewportContext);
  
  if (context === undefined) {
    throw new Error('useMapViewport must be used within a MapViewportProvider');
  }
  
  return context;
};