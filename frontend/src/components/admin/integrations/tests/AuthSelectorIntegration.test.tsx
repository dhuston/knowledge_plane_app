import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { IntegrationDetailModal } from '../IntegrationDetailModal';
import { IntegrationType, IntegrationStatus } from '../models/IntegrationModels';

// Mock functions
const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

// Test integration with multiple auth types
const testIntegration = {
  id: 'test-integration',
  name: 'Test Integration',
  description: 'Integration for testing',
  type: IntegrationType.CALENDAR,
  status: IntegrationStatus.INACTIVE,
  authTypes: ['oauth2', 'api_key', 'basic_auth'],
  logoUrl: 'test-logo.png',
  version: '1.0.0',
  createdAt: '2023-01-01T00:00:00Z',
};

describe('AuthSelector Integration with DetailModal', () => {
  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnSave.mockReset();
  });
  
  test('AuthSelector is rendered in IntegrationDetailModal when integration has authTypes', () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          integration={testIntegration}
        />
      </ChakraProvider>
    );
    
    // Check that the authentication section is rendered
    expect(screen.getByText('Authentication Method')).toBeInTheDocument();
    
    // Check that all auth type tabs are rendered
    expect(screen.getByRole('tab', { name: /OAuth 2.0/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /API Key/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Basic Auth/i })).toBeInTheDocument();
  });
  
  test('Switching between auth types works correctly', async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          integration={testIntegration}
        />
      </ChakraProvider>
    );
    
    // By default, OAuth2 tab should be selected
    expect(screen.getByLabelText('Client ID')).toBeInTheDocument();
    
    // Switch to API Key tab
    const apiKeyTab = screen.getByRole('tab', { name: /API Key/i });
    fireEvent.click(apiKeyTab);
    
    // API Key fields should now be visible
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    
    // Switch to Basic Auth tab
    const basicAuthTab = screen.getByRole('tab', { name: /Basic Auth/i });
    fireEvent.click(basicAuthTab);
    
    // Basic Auth fields should now be visible
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
  
  test('Saving integration with auth configuration works correctly', async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          integration={testIntegration}
        />
      </ChakraProvider>
    );
    
    // Fill in basic info
    const nameInput = screen.getByLabelText('Display Name');
    fireEvent.change(nameInput, { target: { value: 'Test Integration Updated' } });
    
    // Fill in OAuth2 credentials
    const clientIdInput = screen.getByLabelText('Client ID');
    fireEvent.change(clientIdInput, { target: { value: 'test-client-id' } });
    
    const clientSecretInput = screen.getByLabelText('Client Secret');
    fireEvent.change(clientSecretInput, { target: { value: 'test-client-secret' } });
    
    const authUrlInput = screen.getByLabelText('Authorization URL');
    fireEvent.change(authUrlInput, { target: { value: 'https://auth.example.com/authorize' } });
    
    const tokenUrlInput = screen.getByLabelText('Token URL');
    fireEvent.change(tokenUrlInput, { target: { value: 'https://auth.example.com/token' } });
    
    // Save the configuration
    fireEvent.click(screen.getByText('Save Configuration'));
    
    // Check that onSave was called with the correct data
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Integration Updated',
        authConfig: expect.objectContaining({
          type: 'oauth2',
          configuration: expect.objectContaining({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            authorizationUrl: 'https://auth.example.com/authorize',
            tokenUrl: 'https://auth.example.com/token'
          })
        })
      })
    );
  });
  
  test('IntegrationDetailModal does not render AuthSelector when integration has no authTypes', () => {
    const integrationWithoutAuth = {
      ...testIntegration,
      authTypes: undefined
    };
    
    render(
      <ChakraProvider>
        <IntegrationDetailModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          integration={integrationWithoutAuth}
        />
      </ChakraProvider>
    );
    
    // Authentication section should not be rendered
    expect(screen.queryByText('Authentication Method')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /OAuth 2.0/i })).not.toBeInTheDocument();
  });
});