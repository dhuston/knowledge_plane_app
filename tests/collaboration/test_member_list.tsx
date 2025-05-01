import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MemberList from '../../frontend/src/components/collaboration/MemberList';
import { WorkspaceMember } from '../../frontend/src/models/workspace/Workspace';

describe('MemberList Component', () => {
  const mockMembers: WorkspaceMember[] = [
    {
      id: 'john.doe',
      role: 'owner',
      joinedAt: new Date(2023, 0, 15) // January 15, 2023
    },
    {
      id: 'jane.smith',
      role: 'admin',
      joinedAt: new Date(2023, 2, 10) // March 10, 2023
    },
    {
      id: 'bob.johnson',
      role: 'editor',
      joinedAt: new Date(2023, 4, 22) // May 22, 2023
    },
    {
      id: 'alice.williams',
      role: 'viewer',
      joinedAt: new Date(2023, 6, 5) // July 5, 2023
    }
  ];
  
  it('should render the member list with all members', () => {
    render(<MemberList members={mockMembers} workspaceId="ws-123" />);
    
    // Check that all members are rendered
    expect(screen.getByText('john.doe')).toBeDefined();
    expect(screen.getByText('jane.smith')).toBeDefined();
    expect(screen.getByText('bob.johnson')).toBeDefined();
    expect(screen.getByText('alice.williams')).toBeDefined();
    
    // Check roles are displayed
    expect(screen.getByText('owner')).toBeDefined();
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('editor')).toBeDefined();
    expect(screen.getByText('viewer')).toBeDefined();
  });
  
  it('should render an empty state when there are no members', () => {
    render(<MemberList members={[]} workspaceId="ws-123" />);
    
    expect(screen.getByText('No members match your filters')).toBeDefined();
  });
  
  it('should filter members by search query', () => {
    render(<MemberList members={mockMembers} workspaceId="ws-123" />);
    
    const searchInput = screen.getByPlaceholderText('Search members...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    // Only John should be visible
    expect(screen.getByText('john.doe')).toBeDefined();
    expect(screen.queryByText('jane.smith')).toBeNull();
    expect(screen.queryByText('bob.johnson')).toBeNull();
    expect(screen.queryByText('alice.williams')).toBeNull();
  });
  
  it('should filter members by role', () => {
    render(<MemberList members={mockMembers} workspaceId="ws-123" />);
    
    const roleSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    
    // Only Jane should be visible
    expect(screen.queryByText('john.doe')).toBeNull();
    expect(screen.getByText('jane.smith')).toBeDefined();
    expect(screen.queryByText('bob.johnson')).toBeNull();
    expect(screen.queryByText('alice.williams')).toBeNull();
  });
  
  it('should show all members when filters are cleared', () => {
    render(<MemberList members={mockMembers} workspaceId="ws-123" />);
    
    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search members...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    // Clear filters
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // All members should be visible again
    expect(screen.getByText('john.doe')).toBeDefined();
    expect(screen.getByText('jane.smith')).toBeDefined();
    expect(screen.getByText('bob.johnson')).toBeDefined();
    expect(screen.getByText('alice.williams')).toBeDefined();
  });
  
  it('should format joined dates correctly', () => {
    // Mock the toLocaleDateString method to return a predictable value
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = vi.fn().mockImplementation(function() {
      if (this.getMonth() === 0) return 'Jan 15, 2023';
      if (this.getMonth() === 2) return 'Mar 10, 2023';
      if (this.getMonth() === 4) return 'May 22, 2023';
      if (this.getMonth() === 6) return 'Jul 5, 2023';
      return 'Unknown date';
    });
    
    render(<MemberList members={mockMembers} workspaceId="ws-123" />);
    
    // Check that dates are formatted correctly
    expect(screen.getByText('Joined Jan 15, 2023')).toBeDefined();
    expect(screen.getByText('Joined Mar 10, 2023')).toBeDefined();
    expect(screen.getByText('Joined May 22, 2023')).toBeDefined();
    expect(screen.getByText('Joined Jul 5, 2023')).toBeDefined();
    
    // Restore the original method
    Date.prototype.toLocaleDateString = originalToLocaleDateString;
  });
});