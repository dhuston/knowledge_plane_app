import React from 'react';
import { render, screen } from '@testing-library/react';
import EnhancedSigmaGraph from '../EnhancedSigmaGraph';
import { MapDataProvider } from '../../providers/MapDataProvider';
import { MapViewportProvider } from '../../providers/MapViewport';
import { MapNodeTypeEnum } from '../../../../types/map';

// Mock Sigma modules
jest.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sigma-container">{children}</div>
  ),
  useLoadGraph: () => jest.fn(),
  useSigma: () => ({
    getGraph: () => ({
      nodes: () => ['node1', 'node2'],
      edges: () => ['edge1', 'edge2'],
      getNodeAttribute: () => ({}),
      extremities: () => ['node1', 'node2'],
    }),
    getCamera: () => ({
      getState: () => ({ x: 0, y: 0, ratio: 1 }),
      setState: jest.fn(),
    }),
    graphToViewport: () => ({ x: 100, y: 100 }),
    setSetting: jest.fn(),
  }),
  useRegisterEvents: () => jest.fn(() => jest.fn()),
}));

// Mock API client
jest.mock('../../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({
      data: {
        nodes: [
          {
            id: 'node1',
            label: 'User 1',
            type: 'user',
            position: { x: 100, y: 100 },
          },
          {
            id: 'node2',
            label: 'Team 1',
            type: 'team',
            position: { x: 200, y: 200 },
          },
        ],
        edges: [
          {
            source: 'node1',
            target: 'node2',
            type: 'MEMBER_OF',
          },
        ],
      },
    }),
  }),
}));

// Mock layout worker
jest.mock('../../../../hooks/useLayoutWorker', () => ({
  useLayoutWorker: () => ({
    processMapData: jest.fn((data) => Promise.resolve(data)),
  }),
}));

// Mock performance utils
jest.mock('../../../../utils/performance', () => ({
  perfume: {
    start: jest.fn(),
    end: jest.fn(),
  },
  measureAsync: jest.fn((label, fn) => fn()),
  useComponentPerformance: () => ({
    start: jest.fn(),
    end: jest.fn(),
  }),
}));

describe('EnhancedSigmaGraph', () => {
  const mockNodeClick = jest.fn();
  const mockNodeHover = jest.fn();
  const mockStageClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Basic render test
  test('renders within context providers', () => {
    render(
      <MapDataProvider>
        <MapViewportProvider>
          <EnhancedSigmaGraph
            onNodeClick={mockNodeClick}
            onNodeHover={mockNodeHover}
            onStageClick={mockStageClick}
          />
        </MapViewportProvider>
      </MapDataProvider>
    );
    
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
  });
  
  // Test analytics mode
  test('renders with analytics enabled', () => {
    render(
      <MapDataProvider>
        <MapViewportProvider>
          <EnhancedSigmaGraph
            onNodeClick={mockNodeClick}
            onNodeHover={mockNodeHover}
            onStageClick={mockStageClick}
            analyticsEnabled={true}
          />
        </MapViewportProvider>
      </MapDataProvider>
    );
    
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
  });
  
  // Test with custom renderers
  test('renders with custom renderers', () => {
    const customNodeRenderer = () => true;
    const customEdgeRenderer = () => true;
    
    render(
      <MapDataProvider>
        <MapViewportProvider>
          <EnhancedSigmaGraph
            onNodeClick={mockNodeClick}
            onNodeHover={mockNodeHover}
            onStageClick={mockStageClick}
            customNodeRenderer={customNodeRenderer}
            customEdgeRenderer={customEdgeRenderer}
          />
        </MapViewportProvider>
      </MapDataProvider>
    );
    
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
  });
});