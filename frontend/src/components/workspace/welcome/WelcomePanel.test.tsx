import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WelcomePanel } from './WelcomePanel';
import { ChakraProvider } from '@chakra-ui/react';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Jane Smith',
  role: 'Product Manager',
  avatarUrl: 'https://example.com/avatar.jpg',
};

// Mock the user context
vi.mock('../../../context/UserContext', () => ({
  useUserContext: () => ({
    user: mockUser,
    isLoading: false,
  }),
}));

// Mock the current time
const mockDate = new Date('2025-05-01T09:30:00');
vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

describe('WelcomePanel', () => {
  it('renders greeting with user name', () => {
    render(
      <ChakraProvider>
        <WelcomePanel />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/Good morning, Jane/i)).toBeInTheDocument();
  });

  it('renders user role information', () => {
    render(
      <ChakraProvider>
        <WelcomePanel />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/Product Manager/i)).toBeInTheDocument();
  });

  it('displays the current date', () => {
    render(
      <ChakraProvider>
        <WelcomePanel />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/May 1, 2025/i)).toBeInTheDocument();
  });

  it('shows loading state when user data is loading', () => {
    // Override the mock for this test
    vi.mock('../../../context/UserContext', () => ({
      useUserContext: () => ({
        user: null,
        isLoading: true,
      }),
    }), { virtual: true });
    
    render(
      <ChakraProvider>
        <WelcomePanel />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('welcome-skeleton')).toBeInTheDocument();
  });
  
  it('shows personalized insights', () => {
    render(
      <ChakraProvider>
        <WelcomePanel />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('personalized-insights')).toBeInTheDocument();
  });
});