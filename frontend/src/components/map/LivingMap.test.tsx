import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import LivingMap from './LivingMap';
import { useApiClient } from '../../hooks/useApiClient';
import { useDeltaStream } from '../../hooks/useDeltaStream';

// Mock dependencies
vi.mock('../../hooks/useApiClient');
vi.mock('../../hooks/useDeltaStream');
vi.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div data-testid="sigma-container" style={style}>{children}</div>
  ),
  ControlsContainer: ({ children, position }: { children: React.ReactNode, position: string }) => (
    <div data-testid="controls-container" data-position={position}>{children}</div>
  ),
  LayoutForceAtlas2Control: () => <div data-testid="layout-control">ForceAtlas2 Control</div>,
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

vi.mock('./SigmaGraphLoader', () => ({
  __esModule: true,
  default: ({ 
    onSigmaNodeClick,
    onStageClick, 
    nodes = [],
    edges = [],
    onNodeHover
  }: any) => (
    <div data-testid="sigma-graph-loader">
      <div>Nodes: {nodes.length}</div>
      <button data-testid="node-click-btn" onClick={() => onSigmaNodeClick({ id: 'test-node-1', label: 'Test Node', type: 'PERSON' })}>
        Click Node
      </button>
      <button data-testid="stage-click-btn" onClick={() => onStageClick()}>
        Click Stage
      </button>
      <button 
        data-testid="hover-node-btn" 
        onMouseEnter={() => onNodeHover({ id: 'test-node-1', label: 'Test Node', type: 'PERSON' }, { x: 100, y: 100 })}
        onMouseLeave={() => onNodeHover(null, null)}
      >
        Hover Node
      </button>
    </div>
  ),
}));

// Mock data response
const mockMapData = {
  nodes: [
    { id: 'test-node-1', label: 'Test Node 1', type: 'PERSON' },
    { id: 'test-node-2', label: 'Test Node 2', type: 'TEAM' },
    { id: 'test-node-3', label: 'Test Project', type: 'PROJECT' }
  ],
  edges: [
    { id: 'edge-1', source: 'test-node-1', target: 'test-node-2', label: 'MEMBER_OF' },
    { id: 'edge-2', source: 'test-node-2', target: 'test-node-3', label: 'OWNS' }
  ]
};

// Helper to setup mocks
const setupMocks = () => {
  const mockApiGet = vi.fn();
  (useApiClient as any).mockReturnValue({
    get: mockApiGet,
  });
  
  mockApiGet.mockResolvedValue({
    data: mockMapData
  });
  
  (useDeltaStream as any).mockImplementation(() => undefined);
  
  return { mockApiGet };
};

// Helper to render the component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {ui}
    </ChakraProvider>
  );
};

describe('LivingMap', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    // Check for spinner/loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('renders the map after data is loaded', async () => {
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
  });
  
  it('calls the API to fetch map data on load', async () => {
    const { mockApiGet } = setupMocks();
    
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled();
      const [path, params] = mockApiGet.mock.calls[0];
      expect(path).toBe('/map/data');
      expect(params).toHaveProperty('params');
    });
  });
  
  it('calls onNodeClick when a node is clicked', async () => {
    const mockNodeClick = vi.fn();
    renderWithProviders(<LivingMap onNodeClick={mockNodeClick} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('node-click-btn'));
    expect(mockNodeClick).toHaveBeenCalledWith('test-node-1');
  });
  
  it('calls onNodeClick with null when stage is clicked', async () => {
    const mockNodeClick = vi.fn();
    renderWithProviders(<LivingMap onNodeClick={mockNodeClick} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-graph-loader')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('stage-click-btn'));
    expect(mockNodeClick).toHaveBeenCalledWith(null);
  });
  
  it('shows search results when typing in search box', async () => {
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
    
    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText(/search node/i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Test' } });
    });
    
    // Wait for search results to appear
    await waitFor(() => {
      // Should show all nodes that match "Test"
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  it('handles API error states', async () => {
    const mockApiGet = vi.fn();
    (useApiClient as any).mockReturnValue({
      get: mockApiGet,
    });
    mockApiGet.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      // Use a more specific selector to avoid multiple matches
      expect(screen.getByText('Error:', { exact: false })).toBeInTheDocument();
    });
  });

  it('toggles filter panel when filter button is clicked', async () => {
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
    
    // Find and click the filter button
    const filterButton = screen.getByLabelText(/toggle filters/i);
    fireEvent.click(filterButton);
    
    // Check that the filter panel is now visible
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(filterButton);
    
    // The panel should no longer be visible
    await waitFor(() => {
      expect(screen.queryByText(/node type and status filters/i)).not.toBeInTheDocument();
    });
  });
  
  it('processes search input', async () => {
    renderWithProviders(<LivingMap onNodeClick={vi.fn()} projectOverlaps={{}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
    
    // Find search input and enter text
    const searchInput = screen.getByPlaceholderText(/search node/i);
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Test' } });
    });
    
    // Click the search button
    const searchButton = screen.getByLabelText(/search/i);
    fireEvent.click(searchButton);
    
    // Verify the input is updated
    expect(searchInput).toHaveValue('Test');
  });
});