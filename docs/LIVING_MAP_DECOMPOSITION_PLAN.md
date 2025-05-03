# LivingMap Component Decomposition Plan

## Overview

The LivingMap component is a complex visualization component that manages data fetching, graph rendering, user interactions, and filters. Currently, it handles too many responsibilities, making it harder to maintain and extend. This decomposition plan aims to break it down into smaller, focused components with clear responsibilities.

## Component Analysis

### Current Structure

The LivingMap component currently:
1. Manages map data fetch/reload logic
2. Handles node selection and hover states
3. Manages filtering functionality
4. Controls viewport position and zoom
5. Tracks performance metrics
6. Renders the map UI structure

### Identified Issues

1. **Mixed Concerns**: Data fetching, state management, and rendering are intertwined
2. **Complex Props Interface**: Many props with optional flags and callbacks
3. **Performance Bottlenecks**: Frequent re-renders due to state changes
4. **Testing Challenges**: Difficult to test individual features in isolation
5. **Limited Reusability**: Hard to reuse map functionality in other contexts

## Decomposition Strategy

### New Component Structure

1. **MapDataProvider**: A context provider for handling data fetching and state
2. **MapContainer**: Core layout component handling the map container structure
3. **MapInteractionHandler**: Manages user interactions (clicks, zooms, hovers)
4. **MapControlsContainer**: A container for all map controls
5. **MapViewport**: Manages viewport state (position, zoom)
6. **MapFiltersManager**: Centralizes filter logic and state

### Detailed Component Breakdown

#### 1. MapDataProvider

**Responsibility**: Data fetching, processing, and state management

```tsx
// MapDataProvider.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { MapData, MapPosition } from '../../types/map';
import { useApiClient } from '../../hooks/useApiClient';
import { useLayoutWorker } from '../../hooks/useLayoutWorker';
import { perfume, measureAsync } from '../../utils/performance';

interface MapDataContextType {
  mapData: MapData;
  isLoading: boolean;
  loadMapData: (params?: Record<string, any>) => Promise<void>;
  error: Error | null;
}

export const MapDataContext = createContext<MapDataContextType | undefined>(undefined);

export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (!context) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
};

export const MapDataProvider: React.FC<{
  initialFilters?: Record<string, any>;
  centered?: boolean;
  centerNodeId?: string;
  clusterTeams?: boolean;
  children: React.ReactNode;
}> = ({ initialFilters, centered, centerNodeId, clusterTeams, children }) => {
  // Implementation details...

  return (
    <MapDataContext.Provider value={{ mapData, isLoading, loadMapData, error }}>
      {children}
    </MapDataContext.Provider>
  );
};
```

#### 2. MapContainer

**Responsibility**: Core layout structure and composition of map components

```tsx
// MapContainer.tsx
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { MapDataProvider } from './MapDataProvider';
import { MapViewport } from './MapViewport';
import { MapInteractionHandler } from './MapInteractionHandler';
import { MapControlsContainer } from './MapControlsContainer';
import { MapFiltersManager } from './MapFiltersManager';

export const MapContainer: React.FC<{
  height?: string | number;
  centered?: boolean;
  centerNodeId?: string;
  initialFilters?: Record<string, any>;
  onNodeSelect?: (nodeId: string, nodeType: string) => void;
  clusterTeams?: boolean;
}> = ({
  height = '100%',
  centered = false,
  centerNodeId,
  initialFilters = {},
  onNodeSelect,
  clusterTeams = false,
}) => {
  return (
    <MapDataProvider
      initialFilters={initialFilters}
      centered={centered}
      centerNodeId={centerNodeId}
      clusterTeams={clusterTeams}
    >
      <Flex direction="column" height={height} width="100%">
        <MapControlsContainer />
        <Box flex="1" position="relative">
          <MapViewport>
            <MapInteractionHandler onNodeSelect={onNodeSelect} />
          </MapViewport>
        </Box>
      </Flex>
    </MapDataProvider>
  );
};
```

#### 3. MapInteractionHandler

**Responsibility**: Manages user interactions with the map

```tsx
// MapInteractionHandler.tsx
import React, { useState, useCallback } from 'react';
import { useMapData } from './MapDataProvider';
import { useMapViewport } from './MapViewport';
import { SigmaGraphLoader } from './SigmaGraphLoader';
import { NodeTooltip } from './NodeTooltip';
import type { MapNodeTypeEnum } from '../../types/map';

export const MapInteractionHandler: React.FC<{
  onNodeSelect?: (nodeId: string, nodeType: MapNodeTypeEnum) => void;
}> = ({ onNodeSelect }) => {
  const { mapData } = useMapData();
  const { viewportPosition, setViewportPosition } = useMapViewport();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);

  // Event handlers...

  return (
    <>
      <SigmaGraphLoader
        nodes={mapData.nodes}
        edges={mapData.edges}
        onNodeClick={handleNodeSelect}
        onNodeHover={handleNodeHover}
        onViewportChange={handleViewportChange}
        selectedNodeId={selectedNode}
      />
      
      {hoveredNode && hoveredNodePosition && (
        <NodeTooltip
          nodeId={hoveredNode}
          nodes={mapData.nodes}
          position={hoveredNodePosition}
        />
      )}
    </>
  );
};
```

