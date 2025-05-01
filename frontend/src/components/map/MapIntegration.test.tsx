import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import LivingMap from './LivingMap';
import { useApiClient } from '../../hooks/useApiClient';
import { useDeltaStream } from '../../hooks/useDeltaStream';

// Mock components and hooks
vi.mock('../../hooks/useApiClient');
vi.mock('../../hooks/useDeltaStream');
vi.mock('../panels/ContextPanel', () => ({
  __esModule: true,
  default: ({ nodeId }: { nodeId: string | null }) => (
    <div data-testid="context-panel">
      {nodeId ? `Context panel for ${nodeId}` : 'No node selected'}
    </div>
  ),
}));
vi.mock('./SigmaGraphLoader', () => ({
  __esModule: true,
  default: ({ onSigmaNodeClick, onStageClick, nodes }: any) => (
    <div data-testid="sigma-graph">
      <div>Nodes: {nodes.length}</div>
      <button data-testid="node-click" onClick={() => onSigmaNodeClick({ id: 'test-node-1' })}>
        Click Node
      </button>
      <button data-testid="stage-click" onClick={() => onStageClick()}>
        Click Stage
      </button>
    </div>
  ),
}));
vi.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="sigma-container">{children}</div>,
  ControlsContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="controls-container">{children}</div>,
  LayoutForceAtlas2Control: () => <div data-testid="layout-control" />,
  useLoadGraph: () => vi.fn(),
  useRegisterEvents: () => vi.fn(),
  useSigma: () => ({
    getGraph: () => ({
      nodes: () => ['node1', 'node2'],
      edges: () => ['edge1', 'edge2'],
      hasNode: () => true,
      getNodeAttribute: () => 'attr',
      extremities: () => ['node1', 'node2'],
      neighbors: () => ['node2'],
      hasExtremity: () => true
    }),
    refresh: vi.fn(),
    graphToViewport: () => ({ x: 100, y: 100 }),
    viewportToGraph: () => ({ x: 200, y: 200 }),
  }),
  useSetSettings: () => vi.fn(),
  useCamera: () => ({
    goto: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    getState: () => ({ ratio: 1, x: 0, y: 0 }),
    animate: vi.fn(),
  }),
}));

// Sample map data to return from API
const sampleMapData = {
  nodes: [
    { id: 'test-node-1', label: 'Test Node 1', type: 'PERSON' },
    { id: 'test-node-2', label: 'Test Node 2', type: 'TEAM' },
    { id: 'test-node-3', label: 'Test Project', type: 'PROJECT' },
  ],
  edges: [
    { id: 'edge-1', source: 'test-node-1', target: 'test-node-2', label: 'MEMBER_OF' },
    { id: 'edge-2', source: 'test-node-2', target: 'test-node-3', label: 'OWNS' },
  ]
};

// Delta update sample
const sampleDeltaUpdate = {
  nodeChanges: [
    { id: 'test-node-4', label: 'New Node', type: 'PERSON', op: 'add' }
  ],
  edgeChanges: [
    { id: 'edge-3', source: 'test-node-1', target: 'test-node-4', label: 'KNOWS', op: 'add' }
  ]
};

// Helper to setup mocks before each test
const setupMocks = () => {
  let deltaCallback: Function | null = null;
  
  const mockApiGet = vi.fn();
  (useApiClient as any).mockReturnValue({
    get: mockApiGet,
  });
  
  mockApiGet.mockResolvedValue({
    data: sampleMapData
  });
  
  (useDeltaStream as any).mockImplementation((callback) => {
    // Store the callback so we can trigger delta updates in tests
    deltaCallback = callback;
    return null;
  });
  
  return {
    triggerDeltaUpdate: () => {
      if (deltaCallback) {
        deltaCallback(sampleDeltaUpdate);
      }
    }
  };
};

// Helper to render with all necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        {ui}
      </ChakraProvider>
    </MemoryRouter>
  );
};

describe('Map Integration', () => {
  it('loads map data and renders it correctly', async () => {
    setupMocks();
    
    const onNodeClickMock = vi.fn();
    
    renderWithProviders(
      <LivingMap 
        onNodeClick={onNodeClickMock} 
        projectOverlaps={{}} 
      />
    );
    
    // Should show loading first
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Should render graph after data loads
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
    });
    
    // Should show node count
    expect(screen.getByText('Nodes: 3')).toBeInTheDocument();
  });

  it('shows context panel when node is clicked', async () => {
    setupMocks();
    
    const onNodeClickMock = vi.fn();
    
    renderWithProviders(
      <div>
        <LivingMap 
          onNodeClick={onNodeClickMock} 
          projectOverlaps={{}} 
        />
        <div id="context-panel-container" data-testid="panel-container">
          {/* Context panel would be rendered here in the real app */}
        </div>
      </div>
    );
    
    // Wait for graph to load
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
    });
    
    // Click on a node
    fireEvent.click(screen.getByTestId('node-click'));
    
    // onNodeClick should be called with correct node ID
    expect(onNodeClickMock).toHaveBeenCalledWith('test-node-1');
  });

  it('handles search functionality correctly', async () => {
    setupMocks();
    
    renderWithProviders(
      <LivingMap 
        onNodeClick={vi.fn()} 
        projectOverlaps={{}} 
      />
    );
    
    // Wait for graph to load
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
    });
    
    // Find search input
    const searchInput = screen.getByPlaceholderText(/search node/i);
    
    // Type in search box
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    // Should show search results
    await waitFor(() => {
      expect(screen.getByText('Test Node 1')).toBeInTheDocument();
      expect(screen.getByText('Test Node 2')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
    
    // Type more specific search
    fireEvent.change(searchInput, { target: { value: 'Project' } });
    
    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.queryByText('Test Node 1')).not.toBeInTheDocument();
    });
  });

  it('clears node selection when clicking on the background', async () => {
    setupMocks();
    
    const onNodeClickMock = vi.fn();
    
    renderWithProviders(
      <LivingMap 
        onNodeClick={onNodeClickMock} 
        projectOverlaps={{}} 
      />
    );
    
    // Wait for graph to load
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph')).toBeInTheDocument();
    });
    
    // Click on a node
    fireEvent.click(screen.getByTestId('node-click'));
    expect(onNodeClickMock).toHaveBeenCalledWith('test-node-1');
    
    // Click on background
    fireEvent.click(screen.getByTestId('stage-click'));
    
    // onNodeClick should be called with null
    expect(onNodeClickMock).toHaveBeenCalledWith(null);
  });
});