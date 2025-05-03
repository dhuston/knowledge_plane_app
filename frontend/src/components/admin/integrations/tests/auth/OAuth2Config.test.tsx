/**
 * OAuth2Config Component Tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';

import OAuth2Config from '../../auth/OAuth2Config';
import { OAuth2CredentialConfig } from '../../models/IntegrationModels';

// Mock the API client
jest.mock('../../../../../hooks/useApiClient', () => ({
  __esModule: true,
  useApiClient: () => ({
    post: jest.fn().mockImplementation((url) => {
      if (url.includes('test-auth')) {
        return Promise.resolve({
          data: {
            status: 'success',
            access_token: 'mock-access-token',
            expires_at: '2023-12-31T23:59:59Z'
          }
        });
      }
      return Promise.resolve({ data: {} });
    })
  })
}));

// Mock window.location
const mockLocationAssign = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/current-page',
    origin: 'https://example.com',
    assign: mockLocationAssign
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test suite
describe('OAuth2Config Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  // Initial configuration for testing
  const initialConfig: Partial<OAuth2CredentialConfig> = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authorizationUrl: 'https://example.com/oauth/authorize',
    tokenUrl: 'https://example.com/oauth/token',
    scopes: ['read:data', 'write:data'],
    redirectUri: 'https://example.com/callback',
    grantType: 'authorization_code'
  };

  test('renders with initial configuration', () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={initialConfig}
          onConfigChange={onConfigChange}
        />
      </ChakraProvider>
    );

    // Check that form elements are rendered with initial values
    expect(screen.getByDisplayValue('test-client-id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('authorization_code')).toBeInTheDocument();
    
    // Client secret should be masked
    const clientSecretInput = screen.getByLabelText(/Client Secret/i);
    expect(clientSecretInput).toHaveAttribute('type', 'password');
    
    // Scopes should be joined with spaces
    expect(screen.getByDisplayValue('read:data write:data')).toBeInTheDocument();
  });

  test('toggles client secret visibility', () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={initialConfig}
          onConfigChange={onConfigChange}
        />
      </ChakraProvider>
    );

    // Initially client secret should be masked
    const clientSecretInput = screen.getByLabelText(/Client Secret/i);
    expect(clientSecretInput).toHaveAttribute('type', 'password');
    
    // Toggle visibility
    const toggleButton = screen.getByRole('button', { name: /Show client secret/i });
    fireEvent.click(toggleButton);
    
    // Now client secret should be visible
    expect(clientSecretInput).toHaveAttribute('type', 'text');
    
    // Toggle again
    fireEvent.click(toggleButton);
    
    // Client secret should be masked again
    expect(clientSecretInput).toHaveAttribute('type', 'password');
  });

  test('validates form fields', async () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={{
            type: 'oauth2',
            grantType: 'authorization_code'
          }}
          onConfigChange={onConfigChange}
        />
      </ChakraProvider>
    );

    // Click authenticate button without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /Authenticate/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Client ID is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Client Secret is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Authorization URL is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Token URL is required/i)).toBeInTheDocument();
    });
  });

  test('handles client credentials grant type authentication', async () => {
    const onConfigChange = jest.fn();
    const onAuthComplete = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={{
            type: 'oauth2',
            grantType: 'client_credentials',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: ['read:data']
          }}
          onConfigChange={onConfigChange}
          onAuthComplete={onAuthComplete}
        />
      </ChakraProvider>
    );

    // Click authenticate button
    fireEvent.click(screen.getByRole('button', { name: /Authenticate/i }));
    
    // Should show loading state
    expect(screen.getByRole('button', { name: /Authenticate/i })).toHaveAttribute('aria-busy', 'true');
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByText(/Authentication successful/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Authenticated/i })).toBeInTheDocument();
    });
    
    // Should call onAuthComplete with success
    expect(onAuthComplete).toHaveBeenCalledWith(true);
    
    // Should update config with token
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'mock-access-token',
      expiresAt: '2023-12-31T23:59:59Z'
    }));
  });

  test('initiates authorization code flow correctly', async () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={initialConfig}
          onConfigChange={onConfigChange}
        />
      </ChakraProvider>
    );

    // Click authenticate button
    fireEvent.click(screen.getByRole('button', { name: /Authenticate/i }));
    
    // Should store state in localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^oauth_state_test-integration$/), 
        expect.any(String)
      );
    });
    
    // Should redirect to authorization URL
    await waitFor(() => {
      expect(window.location.href).toMatch(/^https:\/\/example\.com\/oauth\/authorize\?/);
      expect(window.location.href).toContain('client_id=test-client-id');
      expect(window.location.href).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(window.location.href).toContain('response_type=code');
      expect(window.location.href).toContain('state=');
      expect(window.location.href).toContain('scope=read%3Adata+write%3Adata');
    });
  });

  test('disables fields during form submission', async () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={initialConfig}
          onConfigChange={onConfigChange}
          isSubmitting={true}
        />
      </ChakraProvider>
    );

    // All inputs should be disabled
    expect(screen.getByLabelText(/Client ID/i)).toBeDisabled();
    expect(screen.getByLabelText(/Client Secret/i)).toBeDisabled();
    expect(screen.getByLabelText(/Authorization URL/i)).toBeDisabled();
    expect(screen.getByLabelText(/Token URL/i)).toBeDisabled();
    expect(screen.getByLabelText(/Scopes/i)).toBeDisabled();
    
    // Authenticate button should show loading state
    expect(screen.getByRole('button', { name: /Authenticate/i })).toHaveAttribute('aria-busy', 'true');
  });

  test('handles input changes correctly', () => {
    const onConfigChange = jest.fn();
    
    render(
      <ChakraProvider>
        <OAuth2Config 
          integrationId="test-integration"
          initialConfig={{
            type: 'oauth2',
            grantType: 'authorization_code'
          }}
          onConfigChange={onConfigChange}
        />
      </ChakraProvider>
    );

    // Change client ID
    const clientIdInput = screen.getByLabelText(/Client ID/i);
    fireEvent.change(clientIdInput, { target: { value: 'new-client-id' } });
    
    // Change scopes
    const scopesInput = screen.getByLabelText(/Scopes/i);
    fireEvent.change(scopesInput, { target: { value: 'read write delete' } });
    
    // Should call onConfigChange with updated values
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'new-client-id',
      scopes: ['read', 'write', 'delete']
    }));
  });
});