#### 4. MapControlsContainer

**Responsibility**: Container for map controls and search

```tsx
// MapControlsContainer.tsx
import React from 'react';
import { Flex, useColorModeValue } from '@chakra-ui/react';
import { MapSearch } from './MapSearch';
import { MapControlsPanel } from './MapControlsPanel';
import { MapFiltersPanel } from './filters/MapFiltersPanel';
import { useMapInteraction } from './MapInteractionHandler';
import { useMapData } from './MapDataProvider';

export const MapControlsContainer: React.FC = () => {
  const { isLoading, loadMapData } = useMapData();
  const { handleNodeSelect } = useMapInteraction();

  return (
    <Flex p={2} bg={useColorModeValue('gray.100', 'gray.700')} alignItems="center">
      <MapSearch onNodeSelect={handleNodeSelect} />
      <MapFiltersPanel />
      <MapControlsPanel onReset={() => loadMapData()} isLoading={isLoading} />
    </Flex>
  );
};
```

#### 5. MapViewport

**Responsibility**: Manages map viewport state

```tsx
// MapViewport.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { MapPosition } from '../../types/map';

interface MapViewportContextType {
  viewportPosition: MapPosition | null;
  setViewportPosition: (position: MapPosition) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  resetViewport: () => void;
}

export const MapViewportContext = createContext<MapViewportContextType | undefined>(undefined);

export const useMapViewport = () => {
  const context = useContext(MapViewportContext);
  if (!context) {
    throw new Error('useMapViewport must be used within a MapViewportProvider');
  }
  return context;
};

export const MapViewport: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementation details...

  return (
    <MapViewportContext.Provider 
      value={{ 
        viewportPosition, 
        setViewportPosition, 
        zoomLevel, 
        setZoomLevel, 
        resetViewport 
      }}
    >
      {children}
    </MapViewportContext.Provider>
  );
};
```

#### 6. MapFiltersManager

**Responsibility**: Manages filter state and logic

```tsx
// MapFiltersManager.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MapNodeTypeEnum } from '../../types/map';

interface FiltersState {
  types: MapNodeTypeEnum[];
  statuses: string[];
  clusterTeams: boolean;
}

interface MapFiltersContextType {
  filters: FiltersState;
  setFilters: (newFilters: Partial<FiltersState>) => void;
  toggleNodeType: (type: MapNodeTypeEnum) => void;
  toggleStatus: (status: string) => void;
  toggleClusterTeams: () => void;
  resetFilters: () => void;
}

export const MapFiltersContext = createContext<MapFiltersContextType | undefined>(undefined);

export const useMapFilters = () => {
  const context = useContext(MapFiltersContext);
  if (!context) {
    throw new Error('useMapFilters must be used within a MapFiltersProvider');
  }
  return context;
};

export const MapFiltersManager: React.FC<{
  initialFilters?: Partial<FiltersState>;
  children: React.ReactNode;
}> = ({ initialFilters = {}, children }) => {
  // Implementation details...

  return (
    <MapFiltersContext.Provider
      value={{
        filters,
        setFilters,
        toggleNodeType,
        toggleStatus,
        toggleClusterTeams,
        resetFilters,
      }}
    >
      {children}
    </MapFiltersContext.Provider>
  );
};
```

### Component Relationships

The new component hierarchy would be:

```
MapContainer
├── MapDataProvider (context)
│   ├── MapFiltersManager (context)
│   │   └── MapViewport (context)
│   │       ├── MapControlsContainer
│   │       │   ├── MapSearch
│   │       │   ├── MapFiltersPanel
│   │       │   └── MapControlsPanel
│   │       └── MapInteractionHandler
│   │           ├── SigmaGraphLoader
│   │           └── NodeTooltip
```

## Implementation Plan

### Phase 1: Create Context Providers

1. Create `MapDataProvider` for data fetching and state
2. Create `MapFiltersManager` for filter management
3. Create `MapViewport` for viewport state management

### Phase 2: Extract Interaction Components

1. Extract `MapInteractionHandler` from LivingMap
2. Update `SigmaGraphLoader` to work with the new architecture
3. Create `MapControlsContainer` to manage all control components

### Phase 3: Update Main Component

1. Refactor `LivingMap` to use the new component structure
2. Ensure backward compatibility with the existing API
3. Add proper TypeScript interfaces for all components

### Phase 4: Performance Optimization

1. Apply memoization to prevent unnecessary re-renders
2. Add virtualization for large graph rendering
3. Implement efficient state management with useMemo/useCallback

## Testing Strategy

1. Create unit tests for each context provider
2. Create integration tests for component relationships
3. Create visual regression tests for the rendering
4. Add performance benchmarks for critical operations

## Conclusion

This decomposition plan will transform the LivingMap from a monolithic component to a modular system of focused components. Benefits include:

1. **Better Separation of Concerns**: Each component has a clear responsibility
2. **Improved Testability**: Smaller components are easier to test in isolation
3. **Enhanced Reusability**: Components can be used independently
4. **Better Performance**: Fine-grained control over rendering and updates
5. **Easier Maintenance**: Smaller, focused files are easier to understand and modify

The new architecture also provides clear extension points for future features like time-based visualization, advanced filtering, and analytics integration.