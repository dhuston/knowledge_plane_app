/**
 * Tests for LazyPanel component
 */
import React, { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import LazyPanel from '../LazyPanel';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock performance.now
const originalNow = global.performance.now;
global.performance.now = jest.fn(() => 1000);

// Mock requestAnimationFrame
const originalRAF = global.requestAnimationFrame;
global.requestAnimationFrame = jest.fn(cb => {
  return setTimeout(() => cb(performance.now() + 200), 0);
});

// Mock cancelAnimationFrame
const originalCAF = global.cancelAnimationFrame;
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock framer-motion to prevent console warnings in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, initial, animate, variants, style, transition, ...props }: any) => (
        <div 
          {...props} 
          data-testid={props['data-testid'] || "motion-div"}
          data-initial={JSON.stringify(initial)}
          data-animate={animate}
          data-variants={JSON.stringify(variants)}
          data-transition={JSON.stringify(transition)}
          style={style}
        >
          {children}
        </div>
      )
    }
  };
});

// Create a component that suspends
const LazyComponent = ({ suspend = false }) => {
  if (suspend) {
    throw new Promise(() => {});
  }
  return <div data-testid="lazy-content">Lazy Content</div>;
};

describe('LazyPanel', () => {
  // Restore mocks after all tests
  afterAll(() => {
    global.performance.now = originalNow;
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        <LazyPanel active={true} tabId="test-tab">
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'panel-test-tab');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-test-tab');
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
    
    // Panel should not be visible
    const panel = screen.getByRole('tabpanel');
    expect(panel).not.toBeVisible();
    
    // But content should still be in the DOM
    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
  });
  
  it('renders custom fallback when provided', async () => {
    render(
      <ChakraProvider>
        <LazyPanel 
          active={true} 
          tabId="test" 
          fallback={<div data-testid="custom-fallback">Custom Loading...</div>}
          showLoading={true}
        >
          <Suspense fallback={<div>Default Suspense</div>}>
            <LazyComponent />
          </Suspense>
        </LazyPanel>
      </ChakraProvider>
    );
    
    // Advance loading timer
    act(() => {
      jest.runAllTimers();
    });
    
    // Content should render after loading
    expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
  });

  it('applies different animation variants', () => {
    // Test 'fade' variant (default)
    render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test1">
          <div>Fade animation</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    let motionDiv = screen.getByTestId('motion-div');
    let variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
    expect(variants.hidden).toEqual({ opacity: 0 });
    expect(variants.visible.opacity).toBe(1);
    
    // Test 'slide' variant
    const { unmount } = render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test2" animationVariant="slide">
          <div>Slide animation</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    motionDiv = screen.getByTestId('motion-div');
    variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
    expect(variants.hidden).toEqual({ opacity: 0, y: 10 });
    unmount();
    
    // Test 'scale' variant
    render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test3" animationVariant="scale">
          <div>Scale animation</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    motionDiv = screen.getByTestId('motion-div');
    variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
    expect(variants.hidden).toEqual({ opacity: 0, scale: 0.97 });
  });

  it('customizes transition duration', () => {
    render(
      <ChakraProvider>
        <LazyPanel active={true} tabId="test" transitionDuration={0.75}>
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    const motionDiv = screen.getByTestId('motion-div');
    const transition = JSON.parse(motionDiv.getAttribute('data-transition') || '{}');
    expect(transition.duration).toBe(0.75);
  });

  it('uses custom data-testid when provided', () => {
    render(
      <ChakraProvider>
        <LazyPanel 
          active={true} 
          tabId="test" 
          data-testid="custom-panel-id"
        >
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('custom-panel-id')).toBeInTheDocument();
    expect(screen.getByTestId('custom-panel-id-content')).toBeInTheDocument();
  });

  it('adds maintainHeight styles when specified', () => {
    // Mock offsetHeight
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 200
    });

    render(
      <ChakraProvider>
        <LazyPanel 
          active={true} 
          tabId="test" 
          maintainHeight={true}
        >
          <div>Test content</div>
        </LazyPanel>
      </ChakraProvider>
    );
    
    // Trigger resize observer callback
    act(() => {
      // Get the callback that was passed to ResizeObserver constructor
      const resizeCallback = (global.ResizeObserver as jest.Mock).mock.calls[0][0];
      // Call it with a mock entry
      resizeCallback([{ target: document.createElement('div') }]);
    });
    
    const panel = screen.getByRole('tabpanel');
    expect(panel.style.height).toBe('200px');
  });
});