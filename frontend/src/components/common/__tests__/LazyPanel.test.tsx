/**
 * Tests for LazyPanel component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import LazyPanel from '../LazyPanel';

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

describe('LazyPanel', () => {
  it('renders children when active is true', () => {
    render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test">
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('hides content when active is false', () => {
    render(
      <ChakraProvider>
        <LazyPanel active={false} tabId="test">
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    const panel = screen.getByRole('tabpanel');
    expect(panel).not.toBeVisible();
  });
  
  it('sets correct ARIA attributes', () => {
    render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test">
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'panel-test');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-test');
  });
  
  it('unmounts children when keepMounted is false', () => {
    const { rerender } = render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test" keepMounted={false}>
          <div data-testid="test-child">Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    
    // Change active to false
    rerender(
      <ChakraProvider>
        <LazyPanel active={false} tabId="test" keepMounted={false}>
          <div data-testid="test-child">Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
  });
  
  it('keeps children mounted when keepMounted is true', () => {
    const { rerender } = render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test" keepMounted={true}>
          <div data-testid="test-child">Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    
    // Change active to false
    rerender(
      <ChakraProvider>
        <LazyPanel active={false} tabId="test" keepMounted={true}>
          <div data-testid="test-child">Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    // Child should still be in the DOM but not visible
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).not.toBeVisible();
  });
  
  it('renders fallback when provided', () => {
    render(
      <ChakraProvider>
        <LazyPanel 
          active={true} 
          tabId="test" 
          fallback={<div data-testid="fallback">Loading...</div>}
          showLoading={true}
        >
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    // Content should be rendered, fallback only shows during suspense
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });
});