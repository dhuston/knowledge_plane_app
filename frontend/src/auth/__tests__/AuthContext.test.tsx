import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth, AuthContext } from '../AuthContext';
import { AuthClient } from '../AuthClient';
import { TokenManager } from '../TokenManager';

// Mock dependencies
jest.mock('../AuthClient');
jest.mock('../TokenManager');

const MockedAuthClient = AuthClient as jest.MockedClass<typeof AuthClient>;
const MockedTokenManager = TokenManager as jest.MockedClass<typeof TokenManager>;

// Test component to use the auth hook
const TestComponent: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error, 
    login, 
    logout, 
    demoLogin,
    clearError 
  } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no user'}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <button data-testid="login" onClick={() => login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button data-testid="demo-login" onClick={() => demoLogin('test-tenant-id')}>Demo Login</button>
      <button data-testid="logout" onClick={() => logout()}>Logout</button>
      <button data-testid="clear-error" onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockAuthClient: jest.Mocked<AuthClient>;
  let mockTokenManager: jest.Mocked<TokenManager>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AuthClient mock
    mockAuthClient = new MockedAuthClient() as jest.Mocked<AuthClient>;
    MockedAuthClient.mockImplementation(() => mockAuthClient);
    
    // Setup TokenManager mock
    mockTokenManager = new MockedTokenManager() as jest.Mocked<TokenManager>;
    MockedTokenManager.mockImplementation(() => mockTokenManager);
    
    // Default mock implementations
    mockTokenManager.getToken = jest.fn().mockReturnValue(null);
    mockAuthClient.getCurrentUser = jest.fn().mockResolvedValue({ success: false, error: 'Not authenticated' });
    mockAuthClient.login = jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
    mockAuthClient.logout = jest.fn().mockResolvedValue({ success: true });
    mockAuthClient.demoLogin = jest.fn().mockResolvedValue({ success: false, error: 'Invalid tenant' });
  });

  it('initializes with not authenticated state and starts loading user', async () => {
    // Render the component and wait for initial state to update
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading should be true
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('no user');
    expect(screen.getByTestId('error').textContent).toBe('no error');
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verify getCurrentUser was called
    expect(mockAuthClient.getCurrentUser).toHaveBeenCalled();
  });

  it('checks token and loads user when token exists', async () => {
    // Setup token manager to return a token
    mockTokenManager.getToken = jest.fn().mockReturnValue('existing-token');
    
    // Setup auth client to return a user
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    };
    mockAuthClient.getCurrentUser = jest.fn().mockResolvedValue({
      success: true,
      user: mockUser
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verify getCurrentUser was called
    expect(mockAuthClient.getCurrentUser).toHaveBeenCalled();
  });

  it('handles login success', async () => {
    // Setup auth client to return success
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    };
    mockAuthClient.login = jest.fn().mockResolvedValue({
      success: true,
      token: 'new-token'
    });
    mockAuthClient.getCurrentUser = jest.fn().mockResolvedValue({
      success: true,
      user: mockUser
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click login button
    await act(async () => {
      screen.getByTestId('login').click();
    });
    
    // Should be loading during login
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('no error');
    });
    
    // Verify methods were called
    expect(mockAuthClient.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
    expect(mockAuthClient.getCurrentUser).toHaveBeenCalled();
  });

  it('handles login failure', async () => {
    // Setup auth client to return failure
    mockAuthClient.login = jest.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click login button
    await act(async () => {
      screen.getByTestId('login').click();
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('no user');
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
    
    // Verify methods were called
    expect(mockAuthClient.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
    expect(mockAuthClient.getCurrentUser).not.toHaveBeenCalled();
  });

  it('handles demo login success', async () => {
    // Setup auth client to return success
    const mockUser = {
      id: 'user-id',
      email: 'demo@example.com',
      name: 'Demo User'
    };
    mockAuthClient.demoLogin = jest.fn().mockResolvedValue({
      success: true,
      token: 'demo-token'
    });
    mockAuthClient.getCurrentUser = jest.fn().mockResolvedValue({
      success: true,
      user: mockUser
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click demo login button
    await act(async () => {
      screen.getByTestId('demo-login').click();
    });
    
    // Should be loading during login
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verify methods were called
    expect(mockAuthClient.demoLogin).toHaveBeenCalledWith('test-tenant-id');
    expect(mockAuthClient.getCurrentUser).toHaveBeenCalled();
  });

  it('handles logout', async () => {
    // First set authenticated state with a user
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    };
    mockAuthClient.getCurrentUser = jest.fn()
      .mockResolvedValueOnce({
        success: true,
        user: mockUser
      })
      // After logout, getCurrentUser should fail
      .mockResolvedValueOnce({
        success: false,
        error: 'Not authenticated'
      });
    mockTokenManager.getToken = jest.fn().mockReturnValue('existing-token');
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
    
    // Click logout button
    await act(async () => {
      screen.getByTestId('logout').click();
    });
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('no user');
    });
    
    // Verify logout was called
    expect(mockAuthClient.logout).toHaveBeenCalled();
  });

  it('clears error state when requested', async () => {
    // Setup auth client to return failure
    mockAuthClient.login = jest.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });
    
    // Render the component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click login button to trigger an error
    await act(async () => {
      screen.getByTestId('login').click();
    });
    
    // Wait for login to fail with error
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
    
    // Click clear error button
    await act(async () => {
      screen.getByTestId('clear-error').click();
    });
    
    // Error should be cleared
    expect(screen.getByTestId('error').textContent).toBe('no error');
  });
});