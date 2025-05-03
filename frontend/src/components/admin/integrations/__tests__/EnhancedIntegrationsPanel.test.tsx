import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EnhancedIntegrationsPanel from '../EnhancedIntegrationsPanel';
import { AdminProvider } from '../../../../context/AdminContext';

// Mock the necessary hooks
jest.mock('../../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })
}));

jest.mock('../../../../utils/featureFlags', () => ({
  useFeatureFlags: () => ({
    flags: { enableIntegrations: true }
  })
}));

// Mock setTimeout to avoid waiting in tests
jest.useFakeTimers();

describe('EnhancedIntegrationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component with loading state', () => {
    render(
      <AdminProvider>
        <EnhancedIntegrationsPanel />
      </AdminProvider>
    );
    
    expect(screen.getByText('Integration Management')).toBeInTheDocument();
    
    // Should show skeleton loading states
    const skeletons = screen.getAllByText('', { selector: '.chakra-skeleton' });
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('displays integrations after loading', async () => {
    render(
      <AdminProvider>
        <EnhancedIntegrationsPanel />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Check for integration names
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Teams')).toBeInTheDocument();
      
      // Check for status badges
      expect(screen.getAllByText('active').length).toBe(2); // Two active integrations
      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });
  
  it('filters integrations by type when category button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedIntegrationsPanel />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Wait for integrations to load
    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });
    
    // Click on Messaging category button
    await user.click(screen.getByRole('button', { name: /messaging/i }));
    
    await waitFor(() => {
      // Should show messaging integrations
      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Teams')).toBeInTheDocument();
      
      // Should not show other types
      expect(screen.queryByText('Google Calendar')).not.toBeInTheDocument();
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    });
    
    // Click on All to reset filter
    await user.click(screen.getByRole('button', { name: /all/i }));
    
    await waitFor(() => {
      // Should show all integrations again
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });
  
  it('opens add integration modal when add button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedIntegrationsPanel />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Click on Add Integration button
    await user.click(screen.getByRole('button', { name: /add integration/i }));
    
    // Check if modal appears
    expect(screen.getByText(/add new integration/i)).toBeInTheDocument();
    expect(screen.getByText(/select integration type/i)).toBeInTheDocument();
    
    // Close the modal
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText(/add new integration/i)).not.toBeInTheDocument();
    });
  });
  
  it('opens integration details when an integration card is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedIntegrationsPanel />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Wait for Google Calendar integration to appear
    await waitFor(() => {
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });
    
    // Get the first integration card
    const integrationCards = screen.getAllByText(/events processed/i);
    
    // Click on the first integration card
    await user.click(integrationCards[0]);
    
    // Check if detail modal appears
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
    
    // Close the modal
    await user.click(screen.getByRole('button', { name: /close/i }));
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });
});