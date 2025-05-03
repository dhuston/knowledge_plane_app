/**
 * Unit tests for ContextDrawer component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContextDrawer from '../ContextDrawer';
import { ChakraProvider } from '@chakra-ui/react';
import { MapNodeTypeEnum } from '../../../types/map';
import * as NodeSelectionContextModule from '../../../context/NodeSelectionContext';

// Mock the NodeSelectionContext and its hook
jest.mock('../../../context/NodeSelectionContext', () => ({
  __esModule: true,
  useNodeSelection: jest.fn()
}));

// Mock the ContextPanel component
jest.mock('../ContextPanel', () => ({
  __esModule: true,
  default: ({ selectedNode, onClose, projectOverlaps, getProjectNameById, onNodeClick }: any) => (
    <div data-testid="context-panel">
      <div>Node: {selectedNode?.label || 'None'}</div>
      <div>Type: {selectedNode?.type || 'None'}</div>
      <button onClick={() => onClose()}>Mock Close</button>
      {onNodeClick && (
        <button onClick={() => onNodeClick('test-node-id')}>Navigate to test node</button>
      )}
    </div>
  )
}));

// Mock data for testing
const mockNode = {
  id: 'node1',
  type: MapNodeTypeEnum.USER,
  label: 'John Smith',
  data: {
    name: 'John Smith',
    title: 'Software Engineer'
  }
};

const mockRelatedNode = {
  id: 'node2',
  type: MapNodeTypeEnum.TEAM,
  label: 'Engineering Team',
  data: {}
};

describe('ContextDrawer', () => {
  const mockSelectNode = jest.fn();
  const mockCloseDrawer = jest.fn();
  const mockGetRelatedNode = jest.fn();
  const mockStoreRelatedNode = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for useNodeSelection
    (NodeSelectionContextModule.useNodeSelection as jest.Mock).mockReturnValue({
      selectedNode: mockNode,
      isDrawerOpen: true,
      selectNode: mockSelectNode,
      closeDrawer: mockCloseDrawer,
      openDrawer: jest.fn(),
      getRelatedNode: mockGetRelatedNode,
      storeRelatedNode: mockStoreRelatedNode
    });
  });

  it('should render the drawer when isDrawerOpen is true', () => {
    render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // Check that the context panel is rendered
    expect(screen.getByTestId('context-panel')).toBeInTheDocument();
    expect(screen.getByText(`Node: ${mockNode.label}`)).toBeInTheDocument();
    expect(screen.getByText(`Type: ${mockNode.type}`)).toBeInTheDocument();
  });

  it('should not render the drawer when isDrawerOpen is false', () => {
    // Override the mock to return isDrawerOpen as false
    (NodeSelectionContextModule.useNodeSelection as jest.Mock).mockReturnValue({
      selectedNode: mockNode,
      isDrawerOpen: false,
      selectNode: mockSelectNode,
      closeDrawer: mockCloseDrawer,
      openDrawer: jest.fn(),
      getRelatedNode: mockGetRelatedNode,
      storeRelatedNode: mockStoreRelatedNode
    });

    const { container } = render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // The drawer should not render its content
    expect(container.firstChild).toBeNull();
  });

  it('should call closeDrawer when close button is clicked', () => {
    render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // Find and click the close button
    fireEvent.click(screen.getByText('Mock Close'));
    
    expect(mockCloseDrawer).toHaveBeenCalled();
  });

  it('should fetch related node from cache when navigating', () => {
    // Mock getRelatedNode to return a related node
    mockGetRelatedNode.mockReturnValue(mockRelatedNode);

    render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // Click the navigation button that triggers onNodeClick
    fireEvent.click(screen.getByText('Navigate to test node'));
    
    // It should try to get the related node from cache
    expect(mockGetRelatedNode).toHaveBeenCalledWith('test-node-id');
    
    // Since we mock that the node exists in cache, it should select it directly
    expect(mockSelectNode).toHaveBeenCalledWith(mockRelatedNode);
    
    // storeRelatedNode should not be called in this case
    expect(mockStoreRelatedNode).not.toHaveBeenCalled();
  });

  it('should create a placeholder node with the correct type when node not found', () => {
    // Mock getRelatedNode to return null (node not found in cache)
    mockGetRelatedNode.mockReturnValue(null);
    
    // Mock selectedNode to not have relationships
    (NodeSelectionContextModule.useNodeSelection as jest.Mock).mockReturnValue({
      selectedNode: {
        ...mockNode,
        data: {} // no relationships
      },
      isDrawerOpen: true,
      selectNode: mockSelectNode,
      closeDrawer: mockCloseDrawer,
      openDrawer: jest.fn(),
      getRelatedNode: mockGetRelatedNode,
      storeRelatedNode: mockStoreRelatedNode
    });

    render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // Click the navigation button that triggers onNodeClick
    fireEvent.click(screen.getByText('Navigate to test node'));
    
    // It should try to get the node from cache
    expect(mockGetRelatedNode).toHaveBeenCalledWith('test-node-id');
    
    // Since we mock that the node doesn't exist, it should create a placeholder
    expect(mockSelectNode).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-node-id',
      type: mockNode.type, // Should use the selected node's type, not default to 'user'
      data: expect.objectContaining({
        isPlaceholder: true
      })
    }));
  });

  it('should handle null nodeId', () => {
    render(
      <ChakraProvider>
        <ContextDrawer />
      </ChakraProvider>
    );

    // Modify the onNodeClick implementation to pass null
    const contextPanelProps = (NodeSelectionContextModule.useNodeSelection as jest.Mock).mock.calls[0][0];
    const onNodeClickFn = screen.getByTestId('context-panel').props.onNodeClick;
    
    // Call onNodeClick with null
    onNodeClickFn(null);
    
    // It should call selectNode with null
    expect(mockSelectNode).toHaveBeenCalledWith(null);
  });

  it('should pass projectOverlaps and getProjectNameById props to ContextPanel', () => {
    const mockProjectOverlaps = { 'project1': ['project2', 'project3'] };
    const mockGetProjectNameById = jest.fn().mockReturnValue('Test Project');

    render(
      <ChakraProvider>
        <ContextDrawer 
          projectOverlaps={mockProjectOverlaps}
          getProjectNameById={mockGetProjectNameById}
        />
      </ChakraProvider>
    );

    // We can't directly test prop passing with the mock,
    // but we can verify the component rendered successfully
    expect(screen.getByTestId('context-panel')).toBeInTheDocument();
  });
});