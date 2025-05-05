import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SimplifiedLoginPage } from '../SimplifiedLoginPage';
import { AuthContext, AuthContextType } from '../../auth/AuthContext';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
}));

// Mock tenants data
const mockTenants = [
  { id: 'tenant-1', name: 'Pharma AI Demo' },
  { id: 'tenant-2', name: 'Tech Innovations Inc.' },
  { id: 'tenant-3', name: 'Metropolitan Health System' },
];

// Setup auth context mock
const createMockAuthContext = (overrides = {}): AuthContextType => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  demoLogin: jest.fn(),
  clearError: jest.fn(),
  ...overrides
});

describe('SimplifiedLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for tenants list
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTenants),
      })
    ) as jest.Mock;
  });

  it('renders login page with tabs', async () => {
    const mockAuth = createMockAuthContext();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Check for both tabs
    expect(screen.getByText('Standard Login')).toBeInTheDocument();
    expect(screen.getByText('Demo Login')).toBeInTheDocument();
    
    // Standard login form should be visible by default
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    const mockAuth = createMockAuthContext();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Switch to Demo Login tab
    fireEvent.click(screen.getByText('Demo Login'));
    
    // Should show tenant selection
    expect(screen.getByText('Select a demo tenant:')).toBeInTheDocument();
    
    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByText('Pharma AI Demo')).toBeInTheDocument();
    });
    
    // Switch back to Standard Login tab
    fireEvent.click(screen.getByText('Standard Login'));
    
    // Should show login form again
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('submits standard login form with credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    const mockAuth = createMockAuthContext({ login: mockLogin });
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Fill in the form
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Verify login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('displays error message when login fails', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: false });
    const mockAuth = createMockAuthContext({
      login: mockLogin,
      error: 'Invalid email or password'
    });
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Error message should be displayed
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('selects tenant and triggers demo login', async () => {
    const mockDemoLogin = jest.fn().mockResolvedValue({ success: true });
    const mockAuth = createMockAuthContext({ demoLogin: mockDemoLogin });
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Switch to Demo Login tab
    fireEvent.click(screen.getByText('Demo Login'));
    
    // Wait for tenants to load
    await waitFor(() => {
      expect(screen.getByText('Pharma AI Demo')).toBeInTheDocument();
    });
    
    // Select a tenant
    const tenantOption = screen.getByText('Pharma AI Demo');
    fireEvent.click(tenantOption);
    
    // Click login button
    const loginButton = screen.getByRole('button', { name: /login with selected tenant/i });
    fireEvent.click(loginButton);
    
    // Verify demoLogin was called with the correct tenant ID
    expect(mockDemoLogin).toHaveBeenCalledWith('tenant-1');
  });

  it('shows loading state during authentication', async () => {
    const mockLogin = jest.fn().mockImplementation(() => new Promise(resolve => {
      // Delay resolution to show loading state
      setTimeout(() => resolve({ success: true }), 100);
    }));
    
    const mockAuth = createMockAuthContext({
      login: mockLogin,
      isLoading: true
    });
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Should show loading indicator
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    
    // Submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /signing in.../i });
    expect(submitButton).toBeDisabled();
  });

  it('handles fetch error for tenants', async () => {
    // Mock fetch error
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('Failed to fetch tenants'))
    ) as jest.Mock;
    
    const mockAuth = createMockAuthContext();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Switch to Demo Login tab
    fireEvent.click(screen.getByText('Demo Login'));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tenants')).toBeInTheDocument();
    });
  });

  it('clears error when switching tabs', async () => {
    const mockClearError = jest.fn();
    const mockAuth = createMockAuthContext({
      error: 'Invalid email or password',
      clearError: mockClearError
    });
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuth}>
          <SimplifiedLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
    
    // Error should be displayed initially
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    
    // Switch to Demo Login tab
    fireEvent.click(screen.getByText('Demo Login'));
    
    // Verify clearError was called
    expect(mockClearError).toHaveBeenCalled();
  });
});