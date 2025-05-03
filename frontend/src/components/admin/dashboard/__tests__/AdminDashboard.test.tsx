import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminDashboard from '../AdminDashboard';
import { AdminProvider } from '../../../../context/AdminContext';

// Mock the useAdmin hook
jest.mock('../../../../context/AdminContext', () => ({
  ...jest.requireActual('../../../../context/AdminContext'),
  useAdmin: () => ({
    refreshData: jest.fn(),
    isRefreshing: false,
    breadcrumbs: [{ label: 'Admin Console' }, { label: 'Dashboard' }],
    setBreadcrumbs: jest.fn(),
    activeView: 'dashboard',
    setActiveView: jest.fn()
  })
}));

// Mock setTimeout to avoid waiting in tests
jest.useFakeTimers();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component with loading state', () => {
    render(
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
    
    // Check for main title
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    
    // Check for loading states
    const skeletons = screen.getAllByText('', { selector: '.chakra-skeleton' });
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('displays stats after loading completes', async () => {
    render(
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('124')).toBeInTheDocument(); // user count
      expect(screen.getByText('87 active now')).toBeInTheDocument(); // active users
      expect(screen.getByText('15')).toBeInTheDocument(); // team count
      expect(screen.getByText('28')).toBeInTheDocument(); // project count
      expect(screen.getByText('4/6')).toBeInTheDocument(); // integrations
    });
  });
  
  it('displays system status indicators', async () => {
    render(
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('Integration Service')).toBeInTheDocument();
      expect(screen.getByText('Background Jobs')).toBeInTheDocument();
    });
  });
  
  it('displays feature flag summary', async () => {
    render(
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      expect(screen.getByText('8 of 12 features enabled')).toBeInTheDocument();
      expect(screen.getByText('Recently updated:')).toBeInTheDocument();
      expect(screen.getByText(/Analytics Engine/)).toBeInTheDocument();
    });
  });
  
  it('handles refresh action', async () => {
    const mockRefreshData = jest.fn().mockResolvedValue(undefined);
    
    // Override the mock
    jest.spyOn(require('../../../../context/AdminContext'), 'useAdmin').mockImplementation(() => ({
      refreshData: mockRefreshData,
      isRefreshing: false,
      breadcrumbs: [{ label: 'Admin Console' }, { label: 'Dashboard' }],
      setBreadcrumbs: jest.fn(),
      activeView: 'dashboard',
      setActiveView: jest.fn()
    }));
    
    render(
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete initial loading
    jest.advanceTimersByTime(1000);
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    await userEvent.click(refreshButton);
    
    expect(mockRefreshData).toHaveBeenCalledTimes(1);
    
    // Fast-forward timer to complete the refresh
    jest.advanceTimersByTime(1000);
    
    // Clean up mock
    jest.restoreAllMocks();
  });
});