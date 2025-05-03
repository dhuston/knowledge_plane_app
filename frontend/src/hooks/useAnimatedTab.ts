/**
 * useAnimatedTab.ts
 * Custom hook for managing tab transitions with animations
 */
import { useState, useRef, useEffect } from 'react';
import { usePrefersReducedMotion } from '@chakra-ui/react';

/**
 * Options for the animated tab hook
 */
interface AnimatedTabOptions {
  /** Initial active tab */
  initialTab: string;
  /** Duration of the transition in seconds */
  transitionDuration?: number;
  /** Whether transitions should happen immediately */
  immediate?: boolean;
  /** Callback when a tab change completes */
  onTabChanged?: (newTab: string, prevTab: string | null) => void;
  /** Animation variant to use for tab transitions */
  animationVariant?: 'fade' | 'slide' | 'scale' | 'custom';
  /** Custom animation properties for the 'custom' variant */
  customAnimation?: {
    entering?: Record<string, any>;
    exiting?: Record<string, any>;
  };
}

/**
 * Return values from the hook
 */
interface AnimatedTabResult {
  /** Currently active tab */
  activeTab: string;
  /** Previously active tab */
  previousTab: string | null;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Function to change the active tab */
  setActiveTab: (tabId: string) => void;
  /** Animation properties for the current tab */
  animationProps: {
    transition: string;
    opacity: number;
    transform: string;
  };
  /** Whether the transition should be animated */
  shouldAnimate: boolean;
  /** Animation properties for framer-motion */
  motionProps: {
    initial: Record<string, any>;
    animate: Record<string, any>;
    exit: Record<string, any>;
    transition: Record<string, any>;
  };
}

/**
 * Hook for managing tab transitions with animations
 * @param options Configuration options for tab animations
 */
export const useAnimatedTab = (options: AnimatedTabOptions): AnimatedTabResult => {
  const {
    initialTab,
    transitionDuration = 0.3,
    immediate = false,
    onTabChanged,
    animationVariant = 'fade',
    customAnimation = {}
  } = options;
  
  const [activeTab, setActiveTabState] = useState<string>(initialTab);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Track last active tab for animations
  const lastTabRef = useRef<string | null>(null);
  
  // Track direction of tab change for animation
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);

  // Mapping of tab indices for determining direction
  const tabOrderRef = useRef<Map<string, number>>(new Map());
  
  // Setup the tab order for determining animation direction
  useEffect(() => {
    // This would typically be initialized with your tab definitions
    // For now, we'll just use a helper method to register tabs
    if (tabOrderRef.current.size === 0) {
      tabOrderRef.current.set(initialTab, 0);
    }
  }, [initialTab]);
  
  /**
   * Register a tab in the ordering system
   */
  const registerTabOrder = (tabId: string, index: number) => {
    tabOrderRef.current.set(tabId, index);
  };
  
  /**
   * Handle changing the active tab with animation
   */
  const setActiveTab = (tabId: string) => {
    if (tabId === activeTab || isTransitioning) return;
    
    // Determine direction of transition
    const currentIndex = tabOrderRef.current.get(activeTab) ?? 0;
    const newIndex = tabOrderRef.current.get(tabId) ?? 0;
    const direction = newIndex > currentIndex ? 'right' : 'left';
    
    // Save previous tab
    setPreviousTab(activeTab);
    lastTabRef.current = activeTab;
    
    // Set transition direction
    setTransitionDirection(direction);
    
    // Set transitioning state
    if (!prefersReducedMotion && !immediate) {
      setIsTransitioning(true);
      
      // Reset transitioning state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        
        // Call the change callback
        if (onTabChanged) {
          onTabChanged(tabId, lastTabRef.current);
        }
      }, transitionDuration * 1000);
    } else if (onTabChanged) {
      // Call the change callback immediately if animations are disabled
      onTabChanged(tabId, lastTabRef.current);
    }
    
    // Update the active tab
    setActiveTabState(tabId);
  };
  
  // Should animations be applied (respect user preferences)
  const shouldAnimate = !prefersReducedMotion && !immediate;
  
  // Compute animation properties based on direction
  let translateValue = '0';
  if (shouldAnimate && isTransitioning) {
    translateValue = transitionDirection === 'right' ? '20px' : '-20px';
  }
  
  // Animation properties for the current tab
  const animationProps = {
    transition: shouldAnimate ? `opacity ${transitionDuration}s ease, transform ${transitionDuration}s ease` : 'none',
    opacity: isTransitioning ? 0 : 1,
    transform: isTransitioning ? `translateX(${translateValue})` : 'translateX(0)'
  };
  
  // Generate motion props based on animation variant
  const getMotionProps = () => {
    const baseTransition = { 
      duration: transitionDuration,
      ease: "easeOut" 
    };
    
    // Default properties for each animation variant
    switch (animationVariant) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: baseTransition
        };
      case 'slide':
        return {
          initial: { opacity: 0, x: transitionDirection === 'right' ? 20 : -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: transitionDirection === 'right' ? -20 : 20 },
          transition: baseTransition
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: baseTransition
        };
      case 'custom':
        return {
          initial: customAnimation.entering || { opacity: 0 },
          animate: { opacity: 1, ...customAnimation.entering },
          exit: customAnimation.exiting || { opacity: 0 },
          transition: baseTransition
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: baseTransition
        };
    }
  };
  
  const motionProps = getMotionProps();
  
  return {
    activeTab,
    previousTab,
    isTransitioning,
    setActiveTab,
    animationProps,
    shouldAnimate,
    motionProps
  };
};

export default useAnimatedTab;