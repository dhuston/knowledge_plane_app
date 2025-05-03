import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AllProviders } from '../../../test-utils/test-providers';
import AdminConsole from '../AdminConsole';

// Mock components that will be rendered in AdminConsole
jest.mock('../dashboard/AdminDashboard', () => {
  return function MockDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard Content</div>;
  };
});

jest.mock('../features/EnhancedFeatureFlags', () => {
  return function MockFeatureFlags() {
    return <div data-testid="admin-feature-flags">Feature Flags Content</div>;
  };
});

jest.mock('../integrations/EnhancedIntegrationsPanel', () => {
  return function MockIntegrations() {
    return <div data-testid="admin-integrations">Integrations Content</div>;
  };
});

jest.mock('../users/UserManagement', () => {
  return function MockUserManagement() {
    return <div data-testid="admin-users">User Management Content</div>;
  };
});

jest.mock('../common/AdminSidebarNav', () => {
  return function MockAdminSidebarNav({ items, onItemClick }: any) {
    return (
      <div data-testid="sidebar-nav">
        {items.map((item: any, index: number) => (
          <button 
            key={item.id} 
            data-testid={`nav-item-${item.id}`}
            onClick={() => onItemClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  };
});

// Mock useAuth hook for testing different user roles
jest.mock('../../../context/AuthContext', () => ({
  ...jest.requireActual('../../../context/AuthContext'),
  useAuth: () => ({
    isAuthenticated: true,
    user: { 
      id: 'test-user', 
      name: 'Test User', 
      email: 'test@example.com',
      role: 'super_admin'
    }
  })
}));

describe('AdminConsole', () => {
  it('renders the component with dashboard as default view', () => {
    render(
      <AllProviders>
        <AdminConsole />
      </AllProviders>
    );
    
    // Check that the sidebar navigation is rendered
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
    
    // Check that the dashboard is rendered as default view
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    
    // Check that the header is rendered
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
  });

  it('switches between admin views when sidebar items are clicked', async () => {
    const user = userEvent.setup();
    render(
      <AllProviders>
        <AdminConsole />
      </AllProviders>
    );
    
    // Dashboard should be default
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    
    // Click on Users navigation item
    await user.click(screen.getByTestId('nav-item-users'));
    
    // Should now show user management view
    expect(screen.getByTestId('admin-users')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
    
    // Click on Features navigation item
    await user.click(screen.getByTestId('nav-item-features'));
    
    // Should now show features view
    expect(screen.getByTestId('admin-feature-flags')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-users')).not.toBeInTheDocument();
    
    // Click on Integrations navigation item
    await user.click(screen.getByTestId('nav-item-integrations'));
    
    // Should now show integrations view
    expect(screen.getByTestId('admin-integrations')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-feature-flags')).not.toBeInTheDocument();
    
    // Back to dashboard
    await user.click(screen.getByTestId('nav-item-dashboard'));
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation correctly', () => {
    render(
      <AllProviders>
        <AdminConsole />
      </AllProviders>
    );
    
    // Check for breadcrumb component
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toBeInTheDocument();
    
    // Initial breadcrumb should show Admin Console > Dashboard
    expect(within(breadcrumb).getByText('Admin Console')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Dashboard')).toBeInTheDocument();
  });

  it('updates breadcrumb when navigation changes', async () => {
    const user = userEvent.setup();
    render(
      <AllProviders>
        <AdminConsole />
      </AllProviders>
    );
    
    // Click on Users navigation item
    await user.click(screen.getByTestId('nav-item-users'));
    
    // Breadcrumb should now show Admin Console > Users
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(breadcrumb).getByText('Admin Console')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Users')).toBeInTheDocument();
  });
  
  it('restricts access when user does not have admin role', () => {
    // Override the mock to return a non-admin user
    jest.spyOn(require('../../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      user: { 
        id: 'regular-user', 
        name: 'Regular User', 
        email: 'regular@example.com',
        role: 'user'
      }
    }));
    
    render(
      <AllProviders>
        <AdminConsole />
      </AllProviders>
    );
    
    // Check that access denied message is displayed
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-nav')).not.toBeInTheDocument();
    
    // Clean up mock
    jest.restoreAllMocks();
  });
});