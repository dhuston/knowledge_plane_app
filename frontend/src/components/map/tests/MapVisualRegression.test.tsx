/**
 * MapVisualRegression.test.tsx
 * Visual regression tests for map components
 * 
 * These tests ensure that map components render correctly without visual regressions
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import MapContainer from '../MapContainer';
import { visualSnapshot } from '../../../test-utils/visualRegression';

// Mock API client
jest.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({
      data: {
        nodes: [
          {
            id: 'user1',
            label: 'User One',
            type: 'user',
            position: { x: 0, y: 0 }
          },
          {
            id: 'team1',
            label: 'Team Alpha',
            type: 'team',
            position: { x: 100, y: 0 }
          },
          {
            id: 'project1',
            label: 'Project X',
            type: 'project',
            data: { status: 'active', progress: 75 },
            position: { x: 0, y: 100 }
          },
          {
            id: 'goal1',
            label: 'Q3 Goal',
            type: 'goal',
            data: { progress: 50, priority: 'high' },
            position: { x: 100, y: 100 }
          }
        ],
        edges: [
          { source: 'user1', target: 'team1', type: 'MEMBER_OF' },
          { source: 'user1', target: 'project1', type: 'PARTICIPATES_IN' },
          { source: 'team1', target: 'project1', type: 'OWNS' },
          { source: 'project1', target: 'goal1', type: 'ALIGNED_TO' }
        ]
      }
    })
  })
}));

// Mock layout worker
jest.mock('../../../hooks/useLayoutWorker', () => ({
  useLayoutWorker: () => ({
    processMapData: jest.fn((data) => Promise.resolve(data))
  })
}));

// Mock Sigma components
jest.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sigma-container" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  ),
  useLoadGraph: () => jest.fn(),
  useSigma: () => ({
    getGraph: () => ({
      nodes: () => ['user1', 'team1', 'project1', 'goal1'],
      edges: () => ['e1', 'e2', 'e3', 'e4'],
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
  useCamera: () => ({
    goto: jest.fn(),
    animatedReset: jest.fn(),
    getState: () => ({ x: 0, y: 0, ratio: 1 }),
  }),
  useSetSettings: () => jest.fn(),
}));

// Mock performance utilities
jest.mock('../../../utils/performance', () => ({
  perfume: {
    start: jest.fn(),
    end: jest.fn()
  },
  useComponentPerformance: () => ({
    start: jest.fn(),
    end: jest.fn()
  }),
  measureAsync: jest.fn((label, fn) => fn())
}));

// Visual regression test suite
describe('Map Component Visual Regression', () => {
  
  /**
   * Setup test environment with providers and container
   */
  const setupTest = (props = {}) => {
    return render(
      <ChakraProvider>
        <div style={{ width: '800px', height: '600px' }}>
          <MapContainer 
            height="600px"
            {...props}
          />
        </div>
      </ChakraProvider>
    );
  };
  
  /**
   * Test default map rendering
   */
  test('Map renders with default settings', async () => {
    const { container } = setupTest();
    
    // Ensure Sigma container is rendered
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    
    // Take visual snapshot
    await visualSnapshot(container, 'map-default');
  });
  
  /**
   * Test map with filters enabled
   */
  test('Map renders with filters enabled', async () => {
    const { container } = setupTest({
      enableFilters: true
    });
    
    // Take visual snapshot
    await visualSnapshot(container, 'map-with-filters');
  });
  
  /**
   * Test map with analytics enabled
   */
  test('Map renders with analytics enabled', async () => {
    const { container } = setupTest({
      enableAnalytics: true
    });
    
    // Take visual snapshot
    await visualSnapshot(container, 'map-with-analytics');
  });
  
  /**
   * Test map centered on a specific node
   */
  test('Map renders centered on a node', async () => {
    const { container } = setupTest({
      centered: true,
      centerNodeId: 'user1'
    });
    
    // Take visual snapshot
    await visualSnapshot(container, 'map-centered-on-node');
  });
  
  /**
   * Test map with custom filters applied
   */
  test('Map renders with custom filters', async () => {
    const { container } = setupTest({
      initialFilters: {
        types: ['user', 'team'],
        statuses: ['active']
      }
    });
    
    // Take visual snapshot
    await visualSnapshot(container, 'map-with-custom-filters');
  });
});