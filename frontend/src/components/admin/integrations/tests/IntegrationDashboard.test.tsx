/**
 * Integration Dashboard Component Tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';

import { Integration, IntegrationType } from '../models/IntegrationModels';
import IntegrationDashboard from '../IntegrationDashboard';

// Mock data for tests
const mockIntegrationTypes: IntegrationType[] = [
  {
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
        },
      },
    },
    credentialSchema: {
      properties: {
        clientId: {
          type: 'string',
          title: 'Client ID',
        },
      },
    },
    authTypes: ['oauth2'],
  },
  {
    id: 'messaging_slack',
    name: 'Slack',
    description: 'Connect to Slack workspaces',
    category: 'messaging',
    supportedEntityTypes: ['message', 'channel', 'user'],
    configSchema: {
      properties: {
        workspace: {
          type: 'string',
          title: 'Workspace',
        },
      },
    },
    credentialSchema: {
      properties: {
        token: {
          type: 'string',
          title: 'API Token',
        },
      },
    },
    authTypes: ['api_key'],
  },
];

const mockIntegrations: Integration[] = [
  {
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
    },
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Team Slack',
    type: 'messaging_slack',
    status: 'error',
    config: {
      workspace: 'team-workspace',
    },
    lastSync: '2023-04-28T09:30:00Z',
    metrics: {
      eventsProcessed: 156,
      successRate: 45.2,
      avgProcessTime: 1.2,
    },
    createdAt: '2023-01-15T08:20:00Z',
  },
];

// Mock the API Client hook
jest.mock('../../../hooks/useApiClient', () => ({
  __esModule: true,
  useApiClient: () => ({
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('integration-types')) {
        return Promise.resolve({ data: mockIntegrationTypes });
      }
      if (url.includes('integrations')) {
        return Promise.resolve({ data: mockIntegrations });
      }
      return Promise.reject(new Error('Not found'));
    }),
    post: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: { ...mockIntegrations[0], id: '3' } });
    }),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Mock modals
jest.mock('../modals/IntegrationDetailModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, integration }) => (
    <div data-testid="integration-detail-modal">
      {isOpen && (
        <div>
          <div>Integration Detail: {integration?.name}</div>
          <button onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  ),
}));

jest.mock('../modals/NewIntegrationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) => (
    <div data-testid="new-integration-modal">
      {isOpen && (
        <div>
          <div>New Integration Modal</div>
          <button onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  ),
}));

// Test suite
describe('IntegrationDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with integrations', async () => {
    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );

    // Initially should show loading state
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });
    
    // Check that both integrations are rendered
    expect(screen.getByText('My Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Team Slack')).toBeInTheDocument();
    
    // Check that category filters are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Messaging')).toBeInTheDocument();
  });

  test('filters integrations by category', async () => {
    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });
    
    // Initially all integrations should be visible
    expect(screen.getByText('My Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Team Slack')).toBeInTheDocument();
    
    // Click on Calendar filter
    fireEvent.click(screen.getByText('Calendar'));
    
    // Only Calendar integrations should be visible
    expect(screen.getByText('My Google Calendar')).toBeInTheDocument();
    expect(screen.queryByText('Team Slack')).not.toBeInTheDocument();
    
    // Click on Messaging filter
    fireEvent.click(screen.getByText('Messaging'));
    
    // Only Messaging integrations should be visible
    expect(screen.queryByText('My Google Calendar')).not.toBeInTheDocument();
    expect(screen.getByText('Team Slack')).toBeInTheDocument();
    
    // Click on All filter
    fireEvent.click(screen.getByText('All'));
    
    // All integrations should be visible again
    expect(screen.getByText('My Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Team Slack')).toBeInTheDocument();
  });

  test('opens new integration modal when Add Integration button is clicked', async () => {
    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });
    
    // Click on Add Integration button
    fireEvent.click(screen.getByText('Add Integration'));
    
    // Check that the modal is open
    await waitFor(() => {
      expect(screen.getByTestId('new-integration-modal')).toBeInTheDocument();
      expect(screen.getByText('New Integration Modal')).toBeInTheDocument();
    });
    
    // Close the modal
    fireEvent.click(screen.getByText('Close'));
    
    // Check that the modal is closed
    await waitFor(() => {
      expect(screen.queryByText('New Integration Modal')).not.toBeInTheDocument();
    });
  });

  test('opens integration detail modal when an integration card is clicked', async () => {
    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });
    
    // Click on an integration card
    fireEvent.click(screen.getByText('My Google Calendar'));
    
    // Check that the detail modal is open
    await waitFor(() => {
      expect(screen.getByTestId('integration-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Integration Detail: My Google Calendar')).toBeInTheDocument();
    });
    
    // Close the modal
    fireEvent.click(screen.getByText('Close'));
    
    // Check that the modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Integration Detail: My Google Calendar')).not.toBeInTheDocument();
    });
  });

  test('displays empty state when no integrations match filter', async () => {
    // Mock empty integrations data
    jest.mock('../../../hooks/useApiClient', () => ({
      __esModule: true,
      useApiClient: () => ({
        get: jest.fn().mockImplementation((url) => {
          if (url.includes('integration-types')) {
            return Promise.resolve({ data: mockIntegrationTypes });
          }
          if (url.includes('integrations')) {
            return Promise.resolve({ data: [] });
          }
          return Promise.reject(new Error('Not found'));
        }),
      }),
    }));

    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });
    
    // Should show empty state
    expect(screen.getByText(/No integrations found/)).toBeInTheDocument();
    expect(screen.getByText(/Add Integration/)).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mock('../../../hooks/useApiClient', () => ({
      __esModule: true,
      useApiClient: () => ({
        get: jest.fn().mockImplementation(() => {
          return Promise.reject(new Error('API Error'));
        }),
      }),
    }));

    render(
      <ChakraProvider>
        <IntegrationDashboard />
      </ChakraProvider>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
      expect(screen.getByText(/Error loading integrations/)).toBeInTheDocument();
    });
    
    // Should show retry button
    expect(screen.getByText(/Retry/)).toBeInTheDocument();
  });
});