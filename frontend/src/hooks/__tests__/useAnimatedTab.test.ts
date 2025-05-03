/**
 * Unit tests for useAnimatedTab hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useAnimatedTab } from '../useAnimatedTab';

// Mock Chakra's usePrefersReducedMotion hook
jest.mock('@chakra-ui/react', () => ({
  usePrefersReducedMotion: jest.fn().mockReturnValue(false)
}));

// Mock timer functions
jest.useFakeTimers();

describe('useAnimatedTab', () => {
  beforeEach(() => {
    // Clear any previous mock timer calls
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should initialize with the provided initial tab', () => {
    // Arrange
    const initialTab = 'tab1';
    
    // Act
    const { result } = renderHook(() => useAnimatedTab({ initialTab }));
    
    // Assert
    expect(result.current.activeTab).toBe(initialTab);
    expect(result.current.previousTab).toBe(null);
    expect(result.current.isTransitioning).toBe(false);
  });

  it('should handle tab changes with animation', () => {
    // Arrange
    const initialTab = 'tab1';
    const newTab = 'tab2';
    const onTabChanged = jest.fn();
    
    // Act - render the hook
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab,
      transitionDuration: 0.3, 
      onTabChanged
    }));
    
    // Act - change the tab
    act(() => {
      result.current.setActiveTab(newTab);
    });
    
    // Assert - during transition
    expect(result.current.activeTab).toBe(newTab);
    expect(result.current.previousTab).toBe(initialTab);
    expect(result.current.isTransitioning).toBe(true);
    expect(onTabChanged).not.toHaveBeenCalled(); // Should not be called until transition completes
    
    // Act - advance the timer to complete the transition
    act(() => {
      jest.advanceTimersByTime(300); // 300ms = 0.3s
    });
    
    // Assert - after transition
    expect(result.current.isTransitioning).toBe(false);
    expect(onTabChanged).toHaveBeenCalledWith(newTab, initialTab);
  });

  it('should skip animation when immediate is true', () => {
    // Arrange
    const initialTab = 'tab1';
    const newTab = 'tab2';
    const onTabChanged = jest.fn();
    
    // Act - render the hook with immediate=true
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab,
      transitionDuration: 0.3, 
      immediate: true,
      onTabChanged
    }));
    
    // Act - change the tab
    act(() => {
      result.current.setActiveTab(newTab);
    });
    
    // Assert
    expect(result.current.activeTab).toBe(newTab);
    expect(result.current.previousTab).toBe(initialTab);
    expect(result.current.isTransitioning).toBe(false); // No transition when immediate is true
    expect(onTabChanged).toHaveBeenCalledWith(newTab, initialTab);
    
    // Act - advance the timer
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // onTabChanged should have been called immediately, not after the timer
    expect(onTabChanged).toHaveBeenCalledTimes(1);
  });

  it('should not change tabs during a transition', () => {
    // Arrange
    const initialTab = 'tab1';
    const secondTab = 'tab2';
    const thirdTab = 'tab3';
    
    // Act - render the hook
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab,
      transitionDuration: 0.3
    }));
    
    // Act - change to second tab
    act(() => {
      result.current.setActiveTab(secondTab);
    });
    
    // Assert - second tab is active
    expect(result.current.activeTab).toBe(secondTab);
    expect(result.current.isTransitioning).toBe(true);
    
    // Act - try to change to third tab during transition
    act(() => {
      result.current.setActiveTab(thirdTab);
    });
    
    // Assert - still on second tab during transition
    expect(result.current.activeTab).toBe(secondTab);
    
    // Act - advance the timer to complete transition
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Now that transition is complete, we can change to the third tab
    act(() => {
      result.current.setActiveTab(thirdTab);
    });
    
    expect(result.current.activeTab).toBe(thirdTab);
  });

  it('should do nothing when setting the same tab', () => {
    // Arrange
    const initialTab = 'tab1';
    const onTabChanged = jest.fn();
    
    // Act - render the hook
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab,
      onTabChanged
    }));
    
    // Act - try to set the same tab
    act(() => {
      result.current.setActiveTab(initialTab);
    });
    
    // Assert
    expect(result.current.activeTab).toBe(initialTab);
    expect(result.current.previousTab).toBe(null); // Should not change
    expect(result.current.isTransitioning).toBe(false);
    expect(onTabChanged).not.toHaveBeenCalled();
  });

  it('should provide correct motion props for fade animation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab: 'tab1',
      animationVariant: 'fade'
    }));
    
    // Assert
    expect(result.current.motionProps.initial).toEqual({ opacity: 0 });
    expect(result.current.motionProps.animate).toEqual({ opacity: 1 });
    expect(result.current.motionProps.exit).toEqual({ opacity: 0 });
  });

  it('should provide correct motion props for slide animation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab: 'tab1',
      animationVariant: 'slide'
    }));
    
    // Assert
    expect(result.current.motionProps.initial.opacity).toBe(0);
    expect(result.current.motionProps.animate).toEqual({ opacity: 1, x: 0 });
    // x value depends on the transition direction
  });

  it('should provide correct motion props for scale animation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab: 'tab1',
      animationVariant: 'scale'
    }));
    
    // Assert
    expect(result.current.motionProps.initial).toEqual({ opacity: 0, scale: 0.95 });
    expect(result.current.motionProps.animate).toEqual({ opacity: 1, scale: 1 });
    expect(result.current.motionProps.exit).toEqual({ opacity: 0, scale: 0.95 });
  });

  it('should use custom animation properties when provided', () => {
    // Arrange
    const customAnimation = {
      entering: { y: -20, rotateX: 10 },
      exiting: { y: 20, rotateX: -10 }
    };
    
    // Act
    const { result } = renderHook(() => useAnimatedTab({
      initialTab: 'tab1',
      animationVariant: 'custom',
      customAnimation
    }));
    
    // Assert
    expect(result.current.motionProps.initial).toEqual(customAnimation.entering);
    expect(result.current.motionProps.animate).toEqual({ opacity: 1, ...customAnimation.entering });
    expect(result.current.motionProps.exit).toEqual(customAnimation.exiting);
  });

  it('should have correct animation props during transition', () => {
    // Arrange
    const initialTab = 'tab1';
    const newTab = 'tab2';
    
    // Act - render the hook
    const { result } = renderHook(() => useAnimatedTab({ 
      initialTab,
      transitionDuration: 0.5
    }));
    
    // Initial state
    expect(result.current.animationProps.opacity).toBe(1);
    expect(result.current.animationProps.transform).toBe('translateX(0)');
    
    // Act - change the tab
    act(() => {
      result.current.setActiveTab(newTab);
    });
    
    // Assert - during transition
    expect(result.current.animationProps.opacity).toBe(0);
    expect(result.current.animationProps.transition).toContain('0.5s');
    expect(result.current.animationProps.transform).not.toBe('translateX(0)');
    
    // Act - complete transition
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Assert - after transition
    expect(result.current.animationProps.opacity).toBe(1);
    expect(result.current.animationProps.transform).toBe('translateX(0)');
  });
});