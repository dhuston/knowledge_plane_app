import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import AdminLayout from '../common/AdminLayout';
import IntegrationsPanel from '../integrations/EnhancedIntegrationsPanel';
import FeatureFlags from '../features/EnhancedFeatureFlags';

// Mock router hooks
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin/dashboard' }),
}));

// Mock API client
jest.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockImplementation((url) => {
      if (url.includes('integrations')) {
        return Promise.resolve({ 
          data: [
            {
              id: '1',
              name: 'Test Integration',
              type: 'calendar_google',
              status: 'active',
              last_sync_time: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }
          ] 
        });
      }
      if (url.includes('feature-flags')) {
        return Promise.resolve({ 
          data: {
            enableDeltaStream: {
              key: 'enableDeltaStream',
              enabled: true,
              description: 'Enable real-time data streaming',
              category: 'Real-time Features'
            },
            enableAnalytics: {
              key: 'enableAnalytics',
              enabled: false,
              description: 'Enable analytics features',
              category: 'Visualization Features'
            }
          }
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  }),
}));

// Mock feature flags hook
jest.mock('../../../utils/featureFlags', () => ({
  useFeatureFlags: () => ({
    flags: {
      enableDeltaStream: true,
      enableAnalytics: false
    },
    isEnabled: (flag: string) => flag === 'enableDeltaStream',
  }),
}));

describe('Admin Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AdminLayout', () => {
    test('renders with title and children', () => {
      render(
        <ChakraProvider>
          <AdminLayout title="Test Admin Page">
            <div data-testid="admin-content">Admin Content</div>
          </AdminLayout>
        </ChakraProvider>
      );
      
      expect(screen.getByText('Test Admin Page')).toBeInTheDocument();
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  describe('IntegrationsPanel', () => {
    test('renders integration management panel', async () => {
      render(
        <ChakraProvider>
          <IntegrationsPanel />
        </ChakraProvider>
      );
      
      // Initial loading state should show
      expect(await screen.findByText(/Integration Management/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/Add Integration/i)).toBeInTheDocument();
      });
    });
  });

  describe('FeatureFlags', () => {
    test('renders feature flags panel', async () => {
      render(
        <ChakraProvider>
          <FeatureFlags />
        </ChakraProvider>
      );
      
      // Panel should load
      expect(await screen.findByText(/Feature Flags/i)).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/Enable real-time data streaming/i)).toBeInTheDocument();
        expect(screen.getByText(/Enable analytics features/i)).toBeInTheDocument();
      });
    });
  });
});