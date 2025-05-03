/**
 * Unit tests for RelationshipList component
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelationshipList from '../RelationshipList';
import { ChakraProvider } from '@chakra-ui/react';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../../types/map';

// Mock framer-motion to prevent console warnings in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => (
        <div {...props} data-testid="motion-div">{children}</div>
      )
    },
    AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>,
    keyframes: jest.fn()
  };
});

// Mock data for testing
const mockRelationships = [
  {
    id: 'rel1',
    type: MapEdgeTypeEnum.MEMBER_OF,
    label: 'Engineering Team',
    source: 'user1',
    source_type: MapNodeTypeEnum.USER,
    target: 'team1',
    target_type: MapNodeTypeEnum.TEAM,
  },
  {
    id: 'rel2',
    type: MapEdgeTypeEnum.PARTICIPATES_IN,
    label: 'Website Redesign',
    source: 'user1',
    source_type: MapNodeTypeEnum.USER,
    target: 'project1',
    target_type: MapNodeTypeEnum.PROJECT,
  },
  {
    id: 'rel3',
    type: MapEdgeTypeEnum.REPORTS_TO,
    label: 'Sarah Manager',
    source: 'user1',
    source_type: MapNodeTypeEnum.USER,
    target: 'user2',
    target_type: MapNodeTypeEnum.USER,
  },
];

// Create a large dataset for virtualization testing
const createLargeDataset = (count: number) => {
  const largeDataset = [];
  for (let i = 0; i < count; i++) {
    largeDataset.push({
      id: `rel_${i}`,
      type: i % 3 === 0 ? MapEdgeTypeEnum.MEMBER_OF :
            i % 3 === 1 ? MapEdgeTypeEnum.PARTICIPATES_IN :
                          MapEdgeTypeEnum.REPORTS_TO,
      label: `Relationship ${i}`,
      source: 'user1',
      source_type: MapNodeTypeEnum.USER,
      target: `entity_${i}`,
      target_type: i % 3 === 0 ? MapNodeTypeEnum.TEAM :
                  i % 3 === 1 ? MapNodeTypeEnum.PROJECT :
                                MapNodeTypeEnum.USER,
    });
  }
  return largeDataset;
};

describe('RelationshipList', () => {
  const mockOnSelectRelationship = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={[]}
          isLoading={true}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
  });

  it('renders empty state when no relationships are available', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={[]}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('No relationships found')).toBeInTheDocument();
    expect(screen.getByText('Add connection')).toBeInTheDocument();
  });

  it('renders relationships in list view by default', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
          onSelectRelationship={mockOnSelectRelationship}
        />
      </ChakraProvider>
    );

    // Check for relationship labels
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Sarah Manager')).toBeInTheDocument();
  });
  
  it('groups relationships by type by default', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    // Check for group headers with correct relationship counts
    expect(screen.getByText('Member Of')).toBeInTheDocument();
    expect(screen.getByText('Participates In')).toBeInTheDocument();
    expect(screen.getByText('Reports To')).toBeInTheDocument();
  });

  it('filters relationships by search query', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    // Type in search box
    fireEvent.change(screen.getByPlaceholderText('Search relationships'), { target: { value: 'engineer' } });

    // Should only see Engineering Team
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();
    expect(screen.queryByText('Sarah Manager')).not.toBeInTheDocument();
  });

  it('changes view mode when selecting different views', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    // Open view options menu
    fireEvent.click(screen.getByLabelText('View options'));

    // Select grid view
    fireEvent.click(screen.getByText('Grid view'));

    // Check that grid view is selected
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    
    // The structure should now be different (grid layout)
    // This is hard to test specifically, but we can at least check the menu state changed
    fireEvent.click(screen.getByLabelText('View options'));
    const gridMenuItem = screen.getByText('Grid view');
    expect(gridMenuItem.parentElement).toHaveStyle('font-weight: medium');
  });

  it('calls onSelectRelationship when a relationship is clicked', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
          onSelectRelationship={mockOnSelectRelationship}
        />
      </ChakraProvider>
    );

    // Click on a relationship
    fireEvent.click(screen.getByText('Engineering Team'));

    // Check if callback was called
    expect(mockOnSelectRelationship).toHaveBeenCalledTimes(1);
    expect(mockOnSelectRelationship).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Engineering Team',
      type: MapEdgeTypeEnum.MEMBER_OF
    }));
  });

  it('toggles group expansion when clicking on group headers', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );

    // Find the Member Of group and its content
    const memberOfHeader = screen.getByText('Member Of');
    
    // Group should be expanded by default, Engineering Team should be visible
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    
    // Click on the group header to collapse it
    fireEvent.click(memberOfHeader.parentElement!);
    
    // Engineering Team should no longer be visible
    // In an actual browser this would be true, but due to how testing-library
    // works with collapsed elements, we'd need to check for aria-expanded attribute
    expect(memberOfHeader.parentElement!.parentElement!).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles a large number of relationships efficiently', () => {
    // We'll check that the component renders with a large dataset without crashing
    const largeDataset = createLargeDataset(200);
    
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={largeDataset}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );
    
    // Should render without crashing, and we should see some of the relationships
    // (actual virtualization would be tested in an integration test with browser)
    expect(screen.getByText('Relationship 0')).toBeInTheDocument();
  });

  it('shows appropriate header text based on entity type', () => {
    const { rerender } = render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );
    
    // Should have user-specific header
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Connections & Teams');
    
    // Rerender with Team entity type
    rerender(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.TEAM}
        />
      </ChakraProvider>
    );
    
    // Should have team-specific header
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Members & Projects');
  });
  
  it('sorts relationships when changing sort option', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );
    
    // Change sort to "Strength"
    fireEvent.change(screen.getByLabelText('Sort relationships'), { 
      target: { value: 'strength' } 
    });
    
    // Hard to test the actual sorting result in a unit test,
    // but we can verify the selection changed
    expect(screen.getByLabelText('Sort relationships')).toHaveValue('strength');
  });
  
  it('applies filters when entities are selected in filter menu', () => {
    render(
      <ChakraProvider>
        <RelationshipList 
          relationships={mockRelationships}
          isLoading={false}
          entityType={MapNodeTypeEnum.USER}
        />
      </ChakraProvider>
    );
    
    // Open filter menu
    fireEvent.click(screen.getByLabelText('Filter relationships'));
    
    // Select Team filter
    fireEvent.click(screen.getByText('Team'));
    
    // Should add filter tag
    expect(screen.getByText('Team')).toBeInTheDocument();
    
    // Only Team relationships should be visible
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    expect(screen.queryByText('Website Redesign')).not.toBeInTheDocument();
    expect(screen.queryByText('Sarah Manager')).not.toBeInTheDocument();
  });
});