/**
 * Unit tests for EntityDetails component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import EntityDetails from '../EntityDetails';
import { MapNodeTypeEnum } from '../../../types/map';

// Mock SimpleMarkdown component
vi.mock('../../common/SimpleMarkdown', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="simple-markdown">{content}</div>
  ),
}));

// Mock data for testing
const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  title: 'Software Engineer',
  email: 'john@example.com',
  department: 'Engineering',
  team: 'Frontend',
  skills: ['React', 'TypeScript', 'UI Design'],
  phone: '+1234567890',
  location: 'New York',
  status: 'active',
  created_at: '2023-01-15T12:00:00Z',
  updated_at: '2023-04-20T14:30:00Z',
  tags: ['developer', 'ui-expert', 'mentor'],
};

const mockTeam = {
  id: 'team-123',
  name: 'Frontend Team',
  description: 'Team responsible for the frontend development',
  department: 'Engineering',
  members_count: 8,
  lead: 'Jane Smith',
  status: 'active',
  created_at: '2022-05-10T10:00:00Z',
  updated_at: '2023-06-15T09:45:00Z',
  tags: ['development', 'ui', 'ux'],
};

const mockProject = {
  id: 'project-123',
  name: 'Website Redesign',
  description: 'Complete overhaul of the company website\n\n## Goals\n* Improve UX\n* Increase conversions\n\nCheck out our [design system](https://example.com/design)',
  start_date: '2023-01-01',
  end_date: '2023-12-31',
  status: 'in progress',
  priority: 'high',
  lead: 'Mark Johnson',
  budget: 150000,
  team: 'Frontend Team',
  created_at: '2022-12-01T08:30:00Z',
  updated_at: '2023-07-01T11:20:00Z',
};

const mockGoal = {
  id: 'goal-123',
  name: 'Improve User Engagement',
  description: 'Increase user engagement metrics by 25% through UI/UX improvements',
  target_date: '2023-12-31',
  status: 'on track',
  progress: 60,
  owner: 'Alice Williams',
  linked_projects: 3,
  created_at: '2023-02-15T09:00:00Z',
  updated_at: '2023-07-10T13:15:00Z',
  tags: ['engagement', 'metrics', 'quarter-goals'],
};

const mockNodeTypes = {
  user: {
    id: 'user-123',
    type: MapNodeTypeEnum.USER,
    label: 'John Doe',
    data: {
      name: 'John Doe',
      title: 'Software Engineer',
    },
  },
  team: {
    id: 'team-123',
    type: MapNodeTypeEnum.TEAM,
    label: 'Frontend Team',
    data: {
      name: 'Frontend Team',
    },
  },
  project: {
    id: 'project-123',
    type: MapNodeTypeEnum.PROJECT,
    label: 'Website Redesign',
    data: {
      name: 'Website Redesign',
    },
  },
  goal: {
    id: 'goal-123',
    type: MapNodeTypeEnum.GOAL,
    label: 'Improve User Engagement',
    data: {
      name: 'Improve User Engagement',
    },
  },
};

// Helper to render the component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {ui}
    </ChakraProvider>
  );
};

describe('EntityDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user details properly', () => {
    renderWithProviders(
      <EntityDetails 
        data={mockUser} 
        selectedNode={mockNodeTypes.user}
      />
    );
    
    // Check entity type title
    expect(screen.getByText('User Information')).toBeInTheDocument();
    
    // Check for important user details
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Check for tags
    expect(screen.getByText('developer')).toBeInTheDocument();
    expect(screen.getByText('ui-expert')).toBeInTheDocument();
    expect(screen.getByText('mentor')).toBeInTheDocument();
    
    // Check for status badge
    const statusBadge = screen.getByText('active');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should render team details properly', () => {
    renderWithProviders(
      <EntityDetails 
        data={mockTeam} 
        selectedNode={mockNodeTypes.team}
      />
    );
    
    // Check entity type title
    expect(screen.getByText('Team Details')).toBeInTheDocument();
    
    // Check for important team details
    expect(screen.getByText('Members Count')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check for tags
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('ui')).toBeInTheDocument();
    expect(screen.getByText('ux')).toBeInTheDocument();
  });

  it('should render project details with rich content', () => {
    renderWithProviders(
      <EntityDetails 
        data={mockProject} 
        selectedNode={mockNodeTypes.project}
      />
    );
    
    // Check entity type title
    expect(screen.getByText('Project Information')).toBeInTheDocument();
    
    // Check for markdown content
    expect(screen.getByTestId('simple-markdown')).toBeInTheDocument();
    
    // Check description is passed to SimpleMarkdown
    const markdown = screen.getByTestId('simple-markdown');
    expect(markdown.textContent).toContain('Complete overhaul of the company website');
    
    // Check for links icon (since description contains a link)
    expect(screen.getByLabelText('Contains links')).toBeInTheDocument();
  });

  it('should render goal details properly', () => {
    renderWithProviders(
      <EntityDetails 
        data={mockGoal} 
        selectedNode={mockNodeTypes.goal}
      />
    );
    
    // Check entity type title
    expect(screen.getByText('Goal Information')).toBeInTheDocument();
    
    // Check for important goal details
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('Target Date')).toBeInTheDocument();
    expect(screen.getByText('2023-12-31')).toBeInTheDocument();
    
    // Check for status badge with specific status
    const statusBadge = screen.getByText('on track');
    expect(statusBadge).toBeInTheDocument();
    // Green color for "on track" status
    expect(statusBadge.parentElement).toHaveAttribute('class', expect.stringContaining('colorScheme'));
  });

  it('should show and hide property details', async () => {
    // Create a user with many properties to test show more/less functionality
    const userWithManyProps = {
      ...mockUser,
      prop1: 'Value 1',
      prop2: 'Value 2',
      prop3: 'Value 3',
      prop4: 'Value 4',
      prop5: 'Value 5',
      prop6: 'Value 6',
      prop7: 'Value 7',
      prop8: 'Value 8',
    };
    
    renderWithProviders(
      <EntityDetails 
        data={userWithManyProps} 
        selectedNode={mockNodeTypes.user}
      />
    );
    
    // Initially should show only the first 6 properties
    expect(screen.getByText('Show More (2 more)')).toBeInTheDocument();
    
    // Prop7 should not be visible initially
    expect(screen.queryByText('Prop7')).not.toBeInTheDocument();
    
    // Click "Show More"
    fireEvent.click(screen.getByText('Show More (2 more)'));
    
    // Now Prop7 should be visible
    expect(screen.getByText('Prop7')).toBeInTheDocument();
    expect(screen.getByText('Prop8')).toBeInTheDocument();
    
    // Button should now say "Show Less"
    expect(screen.getByText('Show Less')).toBeInTheDocument();
    
    // Click "Show Less"
    fireEvent.click(screen.getByText('Show Less'));
    
    // Prop7 should be hidden again
    expect(screen.queryByText('Prop7')).not.toBeInTheDocument();
  });

  it('should expand and collapse long descriptions', () => {
    // Create a project with a very long description to test the expand/collapse
    const longDescription = 'A'.repeat(400); // More than the 300 character limit
    const projectWithLongDesc = {
      ...mockProject,
      description: longDescription
    };
    
    renderWithProviders(
      <EntityDetails 
        data={projectWithLongDesc} 
        selectedNode={mockNodeTypes.project}
      />
    );
    
    // Initially should show "Read More" button
    expect(screen.getByText('Read More')).toBeInTheDocument();
    
    // The content shown should be truncated
    expect(screen.getByTestId('simple-markdown').textContent?.length).toBeLessThan(longDescription.length);
    
    // Click "Read More"
    fireEvent.click(screen.getByText('Read More'));
    
    // Now should show the full text and a "Show Less" button
    expect(screen.getByText('Show Less')).toBeInTheDocument();
    expect(screen.getByTestId('simple-markdown').textContent?.length).toBe(longDescription.length);
    
    // Click "Show Less"
    fireEvent.click(screen.getByText('Show Less'));
    
    // Content should be truncated again
    expect(screen.getByText('Read More')).toBeInTheDocument();
    expect(screen.getByTestId('simple-markdown').textContent?.length).toBeLessThan(longDescription.length);
  });

  it('should handle links in description', () => {
    const descriptionWithLinks = 'Check this [example](https://example.com) and also visit https://directurl.com';
    const dataWithLinks = {
      ...mockProject,
      description: descriptionWithLinks
    };
    
    renderWithProviders(
      <EntityDetails 
        data={dataWithLinks} 
        selectedNode={mockNodeTypes.project}
      />
    );
    
    // Should show links
    expect(screen.getByText('External Links')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('directurl.com')).toBeInTheDocument();
  });

  it('should open links modal for many links', async () => {
    // Create data with many links to trigger the "View All" button
    const manyLinks = `
      [Link 1](https://example1.com)
      [Link 2](https://example2.com)
      [Link 3](https://example3.com)
      [Link 4](https://example4.com)
    `;
    
    const dataWithManyLinks = {
      ...mockProject,
      description: manyLinks
    };
    
    renderWithProviders(
      <EntityDetails 
        data={dataWithManyLinks} 
        selectedNode={mockNodeTypes.project}
      />
    );
    
    // Should show View All button
    expect(screen.getByText(/View All/)).toBeInTheDocument();
    
    // Click View All
    fireEvent.click(screen.getByText(/View All/));
    
    // Should open modal
    expect(screen.getByText('External Links')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Close the modal
    fireEvent.click(screen.getByText('Close'));
    
    await waitFor(() => {
      // Modal should be closed (check that dialog is no longer visible)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should display different status colors based on status value', () => {
    // Test different status types with their expected colors
    const statusTypes = [
      { value: 'active', expectedClass: 'green' },
      { value: 'blocked', expectedClass: 'red' },
      { value: 'review', expectedClass: 'orange' },
      { value: 'complete', expectedClass: 'blue' },
      { value: 'archived', expectedClass: 'purple' },
    ];
    
    for (const status of statusTypes) {
      const dataWithStatus = {
        ...mockProject,
        status: status.value
      };
      
      const { unmount } = renderWithProviders(
        <EntityDetails 
          data={dataWithStatus} 
          selectedNode={mockNodeTypes.project}
        />
      );
      
      // Check for status badge with expected color scheme
      const statusBadge = screen.getByText(status.value);
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.parentElement).toHaveAttribute('class', expect.stringContaining(status.expectedClass));
      
      unmount();
    }
  });

  it('should display metadata with created and updated times', () => {
    renderWithProviders(
      <EntityDetails 
        data={mockUser} 
        selectedNode={mockNodeTypes.user}
      />
    );
    
    // Check for created and updated dates
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    
    // Check for correct date format (assuming US locale for test)
    // This will need adjustment if the tests run with a different locale
    expect(screen.getByText(/Created: 1\/15\/2023/)).toBeInTheDocument();
    expect(screen.getByText(/Updated: 4\/20\/2023/)).toBeInTheDocument();
  });

  it('should handle missing data gracefully', () => {
    // Create minimal data
    const minimalData = {
      id: 'minimal-123',
      name: 'Minimal Entity'
    };
    
    renderWithProviders(
      <EntityDetails 
        data={minimalData} 
        selectedNode={mockNodeTypes.user}
      />
    );
    
    // Should still render the component without errors
    expect(screen.getByText('User Information')).toBeInTheDocument();
    
    // Should show empty state for properties
    expect(screen.getByText('No additional details available')).toBeInTheDocument();
    
    // Should not show description section
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    
    // Should not show metadata section
    expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
  });
});