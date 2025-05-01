import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebGLMap from './WebGLMap';
import { expectComponentTreeSnapshot } from '../../test-utils/visualRegression';

// Need to mock ForceGraph as it relies on WebGL
vi.mock('react-force-graph-2d', () => ({
  default: ({ nodeLabel, linkLabel, nodeColor, nodeVal }: any) => (
    <div data-testid="force-graph-2d">
      <div data-testid="mock-node" style={{ backgroundColor: nodeColor('mockNode') }}>
        {nodeLabel({ id: 'mockNode', label: 'Mock Node' })}
      </div>
      <div data-testid="mock-link">
        {linkLabel ? linkLabel({ id: 'mockLink', label: 'Mock Link' }) : 'No Link Label'}
      </div>
    </div>
  ),
}));

// Sample test data
const mockData = {
  nodes: [
    { id: 'node1', label: 'Node 1', type: 'PERSON' },
    { id: 'node2', label: 'Node 2', type: 'TEAM' }
  ],
  links: [
    { id: 'link1', source: 'node1', target: 'node2', label: 'MEMBER_OF' }
  ]
};

describe('WebGLMap', () => {
  it('renders the force graph with data', async () => {
    const { container } = render(
      <WebGLMap 
        graphData={mockData}
        onNodeClick={vi.fn()}
        onBackgroundClick={vi.fn()}
      />
    );
    
    expect(screen.getByTestId('force-graph-2d')).toBeInTheDocument();
  });
  
  it('renders with correct node styling', async () => {
    render(
      <WebGLMap 
        graphData={mockData}
        onNodeClick={vi.fn()}
        onBackgroundClick={vi.fn()}
      />
    );
    
    expect(screen.getByTestId('mock-node')).toBeInTheDocument();
    // Visual regression test
    const node = screen.getByTestId('mock-node');
    expectComponentTreeSnapshot(node, { name: 'webgl-map-node-styling' });
  });
  
  it('passes callbacks for interactions correctly', async () => {
    const mockNodeClick = vi.fn();
    const mockBgClick = vi.fn();
    
    render(
      <WebGLMap 
        graphData={mockData}
        onNodeClick={mockNodeClick}
        onBackgroundClick={mockBgClick}
      />
    );
  });
  
  it('renders loading state correctly when no data', async () => {
    const { container } = render(
      <WebGLMap 
        graphData={{ nodes: [], links: [] }}
        onNodeClick={vi.fn()}
        onBackgroundClick={vi.fn()}
        isLoading={true}
      />
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Take visual snapshot of the loading state
    expectComponentTreeSnapshot(container.firstElementChild as HTMLElement, {
      name: 'webgl-map-loading-state',
      maxDepth: 3
    });
  });
  
  it('renders error state correctly', async () => {
    const { container } = render(
      <WebGLMap 
        graphData={{ nodes: [], links: [] }}
        onNodeClick={vi.fn()}
        onBackgroundClick={vi.fn()}
        error="Test error message"
      />
    );
    
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
    // Take visual snapshot of the error state
    expectComponentTreeSnapshot(container.firstElementChild as HTMLElement, {
      name: 'webgl-map-error-state',
      maxDepth: 2
    });
  });
});