/**
 * Test file for AnimatedTransition component
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnimatedTransition, { 
  AnimationProvider, 
  useAnimation, 
  transitionVariants 
} from '../AnimatedTransition';
import * as chakraHooks from '@chakra-ui/react';

// Mock Chakra's usePrefersReducedMotion hook
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  usePrefersReducedMotion: jest.fn().mockReturnValue(false)
}));

// Mock framer-motion to prevent console warnings in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, initial, animate, exit, variants, custom, transition, style, layout, ...props }: any) => (
        <div 
          {...props} 
          data-testid={props['data-testid'] || 'motion-div'}
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-exit={JSON.stringify(exit)}
          data-variants={JSON.stringify(variants)}
          data-custom={JSON.stringify(custom)}
          data-transition={JSON.stringify(transition)}
          data-layout={layout?.toString()}
          style={{ 
            ...style,
            display: animate === 'exit' || style?.display === 'none' ? 'none' : 'block' 
          }}
        >
          {children}
        </div>
      )
    },
    AnimatePresence: ({ children, mode }: any) => (
      <div data-testid="animate-presence" data-mode={mode}>
        {children}
      </div>
    )
  };
});

// Custom hook tester component
const TestHookComponent = () => {
  const { animated, setAnimated, defaultDuration } = useAnimation();
  return (
    <div data-testid="hook-test">
      <span data-testid="animated-state">{animated.toString()}</span>
      <span data-testid="default-duration">{defaultDuration.toString()}</span>
      <button 
        data-testid="toggle-animation" 
        onClick={() => setAnimated(!animated)}
      >
        Toggle Animation
      </button>
    </div>
  );
};

describe('AnimatedTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chakraHooks.usePrefersReducedMotion as jest.Mock).mockReturnValue(false);
  });

  it('renders content when in=true', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition in={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByTestId('test-transition')).toBeVisible();
  });

  it('hides content when in=false and unmountOnExit=false', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition in={false} unmountOnExit={false} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // The content should still be in the DOM but not visible
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByTestId('test-transition')).not.toBeVisible();
  });
  
  it('removes content from the DOM when in=false and unmountOnExit=true', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition in={false} unmountOnExit={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // The content should be removed from the DOM
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-transition')).not.toBeInTheDocument();
  });
  
  it('disables animations when user prefers reduced motion', () => {
    // Mock user preferring reduced motion
    (chakraHooks.usePrefersReducedMotion as jest.Mock).mockReturnValue(true);
    
    render(
      <AnimationProvider>
        <AnimatedTransition in={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // Check that initial prop is false which means no animation
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('data-initial', 'false');
  });
  
  it('enables animations when forceAnimation=true, even with reduced motion preference', () => {
    // Mock user preferring reduced motion
    (chakraHooks.usePrefersReducedMotion as jest.Mock).mockReturnValue(true);
    
    render(
      <AnimationProvider>
        <AnimatedTransition in={true} forceAnimation={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // The element should have proper animation attributes
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('data-initial', '"initial"');
  });
  
  it('applies custom transition options', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeInOut' }}
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // Verify transition properties are applied
    const motionDiv = screen.getByTestId('test-transition');
    const transition = JSON.parse(motionDiv.getAttribute('data-transition') || '{}');
    expect(transition.duration).toBe(0.5);
    expect(transition.delay).toBe(0.1);
    expect(transition.ease).toBe('easeInOut');
  });
  
  it('accepts and applies different animation variants', () => {
    // Test slide variant
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          variant="slideUp"
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // Verify the correct variant is applied
    const motionDiv = screen.getByTestId('test-transition');
    const variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
    expect(variants.initial.y).toBe(10); // slideUp variant has y: 10
  });
  
  it('applies a unique key for transition when provided', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          transitionKey="unique-key-test"
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // The key is difficult to test directly, but we can verify
    // that the component renders correctly with the key applied
    expect(screen.getByTestId('test-transition')).toBeInTheDocument();
  });

  it('applies custom variants when provided', () => {
    const customVariants = {
      initial: { opacity: 0, rotateZ: -10 },
      animate: { opacity: 1, rotateZ: 0 },
      exit: { opacity: 0, rotateZ: 10 }
    };

    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          customVariants={customVariants}
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // Verify the custom variants are applied
    const motionDiv = screen.getByTestId('test-transition');
    const variants = JSON.parse(motionDiv.getAttribute('data-variants') || '{}');
    expect(variants.initial.rotateZ).toBe(-10);
    expect(variants.animate.rotateZ).toBe(0);
    expect(variants.exit.rotateZ).toBe(10);
  });

  it('applies layout animation when specified', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          layout={true}
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('data-layout', 'true');
  });

  it('applies customIndex for staggered animations', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          variant="staggerItems"
          customIndex={3}
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('data-custom', '3');
  });

  it('passes additional props to motion component', () => {
    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          aria-label="Test label"
          data-custom-attr="test-value"
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('aria-label', 'Test label');
    expect(motionDiv).toHaveAttribute('data-custom-attr', 'test-value');
  });

  it('passes motion props when provided', () => {
    const motionProps = {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 }
    };

    render(
      <AnimationProvider>
        <AnimatedTransition 
          in={true} 
          motionProps={motionProps}
          data-testid="test-transition"
        >
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // We can't easily test the whileHover/whileTap props but we can ensure
    // the component rendered correctly
    expect(screen.getByTestId('test-transition')).toBeInTheDocument();
  });
});

describe('AnimationProvider', () => {
  it('passes animation preferences to children', () => {
    (chakraHooks.usePrefersReducedMotion as jest.Mock).mockReturnValue(false);
    
    render(
      <AnimationProvider defaultAnimated={true}>
        <AnimatedTransition in={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('respects defaultAnimated=false setting', () => {
    (chakraHooks.usePrefersReducedMotion as jest.Mock).mockReturnValue(false);
    
    render(
      <AnimationProvider defaultAnimated={false}>
        <AnimatedTransition in={true} data-testid="test-transition">
          <div>Test content</div>
        </AnimatedTransition>
      </AnimationProvider>
    );
    
    // Check that initial prop is false which means no animation
    const motionDiv = screen.getByTestId('test-transition');
    expect(motionDiv).toHaveAttribute('data-initial', 'false');
  });

  it('respects custom default duration', () => {
    render(
      <AnimationProvider defaultDuration={0.8}>
        <TestHookComponent />
      </AnimationProvider>
    );
    
    expect(screen.getByTestId('default-duration')).toHaveTextContent('0.8');
  });

  it('allows toggling animation state', () => {
    render(
      <AnimationProvider>
        <TestHookComponent />
      </AnimationProvider>
    );
    
    expect(screen.getByTestId('animated-state')).toHaveTextContent('true');
    
    // Click the toggle button
    fireEvent.click(screen.getByTestId('toggle-animation'));
    
    expect(screen.getByTestId('animated-state')).toHaveTextContent('false');
  });
});

describe('useAnimation hook', () => {
  it('provides default values', () => {
    const { result } = renderHook(() => useAnimation(), {
      wrapper: ({ children }) => (
        <AnimationProvider>{children}</AnimationProvider>
      )
    });
    
    expect(result.current.animated).toBe(true);
    expect(result.current.defaultDuration).toBe(0.3);
  });
  
  it('allows controlling animation state', () => {
    const { result } = renderHook(() => useAnimation(), {
      wrapper: ({ children }) => (
        <AnimationProvider>{children}</AnimationProvider>
      )
    });
    
    // Initial state
    expect(result.current.animated).toBe(true);
    
    // Toggle animation
    act(() => {
      result.current.setAnimated(false);
    });
    
    expect(result.current.animated).toBe(false);
  });
});

describe('transitionVariants', () => {
  it('contains all expected variants', () => {
    const expectedVariants = [
      'fade', 'slideUp', 'slideDown', 'slideRight', 'slideLeft', 
      'panelInRight', 'panelInLeft', 'scale', 'contentFade', 
      'panelEntry', 'stagger', 'staggerItems', 'spring', 
      'subtle', 'tabTransition', 'drawer', 'crossfade'
    ];
    
    expectedVariants.forEach(variant => {
      expect(transitionVariants).toHaveProperty(variant);
    });
  });

  it('has correct properties for each variant', () => {
    // Test a few representative variants
    
    // Fade should have opacity transitions
    expect(transitionVariants.fade.initial).toHaveProperty('opacity', 0);
    expect(transitionVariants.fade.animate).toHaveProperty('opacity', 1);
    
    // SlideUp should have y translations
    expect(transitionVariants.slideUp.initial).toHaveProperty('y', 10);
    
    // Scale should have scale property
    expect(transitionVariants.scale.initial).toHaveProperty('scale', 0.95);
    
    // Stagger should be a function
    expect(typeof transitionVariants.stagger.animate).toBe('function');
  });
});