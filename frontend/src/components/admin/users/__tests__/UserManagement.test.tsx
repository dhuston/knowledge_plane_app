import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserManagement from '../UserManagement';
import { AdminProvider } from '../../../../context/AdminContext';

// Mock the API client hook
jest.mock('../../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })
}));

// Mock setTimeout to avoid waiting in tests
jest.useFakeTimers();

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component with loading state', () => {
    render(
      <AdminProvider>
        <UserManagement />
      </AdminProvider>
    );
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    
    // Should show loading state
    const skeletons = screen.getAllByText('', { selector: '.chakra-skeleton' });
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('displays users after loading', async () => {
    render(
      <AdminProvider>
        <UserManagement />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Check for user names
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Robert Johnson')).toBeInTheDocument();
      expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      expect(screen.getByText('Michael Brown')).toBeInTheDocument();
      
      // Check for user roles
      expect(screen.getAllByText('user').length).toBe(4); // 4 regular users
      expect(screen.getByText('admin')).toBeInTheDocument(); // 1 admin user
      
      // Check for status badges
      expect(screen.getAllByText('active').length).toBe(3); // 3 active users
      expect(screen.getByText('inactive')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });
  
  it('allows searching for users', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <UserManagement />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Search for "John"
    await user.type(screen.getByPlaceholderText('Search users...'), 'John');
    
    await waitFor(() => {
      // Should only show John Smith
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      
      // Other users should not be shown
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Robert Johnson')).not.toBeInTheDocument();
    });
    
    // Clear search
    await user.clear(screen.getByPlaceholderText('Search users...'));
    
    // Search for "Core Research Team"
    await user.type(screen.getByPlaceholderText('Search users...'), 'Core Research Team');
    
    await waitFor(() => {
      // Should show users from that team
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      
      // Other users should not be shown
      expect(screen.queryByText('Robert Johnson')).not.toBeInTheDocument();
      expect(screen.queryByText('Emily Chen')).not.toBeInTheDocument();
    });
  });
  
  it('shows empty state when no users match search', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <UserManagement />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Search for something that doesn't exist
    await user.type(screen.getByPlaceholderText('Search users...'), 'XYZ123');
    
    await waitFor(() => {
      // Should show empty state message
      expect(screen.getByText('No users found matching your search criteria')).toBeInTheDocument();
      
      // Button to clear search should be present
      expect(screen.getByRole('button', { name: 'Clear Search' })).toBeInTheDocument();
    });
  });
  
  it('shows user options menu when actions button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <UserManagement />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the options button for the first user
    const optionsButtons = screen.getAllByLabelText('Options');
    await user.click(optionsButtons[0]);
    
    // Check if menu items are shown
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
    expect(screen.getByText('Send Password Reset')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});