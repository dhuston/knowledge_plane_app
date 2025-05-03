import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EnhancedFeatureFlags from '../EnhancedFeatureFlags';
import { AdminProvider } from '../../../../context/AdminContext';

// Mock the feature flags hook
jest.mock('../../../../utils/featureFlags', () => ({
  useFeatureFlags: () => ({
    flags: {
      enableDeltaStream: true,
      enableIntegrations: true,
      enableAnalytics: false,
      enableSuggestions: true,
      enableActivityTimeline: false,
      enableTeamClustering: true,
      enableHierarchyNavigator: false
    },
    toggleFeature: jest.fn()
  }),
  FeatureFlags: {}
}));

// Mock setTimeout to avoid waiting in tests
jest.useFakeTimers();

describe('EnhancedFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the component with loading state', () => {
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    expect(screen.getByText('Feature Management')).toBeInTheDocument();
    
    // Should show loading skeletons initially
    const skeletons = screen.getAllByText('', { selector: '.chakra-skeleton' });
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('displays feature flags after loading', async () => {
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Check for feature names
      expect(screen.getByText('Delta Stream')).toBeInTheDocument();
      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      
      // Check for active/inactive badges
      expect(screen.getAllByText('active').length).toBe(4); // Assuming 4 active features
      expect(screen.getAllByText('inactive').length).toBe(3); // Assuming 3 inactive features
    });
  });
  
  it('allows searching features', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Search for "analytics"
    await user.type(screen.getByPlaceholderText('Search features...'), 'analytics');
    
    await waitFor(() => {
      // Should only show Analytics feature
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.queryByText('Delta Stream')).not.toBeInTheDocument();
      expect(screen.queryByText('Integrations')).not.toBeInTheDocument();
    });
  });
  
  it('allows filtering by category', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    // Wait for categories to appear in the select
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Select Visualization Features category
    await user.selectOptions(
      screen.getByRole('combobox'),
      'Visualization Features'
    );
    
    await waitFor(() => {
      // Should show Analytics and Team Clustering features
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Team Clustering')).toBeInTheDocument();
      expect(screen.queryByText('Delta Stream')).not.toBeInTheDocument();
    });
  });
  
  it('toggles feature flag state when switch is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const mockToggleFeature = jest.fn();
    
    // Override the mock to include our spy function
    jest.spyOn(require('../../../../utils/featureFlags'), 'useFeatureFlags').mockImplementation(() => ({
      flags: {
        enableDeltaStream: true,
        enableIntegrations: true,
        enableAnalytics: false
      },
      toggleFeature: mockToggleFeature
    }));
    
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Delta Stream')).toBeInTheDocument();
    });
    
    // Find the switch for Delta Stream
    const switches = screen.getAllByRole('checkbox');
    await user.click(switches[0]); // First switch (Delta Stream)
    
    expect(mockToggleFeature).toHaveBeenCalled();
    
    // Clean up mock
    jest.restoreAllMocks();
  });
  
  it('opens configuration modal when configure button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <AdminProvider>
        <EnhancedFeatureFlags />
      </AdminProvider>
    );
    
    // Fast-forward timer to complete loading
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Delta Stream')).toBeInTheDocument();
    });
    
    // Click configure button for Delta Stream
    const configButtons = screen.getAllByRole('button', { name: /configure feature/i });
    await user.click(configButtons[0]);
    
    // Check if modal appears
    expect(screen.getByText(/configure feature/i)).toBeInTheDocument();
    expect(screen.getByText('Feature ID')).toBeInTheDocument();
    
    // Close the modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Feature ID')).not.toBeInTheDocument();
    });
  });
});