/**
 * HierarchyNavigator.test.tsx
 * Tests for the Organizational Hierarchy Navigator
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { HierarchyNavigator } from '../HierarchyNavigator';
import { HierarchyProvider } from '../HierarchyContext';
import { OrganizationalUnitTypeEnum } from '../../../types/hierarchy';

// Mock the API client
jest.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockImplementation((url) => {
      // Return mock hierarchy data based on the URL
      if (url === '/hierarchy/path') {
        return Promise.resolve({
          data: {
            path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-1'],
            units: {
              'org-1': {
                id: 'org-1',
                type: OrganizationalUnitTypeEnum.ORGANIZATION,
                name: 'Acme Corporation',
                memberCount: 5000,
                level: 0,
                path: ['org-1']
              },
              'team-1': {
                id: 'team-1',
                type: OrganizationalUnitTypeEnum.TEAM,
                name: 'ML Team',
                memberCount: 8,
                level: 3,
                path: ['org-1', 'div-1', 'dept-1', 'team-1']
              },
              'user-1': {
                id: 'user-1',
                type: OrganizationalUnitTypeEnum.USER,
                name: 'John Smith',
                memberCount: 1,
                level: 4,
                path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-1']
              }
            }
          }
        });
      }
      
      // Handle unit-specific requests
      if (url.includes('/hierarchy/unit/')) {
        const unitId = url.split('/').pop();
        const mockUnits = {
          'org-1': {
            unit: {
              id: 'org-1',
              type: OrganizationalUnitTypeEnum.ORGANIZATION,
              name: 'Acme Corporation',
              memberCount: 5000,
              level: 0,
              path: ['org-1']
            },
            children: [
              {
                id: 'div-1',
                type: OrganizationalUnitTypeEnum.DIVISION,
                name: 'Research Division',
                memberCount: 1200,
                level: 1,
                path: ['org-1', 'div-1']
              }
            ]
          },
          'team-1': {
            unit: {
              id: 'team-1',
              type: OrganizationalUnitTypeEnum.TEAM,
              name: 'ML Team',
              memberCount: 8,
              level: 3,
              path: ['org-1', 'div-1', 'dept-1', 'team-1']
            },
            children: [
              {
                id: 'user-1',
                type: OrganizationalUnitTypeEnum.USER,
                name: 'John Smith',
                memberCount: 1,
                level: 4,
                path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-1']
              },
              {
                id: 'user-2',
                type: OrganizationalUnitTypeEnum.USER,
                name: 'Sarah Johnson',
                memberCount: 1,
                level: 4,
                path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-2']
              }
            ]
          }
        };
        
        return Promise.resolve({
          data: mockUnits[unitId as keyof typeof mockUnits] || { unit: {}, children: [] }
        });
      }
      
      // Handle search requests
      if (url.includes('/hierarchy/search')) {
        return Promise.resolve({
          data: {
            results: [
              {
                id: 'team-2',
                type: OrganizationalUnitTypeEnum.TEAM,
                name: 'Research Team',
                memberCount: 6,
                level: 3,
                path: ['org-1', 'div-1', 'dept-1', 'team-2']
              }
            ]
          }
        });
      }
      
      return Promise.resolve({ data: {} });
    })
  })
}));

// Mock the auth context
jest.mock('../../../context/UserContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'John Smith',
      team_id: 'team-1'
    }
  })
}));

// Render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {ui}
    </ChakraProvider>
  );
};

describe('HierarchyNavigator', () => {
  it('renders without crashing', () => {
    renderWithProviders(<HierarchyNavigator />);
  });
  
  it('displays user position', async () => {
    renderWithProviders(<HierarchyNavigator />);
    
    // Wait for user position to be loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /your profile/i })).toBeInTheDocument();
    });
  });
  
  it('calls onUnitSelected when a unit is clicked', async () => {
    const mockOnUnitSelected = jest.fn();
    renderWithProviders(<HierarchyNavigator onUnitSelected={mockOnUnitSelected} />);
    
    // Wait for the hierarchy items to render
    await waitFor(() => {
      expect(screen.getByLabelText('Organization hierarchy navigator')).toBeInTheDocument();
    });
    
    // Find and click a hierarchy item
    const teamItem = screen.getByRole('button', { name: /ML Team/i });
    fireEvent.click(teamItem);
    
    // Verify the callback was called
    expect(mockOnUnitSelected).toHaveBeenCalled();
  });
});

// Test the context hook directly
describe('HierarchyContext', () => {
  it('provides correct actions and state', () => {
    const TestComponent = () => {
      const { selectUnit, expandUnit, collapseUnit } = useHierarchyContext();
      
      return (
        <div>
          <button onClick={() => selectUnit('test-id')}>Select</button>
          <button onClick={() => expandUnit('test-id')}>Expand</button>
          <button onClick={() => collapseUnit('test-id')}>Collapse</button>
        </div>
      );
    };
    
    renderWithProviders(
      <HierarchyProvider>
        <TestComponent />
      </HierarchyProvider>
    );
    
    // Verify buttons exist
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    
    // We could also test the functionality of these buttons if needed
  });
});