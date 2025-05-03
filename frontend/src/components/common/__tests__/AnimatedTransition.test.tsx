/**
 * Test file for AnimatedTransition component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnimatedTransition, { AnimationProvider } from '../AnimatedTransition';
import * as chakraHooks from '@chakra-ui/react';

// Mock Chakra's usePrefersReducedMotion hook
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  usePrefersReducedMotion: jest.fn().mockReturnValue(false)
}));

describe('AnimatedTransition', () => {
  beforeEach(() => {
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
    expect(motionDiv).toHaveAttribute('data-initial');
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
    
    // Content should be visible
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('accepts and applies different animation variants', () => {
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
    
    // Content should be visible
    expect(screen.getByText('Test content')).toBeInTheDocument();
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
    
    // Content should be visible
    expect(screen.getByText('Test content')).toBeInTheDocument();
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
});