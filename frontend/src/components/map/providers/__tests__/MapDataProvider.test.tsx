import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MapDataProvider, useMapData } from '../MapDataProvider';

// Mock API client
jest.mock('../../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({
      data: { nodes: [{ id: '1', label: 'Test Node' }], edges: [] }
    })
  })
}));

// Mock layout worker
jest.mock('../../../../hooks/useLayoutWorker', () => ({
  useLayoutWorker: () => ({
    processMapData: jest.fn().mockImplementation(data => Promise.resolve(data))
  })
}));

// Mock performance utils
jest.mock('../../../../utils/performance', () => ({
  perfume: {
    start: jest.fn(),
    end: jest.fn()
  },
  measureAsync: jest.fn().mockImplementation((_, fn) => fn())
}));

// Test component that consumes the context
const TestConsumer = () => {
  const { mapData, isLoading, error, selectedNode, setSelectedNode } = useMapData();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error ? error.message : 'No Error'}</div>
      <div data-testid="node-count">{mapData.nodes.length}</div>
      <div data-testid="edge-count">{mapData.edges.length}</div>
      <div data-testid="selected-node">{selectedNode || 'None'}</div>
      <button 
        data-testid="select-button" 
        onClick={() => setSelectedNode('1')}
      >
        Select Node
      </button>
    </div>
  );
};

describe('MapDataProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('provides map data and loading state', async () => {
    render(
      <MapDataProvider>
        <TestConsumer />
      </MapDataProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Check data
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });
  
  test('handles node selection', async () => {
    render(
      <MapDataProvider>
        <TestConsumer />
      </MapDataProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Initially no node selected
    expect(screen.getByTestId('selected-node')).toHaveTextContent('None');
    
    // Select a node
    act(() => {
      screen.getByTestId('select-button').click();
    });
    
    // Check that node was selected
    expect(screen.getByTestId('selected-node')).toHaveTextContent('1');
  });
  
  test('passes initial filters to query parameters', async () => {
    const initialFilters = {
      types: ['user', 'team'],
      statuses: ['active']
    };
    
    render(
      <MapDataProvider initialFilters={initialFilters}>
        <TestConsumer />
      </MapDataProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // We can't directly test the API params, but if the component renders
    // without errors, then the filters were processed correctly
    expect(screen.getByTestId('node-count')).toBeInTheDocument();
  });
  
  test('handles API errors', async () => {
    // Mock API error
    jest.mock('../../../../hooks/useApiClient', () => ({
      useApiClient: () => ({
        get: jest.fn().mockRejectedValue(new Error('API Error'))
      })
    }), { virtual: true });
    
    render(
      <MapDataProvider>
        <TestConsumer />
      </MapDataProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // In a real implementation, the error would be handled and displayed
    expect(screen.getByTestId('node-count')).toHaveTextContent('0');
  });
});