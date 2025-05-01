import React from 'react'; // Ensure React is imported
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom'; // Use MemoryRouter for tests
import App from './App'; // Assuming LoginPage is exported or tested via App routing

// Helper function to render with Router and ChakraProvider
// Note: We need ChakraProvider for components using Chakra features
import { ChakraProvider } from '@chakra-ui/react';

const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route)

  return render(ui, {
    // Use React.ReactNode for children type
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[route]}>
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </MemoryRouter>
    ),
  });
};

describe('LoginPage', () => {
  it('renders the login page correctly', () => {
    // Render the App component and navigate to the /login route
    renderWithProviders(<App />, { route: '/login' });

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /welcome to knowledgeplane ai/i })).toBeInTheDocument();

    // Check for the login buttons (can check by role or text)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  // We could add a test for the fake navigation click later if needed
});

// Add tests for other pages/components here later 