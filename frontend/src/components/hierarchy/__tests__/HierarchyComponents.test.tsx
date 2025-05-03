/**
 * HierarchyComponents.test.tsx
 * Tests for the refactored hierarchy components
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// Import components for testing
import { HierarchyNavigatorView } from '../HierarchyNavigatorView';
import { HierarchyItem } from '../HierarchyItem';
import { TeamPopover } from '../popovers/TeamPopover';
import { SearchInput } from '../search/SearchInput';
import { SearchFilters } from '../search/SearchFilters';

// Import types
import { OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Mock data
const mockUnit = {
  id: 'team-1',
  type: OrganizationalUnitTypeEnum.TEAM,
  name: 'Engineering Team',
  description: 'Software development team',
  parentId: 'dept-1',
  leaderId: 'user-1',
  memberCount: 8,
  level: 3,
  path: ['org-1', 'div-1', 'dept-1', 'team-1'],
};

const mockUnits = [mockUnit];

// Setup test wrapper
const renderWithChakra = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>{ui}</ChakraProvider>
  );
};

// Tests for individual components
describe('HierarchyNavigatorView', () => {
  it('renders with items', () => {
    const { getByLabelText, getByText } = renderWithChakra(
      <HierarchyNavigatorView
        hierarchyItems={mockUnits}
        selectedUnitId={null}
        expandedUnitIds={[]}
        isLoading={false}
        error={null}
        isSearchOpen={false}
        onSearchToggle={jest.fn()}
        onUnitClick={jest.fn()}
        onNavigateUp={jest.fn()}
        onNavigateToRoot={jest.fn()}
      />
    );
    
    expect(getByLabelText('Organization hierarchy navigator')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    const { container } = renderWithChakra(
      <HierarchyNavigatorView
        hierarchyItems={[]}
        selectedUnitId={null}
        expandedUnitIds={[]}
        isLoading={true}
        error={null}
        isSearchOpen={false}
        onSearchToggle={jest.fn()}
        onUnitClick={jest.fn()}
        onNavigateUp={jest.fn()}
        onNavigateToRoot={jest.fn()}
      />
    );
    
    expect(container.querySelector('.chakra-spinner')).toBeInTheDocument();
  });
});

describe('HierarchyItem', () => {
  it('renders correctly', () => {
    const { container } = renderWithChakra(
      <HierarchyItem
        unit={mockUnit}
        isActive={false}
        isExpanded={false}
        onClick={jest.fn()}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByRole } = renderWithChakra(
      <HierarchyItem
        unit={mockUnit}
        isActive={false}
        isExpanded={false}
        onClick={handleClick}
      />
    );
    
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('TeamPopover', () => {
  // Mock the hierarchy context
  jest.mock('../state/HierarchyContext', () => ({
    useHierarchy: () => ({
      units: {
        'user-1': { id: 'user-1', name: 'John Doe', type: OrganizationalUnitTypeEnum.USER }
      }
    })
  }));

  it('renders team information', () => {
    // This test needs to be implemented with proper context mocking
    // This is just a placeholder to demonstrate the test structure
  });
});

describe('SearchInput', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = renderWithChakra(
      <SearchInput
        value=""
        onChange={jest.fn()}
        placeholder="Search..."
      />
    );
    
    expect(getByPlaceholderText('Search...')).toBeInTheDocument();
  });
  
  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = renderWithChakra(
      <SearchInput
        value=""
        onChange={handleChange}
        placeholder="Search..."
      />
    );
    
    fireEvent.change(getByPlaceholderText('Search...'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });
});

describe('SearchFilters', () => {
  it('renders filter buttons', () => {
    const { getByText } = renderWithChakra(
      <SearchFilters
        activeFilter="all"
        onFilterChange={jest.fn()}
      />
    );
    
    expect(getByText('All')).toBeInTheDocument();
    expect(getByText('Teams')).toBeInTheDocument();
    expect(getByText('Depts')).toBeInTheDocument();
  });
  
  it('calls onFilterChange when a filter is clicked', () => {
    const handleFilterChange = jest.fn();
    const { getByText } = renderWithChakra(
      <SearchFilters
        activeFilter="all"
        onFilterChange={handleFilterChange}
      />
    );
    
    fireEvent.click(getByText('Teams'));
    expect(handleFilterChange).toHaveBeenCalledWith(OrganizationalUnitTypeEnum.TEAM);
  });
});