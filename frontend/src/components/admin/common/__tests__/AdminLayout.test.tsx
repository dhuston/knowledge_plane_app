import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminLayout from '../AdminLayout';
import { AdminProvider } from '../../../../context/AdminContext';

// Mock the useAdmin hook
jest.mock('../../../../context/AdminContext', () => ({
  ...jest.requireActual('../../../../context/AdminContext'),
  useAdmin: () => ({
    breadcrumbs: [
      { label: 'Admin Console' },
      { label: 'Test Section' }
    ],
    isRefreshing: false,
    refreshData: jest.fn()
  })
}));

describe('AdminLayout', () => {
  it('renders the component with children', () => {
    render(
      <AdminProvider>
        <AdminLayout title="Test Title">
          <div data-testid="test-child">Test Content</div>
        </AdminLayout>
      </AdminProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('displays breadcrumbs correctly', () => {
    render(
      <AdminProvider>
        <AdminLayout title="Test Title">
          <div>Test Content</div>
        </AdminLayout>
      </AdminProvider>
    );
    
    const breadcrumb = screen.getByLabelText('breadcrumb-navigation');
    expect(breadcrumb).toBeInTheDocument();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('calls the default refresh function when refresh button is clicked', () => {
    const mockRefreshData = jest.fn();
    
    // Override the mock to include our spy function
    jest.spyOn(require('../../../../context/AdminContext'), 'useAdmin').mockImplementation(() => ({
      breadcrumbs: [{ label: 'Admin Console' }, { label: 'Test' }],
      isRefreshing: false,
      refreshData: mockRefreshData
    }));
    
    render(
      <AdminProvider>
        <AdminLayout title="Test Title">
          <div>Test Content</div>
        </AdminLayout>
      </AdminProvider>
    );
    
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);
    
    expect(mockRefreshData).toHaveBeenCalledTimes(1);
    
    // Clean up mock
    jest.restoreAllMocks();
  });

  it('calls the custom refresh function when provided', () => {
    const mockCustomRefresh = jest.fn();
    const mockRefreshData = jest.fn();
    
    // Override the mock
    jest.spyOn(require('../../../../context/AdminContext'), 'useAdmin').mockImplementation(() => ({
      breadcrumbs: [{ label: 'Admin Console' }, { label: 'Test' }],
      isRefreshing: false,
      refreshData: mockRefreshData
    }));
    
    render(
      <AdminProvider>
        <AdminLayout title="Test Title" onRefresh={mockCustomRefresh}>
          <div>Test Content</div>
        </AdminLayout>
      </AdminProvider>
    );
    
    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);
    
    expect(mockCustomRefresh).toHaveBeenCalledTimes(1);
    expect(mockRefreshData).not.toHaveBeenCalled();
    
    // Clean up mock
    jest.restoreAllMocks();
  });

  it('hides refresh button when showRefresh is false', () => {
    render(
      <AdminProvider>
        <AdminLayout title="Test Title" showRefresh={false}>
          <div>Test Content</div>
        </AdminLayout>
      </AdminProvider>
    );
    
    const refreshButton = screen.queryByRole('button', { name: /refresh data/i });
    expect(refreshButton).not.toBeInTheDocument();
  });
});