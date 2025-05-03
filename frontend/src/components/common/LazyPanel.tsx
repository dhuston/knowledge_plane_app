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
  preloadThreshold = 0
}) => {
  const [shouldRender, setShouldRender] = useState(active);
  const [isLoading, setIsLoading] = useState(active);
  const panelRef = useRef<HTMLDivElement>(null);

  // Track if this panel has ever been loaded
  const wasLoadedRef = useRef<boolean>(active);

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
      // Simulate a short loading period (can be replaced with real loading logic)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
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

  // Define animation for loading state
  const loadingVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <Box
      ref={panelRef}
      display={active ? 'block' : 'none'}
      width="100%"
      height="100%"
      position="relative"
      role="tabpanel"
      id={`panel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
    >
      {shouldRender ? (
        <Suspense fallback={showLoading ? (fallback || defaultFallback) : null}>
          <motion.div
            initial="hidden"
            animate={!isLoading ? "visible" : "hidden"}
            variants={loadingVariants}
            style={{ height: '100%' }}
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