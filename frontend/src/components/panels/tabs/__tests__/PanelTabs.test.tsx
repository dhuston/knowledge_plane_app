/**
 * Tests for the PanelTabs component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PanelTabs, { PanelTabType } from '../PanelTabs';
import { ChakraProvider } from '@chakra-ui/react';
import * as featureFlagsModule from '../../../../utils/featureFlags';

// Mock the useFeatureFlags hook
jest.mock('../../../../utils/featureFlags', () => ({
  useFeatureFlags: jest.fn()
}));

// Mock framer-motion to prevent console warnings in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => (
        <div {...props} data-testid="motion-div">{children}</div>
      )
    }
  };
});

describe('PanelTabs', () => {
  // Setup the feature flags mock
  beforeEach(() => {
    (featureFlagsModule.useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableActivityTimeline: true
      }
    });
  });

  it('renders all tabs when feature flags are enabled', () => {
    render(
      <ChakraProvider>
        <PanelTabs activeTab="details" onTabChange={() => {}} />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });
  
  it('hides Activity tab when feature flag is disabled', () => {
    (featureFlagsModule.useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableActivityTimeline: false
      }
    });
    
    render(
      <ChakraProvider>
        <PanelTabs activeTab="details" onTabChange={() => {}} />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.queryByText('Activity')).not.toBeInTheDocument();
  });
  
  it('sets aria-selected based on active tab', () => {
    render(
      <ChakraProvider>
        <PanelTabs activeTab="related" onTabChange={() => {}} />
      </ChakraProvider>
    );
    
    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    const relatedTab = screen.getByRole('tab', { name: 'Relationships' });
    const activityTab = screen.getByRole('tab', { name: 'Activity' });
    
    expect(detailsTab).toHaveAttribute('aria-selected', 'false');
    expect(relatedTab).toHaveAttribute('aria-selected', 'true');
    expect(activityTab).toHaveAttribute('aria-selected', 'false');
  });
  
  it('calls onTabChange when a tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    
    render(
      <ChakraProvider>
        <PanelTabs activeTab="details" onTabChange={mockOnTabChange} />
      </ChakraProvider>
    );
    
    // Click on the related tab
    fireEvent.click(screen.getByRole('tab', { name: 'Relationships' }));
    expect(mockOnTabChange).toHaveBeenCalledWith('related');
    
    // Click on the activity tab
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(mockOnTabChange).toHaveBeenCalledWith('activity');
  });
  
  it('renders the animated indicator', () => {
    render(
      <ChakraProvider>
        <PanelTabs activeTab="details" onTabChange={() => {}} />
      </ChakraProvider>
    );
    
    // The indicator should be present in the DOM
    expect(screen.getByTestId('tab-indicator')).toBeInTheDocument();
  });
  
  it('has proper ARIA attributes for accessibility', () => {
    render(
      <ChakraProvider>
        <PanelTabs activeTab="details" onTabChange={() => {}} />
      </ChakraProvider>
    );
    
    // Check for proper ARIA attributes
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Panel sections');
    
    // Each tab should control a panel
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-controls', 'panel-details');
    expect(screen.getByRole('tab', { name: 'Relationships' })).toHaveAttribute('aria-controls', 'panel-related');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-controls', 'panel-activity');
  });
});