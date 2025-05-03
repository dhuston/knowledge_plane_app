/**
 * Integration Card Component Tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';

import { Integration, IntegrationType } from '../models/IntegrationModels';
import IntegrationCard from '../IntegrationCard';

// Mock data for tests
const mockIntegrationType: IntegrationType = {
  id: 'calendar_google',
  name: 'Google Calendar',
  description: 'Sync events from Google Calendar',
  category: 'calendar',
  icon: 'https://example.com/google-calendar-icon.svg',
  supportedEntityTypes: ['event', 'calendar'],
  configSchema: {
    properties: {
      calendarId: {
        type: 'string',
        title: 'Calendar ID',
        description: 'The ID of the calendar to sync',
      },
    },
  },
  credentialSchema: {
    properties: {
      clientId: {
        type: 'string',
        title: 'Client ID',
      },
      clientSecret: {
        type: 'string',
        title: 'Client Secret',
      },
    },
  },
  authTypes: ['oauth2'],
};

const mockActiveIntegration: Integration = {
  id: '1',
  name: 'My Google Calendar',
  type: 'calendar_google',
  status: 'active',
  config: {
    calendarId: 'primary',
  },
  lastSync: '2023-05-01T15:45:28Z',
  metrics: {
    eventsProcessed: 342,
    successRate: 99.4,
    avgProcessTime: 0.8,
    lastSyncTime: '2023-05-01T15:45:28Z',
  },
  createdAt: '2023-01-01T10:00:00Z',
};

const mockErrorIntegration: Integration = {
  id: '2',
  name: 'Broken Calendar',
  type: 'calendar_google',
  status: 'error',
  config: {
    calendarId: 'primary',
  },
  lastSync: '2023-05-01T15:45:28Z',
  metrics: {
    eventsProcessed: 0,
    successRate: 0,
    avgProcessTime: 0,
    lastSyncTime: '2023-05-01T15:45:28Z',
  },
  createdAt: '2023-01-01T10:00:00Z',
};

const mockInactiveIntegration: Integration = {
  id: '3',
  name: 'Inactive Calendar',
  type: 'calendar_google',
  status: 'inactive',
  config: {
    calendarId: 'secondary',
  },
  createdAt: '2023-01-01T10:00:00Z',
};

const mockConfiguringIntegration: Integration = {
  id: '4',
  name: 'New Calendar',
  type: 'calendar_google',
  status: 'configuring',
  config: {},
  createdAt: '2023-06-01T10:00:00Z',
};

// Mock handlers
const mockHandlers = {
  onSyncNow: jest.fn(),
  onConfigure: jest.fn(),
  onClick: jest.fn(),
};

// Test suite
describe('IntegrationCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders integration card with active status correctly', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Check that the card contains the integration name
    expect(screen.getByText('My Google Calendar')).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText('Sync events from Google Calendar')).toBeInTheDocument();
    
    // Check for active status badge
    const statusBadge = screen.getByText('active');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('chakra-badge');
    
    // Check for metrics
    expect(screen.getByText('342')).toBeInTheDocument(); // Events processed
    expect(screen.getByText('99.4%')).toBeInTheDocument(); // Success rate
    
    // Check for last sync time
    expect(screen.getByText(/Last sync/)).toBeInTheDocument();
  });

  test('renders integration card with error status correctly', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockErrorIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Check for error status badge
    const statusBadge = screen.getByText('error');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('chakra-badge');
    
    // Check for error message
    expect(screen.getByText(/Authentication error/)).toBeInTheDocument();
  });

  test('renders integration card with inactive status correctly', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockInactiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Check for inactive status badge
    const statusBadge = screen.getByText('inactive');
    expect(statusBadge).toBeInTheDocument();
    
    // Check that metrics are not displayed
    expect(screen.queryByText(/Events Processed/)).not.toBeInTheDocument();
    
    // Check for "Never synced" text
    expect(screen.getByText(/Never synced/)).toBeInTheDocument();
  });

  test('renders integration card with configuring status correctly', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockConfiguringIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Check for configuring status badge
    const statusBadge = screen.getByText('configuring');
    expect(statusBadge).toBeInTheDocument();
    
    // Check for progress bar
    expect(screen.getByText(/Configuration in progress/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('calls onSyncNow when Sync Now button is clicked', async () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Find and click the Sync Now button
    const syncButton = screen.getByText('Sync Now');
    fireEvent.click(syncButton);

    // Verify the onSyncNow handler was called with the integration ID
    await waitFor(() => {
      expect(mockHandlers.onSyncNow).toHaveBeenCalledWith(mockActiveIntegration.id);
    });

    // Verify event propagation was stopped (onClick should not be called)
    expect(mockHandlers.onClick).not.toHaveBeenCalled();
  });

  test('calls onConfigure when Configure button is clicked', async () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Find and click the Configure button
    const configureButton = screen.getByText('Configure');
    fireEvent.click(configureButton);

    // Verify the onConfigure handler was called with the integration
    await waitFor(() => {
      expect(mockHandlers.onConfigure).toHaveBeenCalledWith(mockActiveIntegration);
    });

    // Verify event propagation was stopped (onClick should not be called)
    expect(mockHandlers.onClick).not.toHaveBeenCalled();
  });

  test('calls onClick when card is clicked', async () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Get the card element and click it (not on a button)
    const card = screen.getByText('My Google Calendar').closest('.chakra-card');
    expect(card).not.toBeNull();
    
    if (card) {
      fireEvent.click(card);
    }

    // Verify the onClick handler was called with the integration
    await waitFor(() => {
      expect(mockHandlers.onClick).toHaveBeenCalledWith(mockActiveIntegration);
    });
  });

  test('Sync Now button is disabled for inactive integration', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockInactiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    // Find the Sync Now button and check that it's disabled
    const syncButton = screen.getByText('Sync Now');
    expect(syncButton).toBeDisabled();
  });

  test('renders with custom className', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
          className="custom-integration-card"
        />
      </ChakraProvider>
    );

    const card = screen.getByText('My Google Calendar').closest('.chakra-card');
    expect(card).toHaveClass('custom-integration-card');
  });

  test('renders with aria attributes for accessibility', () => {
    render(
      <ChakraProvider>
        <IntegrationCard 
          integration={mockActiveIntegration}
          integrationType={mockIntegrationType}
          onSyncNow={mockHandlers.onSyncNow}
          onConfigure={mockHandlers.onConfigure}
          onClick={mockHandlers.onClick}
        />
      </ChakraProvider>
    );

    const card = screen.getByText('My Google Calendar').closest('.chakra-card');
    expect(card).toHaveAttribute('aria-label', 'My Google Calendar integration');
    expect(card).toHaveAttribute('role', 'button');
  });
});