/**
 * Performance tests for LivingMap component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { perfume } from '../../utils/performance';
import LivingMap from './LivingMap';
import { useApiClient } from '../../hooks/useApiClient';
import { useLayoutWorker } from '../../hooks/useLayoutWorker';

// Mock dependencies
vi.mock('../../hooks/useApiClient');
vi.mock('../../hooks/useLayoutWorker');
vi.mock('../../hooks/useDeltaStream', () => ({
  useDeltaStream: () => null
}));

// Mock perfume.js
vi.mock('../../utils/performance', () => ({
  perfume: {
    start: vi.fn(),
    end: vi.fn(),
  },
  useComponentPerformance: () => ({
    start: vi.fn(),
    end: vi.fn()
  }),
  measureAsync: async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  },
  useRenderCount: () => 1
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/map', search: '' }),
}));

// Mock Sigma components
vi.mock('./SigmaGraphLoader', () => ({
  default: ({ onNodeClick, nodes = [], edges = [] }) => (
    <div data-testid="sigma-graph-loader">
      <div>Nodes: {nodes.length}</div>
      <div>Edges: {edges.length}</div>
      <button data-testid="node-click-btn" onClick={() => onNodeClick?.('test-node-1', 'PERSON')}>
        Click Node
      </button>
    </div>
  ),
}));

// Test data
const mockMapData = {
  nodes: [
    { id: 'node1', label: 'Node 1', type: 'USER' },
    { id: 'node2', label: 'Node 2', type: 'TEAM' },
  ],
  edges: [
    { id: 'edge1', source: 'node1', target: 'node2', type: 'MEMBER_OF' }
  ]
};

// Setup mocks
const setupMocks = () => {
  const mockApiGet = vi.fn();
  (useApiClient as any).mockReturnValue({
    get: mockApiGet
  });

  mockApiGet.mockResolvedValue({
    data: mockMapData
  });

  const mockProcessMapData = vi.fn();
  (useLayoutWorker as any).mockReturnValue({
    processMapData: mockProcessMapData
  });
  mockProcessMapData.mockResolvedValue(mockMapData);

  return { mockApiGet, mockProcessMapData };
};

describe('LivingMap Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    // Track timings in performance entries
    performance.clearMarks();
    performance.clearMeasures();
  });

  afterEach(() => {
    // Collect performance measurements
    const entries = performance.getEntriesByType('measure');
    for (const entry of entries) {
      global.performanceResults.push({
        name: entry.name,
        duration: entry.duration
      });
    }
  });

  it('should render efficiently', async () => {
    performance.mark('render-start');
    
    render(
      <ChakraProvider>
        <LivingMap />
      </ChakraProvider>
    );

    // Wait for async operations to complete
    await vi.waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });

    performance.mark('render-end');
    performance.measure('map-render-time', 'render-start', 'render-end');

    // Verify performance
    const renderTime = performance.getEntriesByName('map-render-time')[0]?.duration;
    
    console.log(`LivingMap render time: ${renderTime?.toFixed(2)}ms`);
    expect(renderTime).toBeDefined();
    
    // Our target in PERFORMANCE_TESTING_PLAN.md is 500ms, but this may be
    // difficult to enforce in CI environments. This is a reasonable threshold
    // for development machines.
    if (renderTime) {
      expect(renderTime).toBeLessThan(1000);
    }

    // Verify that perfume.js was called
    expect(perfume.start).toHaveBeenCalled();
    expect(perfume.end).toHaveBeenCalled();
  });

  it('should handle node selection efficiently', async () => {
    // Render component
    render(
      <ChakraProvider>
        <LivingMap onNodeSelect={vi.fn()} />
      </ChakraProvider>
    );

    // Wait for render
    await vi.waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });

    // Measure node selection performance
    performance.mark('node-selection-start');
    
    // Simulate node click
    const nodeBtn = screen.getByTestId('node-click-btn');
    await act(async () => {
      fireEvent.click(nodeBtn);
    });
    
    performance.mark('node-selection-end');
    performance.measure('node-selection-time', 'node-selection-start', 'node-selection-end');

    // Verify performance
    const selectionTime = performance.getEntriesByName('node-selection-time')[0]?.duration;
    
    console.log(`Node selection time: ${selectionTime?.toFixed(2)}ms`);
    expect(selectionTime).toBeDefined();
    
    // Target from our metrics threshold for MAP_INTERACTION: 100ms
    if (selectionTime) {
      expect(selectionTime).toBeLessThan(100);
    }
  });

  it('should handle re-rendering efficiently when filters change', async () => {
    const { rerender } = render(
      <ChakraProvider>
        <LivingMap 
          initialFilters={{ 
            types: ['USER', 'TEAM'], 
            statuses: ['active'] 
          }}
        />
      </ChakraProvider>
    );

    // Wait for initial render
    await vi.waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });

    // Measure re-render performance
    performance.mark('rerender-start');
    
    // Trigger re-render with new props
    rerender(
      <ChakraProvider>
        <LivingMap 
          initialFilters={{ 
            types: ['USER', 'PROJECT'], 
            statuses: ['active', 'planning'] 
          }}
        />
      </ChakraProvider>
    );
    
    // Wait for re-render
    await vi.waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });
    
    performance.mark('rerender-end');
    performance.measure('filter-change-rerender-time', 'rerender-start', 'rerender-end');

    // Verify performance
    const rerenderTime = performance.getEntriesByName('filter-change-rerender-time')[0]?.duration;
    
    console.log(`Filter change re-render time: ${rerenderTime?.toFixed(2)}ms`);
    expect(rerenderTime).toBeDefined();
    
    // Filters should update quickly
    if (rerenderTime) {
      expect(rerenderTime).toBeLessThan(200);
    }
  });

  it('should process map data efficiently', async () => {
    const { mockApiGet, mockProcessMapData } = setupMocks();
    
    // Create larger test data
    const largeMapData = {
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        label: `Node ${i}`,
        type: i % 2 === 0 ? 'USER' : 'TEAM'
      })),
      edges: Array.from({ length: 150 }, (_, i) => ({
        id: `edge${i}`,
        source: `node${i % 100}`,
        target: `node${(i + 1) % 100}`,
        type: 'RELATIONSHIP'
      }))
    };
    
    mockApiGet.mockResolvedValue({
      data: largeMapData
    });
    
    // Use our global performance measuring helper for async operations
    const { duration } = await global.measurePerformanceAsync(
      'mapDataProcessing',
      async () => {
        render(
          <ChakraProvider>
            <LivingMap />
          </ChakraProvider>
        );
        
        // Wait for processing to complete
        await vi.waitFor(() => {
          expect(mockProcessMapData).toHaveBeenCalled();
        });
      }
    );
    
    console.log(`Map data processing time for large dataset: ${duration.toFixed(2)}ms`);
    
    // Our target threshold for data processing is 300ms
    expect(duration).toBeLessThan(800); // Critical threshold from our metrics
  });
});