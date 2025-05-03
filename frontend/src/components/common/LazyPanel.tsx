/**
 * LazyPanel.tsx
 * A component that lazily loads its children only when they are needed
 */
import React, { ReactNode, useState, useEffect, useRef, Suspense } from 'react';
import { Box, Spinner, Center, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface LazyPanelProps {
  /** Whether the panel should be loaded */
  active: boolean;
  /** Children to render when active */
  children: ReactNode;
  /** The tab ID for tracking */
  tabId: string;
  /** Fallback component to show while loading */
  fallback?: ReactNode;
  /** Whether to permanently keep component loaded once activated */
  keepMounted?: boolean;
  /** Whether to show any loading indication */
  showLoading?: boolean;
  /** Preload threshold in pixels (loads when within this distance) */
  preloadThreshold?: number;
  /** Animation variant for transitions */
  animationVariant?: 'fade' | 'slide' | 'scale' | 'none';
  /** Custom transition duration in seconds */
  transitionDuration?: number;
  /** Whether to maintain the panel's height during transitions */
  maintainHeight?: boolean;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/**
 * Component for lazily loading content only when a tab becomes active
 */
const LazyPanel: React.FC<LazyPanelProps> = ({
  active,
  children,
  tabId,
  fallback,
  keepMounted = true,
  showLoading = true,
  preloadThreshold = 0,
  animationVariant = 'fade',
  transitionDuration = 0.3,
  maintainHeight = false,
  "data-testid": dataTestId
}) => {
  const [shouldRender, setShouldRender] = useState(active);
  const [isLoading, setIsLoading] = useState(active);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track if this panel has ever been loaded
  const wasLoadedRef = useRef<boolean>(active);
  // Track previous active state for animations
  const prevActiveRef = useRef<boolean>(active);

  // Loading spinner colors
  const spinnerColor = useColorModeValue('blue.500', 'blue.300');
  const bgColor = useColorModeValue('white', 'gray.800');

  // Set up IntersectionObserver for preloading
  useEffect(() => {
    if (preloadThreshold > 0 && !shouldRender && panelRef.current) {
      const options = {
        rootMargin: `${preloadThreshold}px`,
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        // If panel is coming into view and hasn't been loaded yet
        if (entries[0].isIntersecting && !wasLoadedRef.current) {
          setShouldRender(true);
        }
      }, options);

      observer.observe(panelRef.current);
      return () => {
        if (panelRef.current) {
          observer.unobserve(panelRef.current);
        }
      };
    }
  }, [shouldRender, preloadThreshold]);

  // Update shouldRender state when active changes
  useEffect(() => {
    if (active) {
      setShouldRender(true);
      wasLoadedRef.current = true;
    } else if (!keepMounted) {
      // Only unmount if keepMounted is false
      setShouldRender(false);
    }
  }, [active, keepMounted]);

  // Handle loading state
  useEffect(() => {
    if (shouldRender && isLoading) {
      // Use requestAnimationFrame for smoother loading transitions
      // This ensures we don't show the loading state for content that loads very quickly
      let frameId: number;
      
      // Use a more sophisticated loading strategy with animation frames
      const startTime = performance.now();
      const minLoadingTime = 200; // Minimum loading time to prevent flickering
      
      const checkLoadingState = (timestamp: number) => {
        const elapsedTime = timestamp - startTime;
        
        if (elapsedTime >= minLoadingTime) {
          setIsLoading(false);
        } else {
          // Continue the animation frame loop until minimum time has passed
          frameId = requestAnimationFrame(checkLoadingState);
        }
      };
      
      frameId = requestAnimationFrame(checkLoadingState);
      
      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
    }
  }, [shouldRender, isLoading]);

  // Default loading fallback
  const defaultFallback = (
    <Center p={8} height="100%" width="100%" bg={bgColor}>
      <Spinner 
        size="md" 
        color={spinnerColor} 
        thickness="3px" 
        speed="0.65s"
      />
    </Center>
  );

  // Render nothing if not needed and no fallback
  if (!shouldRender && !active) {
    return <Box ref={panelRef} display="none" />;
  }

  // Manage content height for smooth transitions if maintainHeight is true
  useEffect(() => {
    if (maintainHeight && contentRef.current && active) {
      const updateHeight = () => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      };
      
      updateHeight();
      
      // Update height on window resize
      window.addEventListener('resize', updateHeight);
      
      // Use ResizeObserver if available for more accurate measurements
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(contentRef.current);
        
        return () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', updateHeight);
        };
      }
      
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [active, maintainHeight, children, isLoading]);
  
  // Track active state changes for animations
  useEffect(() => {
    prevActiveRef.current = active;
  }, [active]);

  // Define animations based on selected variant
  const getVariants = () => {
    switch (animationVariant) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: transitionDuration } }
        };
      case 'slide':
        return {
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: transitionDuration } }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.97 },
          visible: { 
            opacity: 1, 
            scale: 1, 
            transition: { 
              duration: transitionDuration,
              ease: "easeOut"
            } 
          }
        };
      case 'none':
      default:
        return {
          hidden: {},
          visible: {}
        };
    }
  };
  
  const animationVariants = getVariants();

  return (
    <Box
      ref={panelRef}
      display={active ? 'block' : 'none'}
      width="100%"
      height={maintainHeight && contentHeight ? `${contentHeight}px` : '100%'}
      position="relative"
      role="tabpanel"
      id={`panel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      data-testid={dataTestId}
      transition={maintainHeight ? `height ${transitionDuration}s ease` : undefined}
    >
      {shouldRender ? (
        <Suspense fallback={showLoading ? (fallback || defaultFallback) : null}>
          <motion.div
            ref={contentRef}
            initial="hidden"
            animate={!isLoading ? "visible" : "hidden"}
            variants={animationVariants}
            style={{ height: maintainHeight ? 'auto' : '100%' }}
            transition={{ duration: transitionDuration }}
            data-testid={`${dataTestId}-content`}
          >
            {children}
          </motion.div>
        </Suspense>
      ) : active && showLoading ? (
        fallback || defaultFallback
      ) : null}
    </Box>
  );
};

export default React.memo(LazyPanel);