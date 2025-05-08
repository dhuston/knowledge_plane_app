/**
 * PanelTabs.tsx
 * Tab navigation component for context panels with enhanced animations
 */
import React, { useRef, useEffect } from 'react';
import { HStack, Button, useColorModeValue, Box, usePrefersReducedMotion } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimatedTab } from '../../../hooks/useAnimatedTab';
import AnimatedTransition from '../../common/AnimatedTransition';

export type PanelTabType = 'details' | 'activity' | 'related';

interface PanelTabsProps {
  activeTab: PanelTabType;
  onTabChange: (tab: PanelTabType) => void;
  animationVariant?: 'minimal' | 'enhanced' | 'none';
  indicatorStyle?: 'bar' | 'pill' | 'highlight' | 'none';
  dataTestId?: string;
}

const PanelTabs: React.FC<PanelTabsProps> = ({
  activeTab,
  onTabChange,
  animationVariant = 'enhanced',
  indicatorStyle = 'bar',
  dataTestId = 'panel-tabs'
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const pillBg = useColorModeValue('blue.50', 'blue.900');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Hard-coded feature flags since the feature flag system was removed
  const enabledFeatures = {
    enableActivityTimeline: true
  };

  // Use our custom animated tab hook with enhanced options
  const { 
    isTransitioning,
    animationProps,
    motionProps,
    previousTab
  } = useAnimatedTab({
    initialTab: activeTab,
    transitionDuration: prefersReducedMotion ? 0 : 0.3,
    onTabChanged: (newTab: string) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Tab changed to: ${newTab}`);
      }
    },
    animationVariant: animationVariant === 'none' ? 'fade' : 'slide',
    immediate: animationVariant === 'none' || prefersReducedMotion
  });

  // Refs for tab positions (for indicator animation)
  const tabsRef = useRef<Map<PanelTabType, HTMLButtonElement | null>>(new Map());
  
  // Track the active indicator position
  const [indicatorPosition, setIndicatorPosition] = React.useState({
    left: 0,
    width: 0,
    opacity: 0
  });

  // Update indicator position whenever the active tab changes
  useEffect(() => {
    const activeTabEl = tabsRef.current.get(activeTab);
    if (activeTabEl) {
      // Add a small delay to allow for any layout shifts
      setTimeout(() => {
        setIndicatorPosition({
          left: activeTabEl.offsetLeft,
          width: activeTabEl.offsetWidth,
          opacity: 1
        });
      }, 50);
    }
  }, [activeTab]);

  // Helper to store tab element references
  const setTabRef = (tab: PanelTabType) => (el: HTMLButtonElement | null) => {
    if (el) {
      tabsRef.current.set(tab, el);
      
      // If this is the active tab, initialize the indicator
      if (tab === activeTab) {
        setIndicatorPosition({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    }
  };

  return (
    <Box position="relative">
      <HStack 
        borderBottom="1px solid" 
        borderColor={borderColor} 
        px={4}
        py={2}
        spacing={4}
        role="tablist"
        aria-label="Panel sections"
      >
        <Button 
          ref={setTabRef('details')}
          variant={activeTab === 'details' ? 'ghost' : 'ghost'} 
          size="sm"
          onClick={() => onTabChange('details')}
          color={activeTab === 'details' ? activeColor : undefined}
          _hover={{ bg: hoverBg }}
          role="tab"
          id="tab-details"
          aria-selected={activeTab === 'details'}
          aria-controls="panel-details"
          fontWeight={activeTab === 'details' ? 'semibold' : 'normal'}
          position="relative"
          transition="all 0.2s ease"
        >
          Details
        </Button>
        <Button 
          ref={setTabRef('related')}
          variant={activeTab === 'related' ? 'ghost' : 'ghost'} 
          size="sm"
          onClick={() => onTabChange('related')}
          color={activeTab === 'related' ? activeColor : undefined}
          _hover={{ bg: hoverBg }}
          role="tab"
          id="tab-related"
          aria-selected={activeTab === 'related'}
          aria-controls="panel-related"
          fontWeight={activeTab === 'related' ? 'semibold' : 'normal'}
          position="relative"
          transition="all 0.2s ease"
        >
          Relationships
        </Button>
        {/* Only show activity tab if the activity timeline feature is enabled */}
        {enabledFeatures.enableActivityTimeline && (
          <Button 
            ref={setTabRef('activity')}
            variant={activeTab === 'activity' ? 'ghost' : 'ghost'} 
            size="sm"
            onClick={() => onTabChange('activity')}
            color={activeTab === 'activity' ? activeColor : undefined}
            _hover={{ bg: hoverBg }}
            role="tab"
            id="tab-activity"
            aria-selected={activeTab === 'activity'}
            aria-controls="panel-activity"
            fontWeight={activeTab === 'activity' ? 'semibold' : 'normal'}
            position="relative"
            transition="all 0.2s ease"
          >
            Activity
          </Button>
        )}
      </HStack>
      
      {/* Animated tab indicator */}
      {/* Render different indicator styles based on the prop */}
      {indicatorStyle === 'bar' && (
        <motion.div
          style={{
            position: 'absolute',
            height: '2px',
            backgroundColor: activeColor,
            bottom: '0px',
            left: indicatorPosition.left,
            width: indicatorPosition.width,
            opacity: indicatorPosition.opacity,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 30 
          }}
          animate={{ 
            left: indicatorPosition.left,
            width: indicatorPosition.width,
            opacity: indicatorPosition.opacity
          }}
          data-testid="tab-indicator"
        />
      )}
      
      {/* Pill style indicator */}
      {indicatorStyle === 'pill' && (
        <motion.div
          style={{
            position: 'absolute',
            height: '80%',
            backgroundColor: pillBg,
            bottom: '10%',
            left: 0,
            width: indicatorPosition.width,
            borderRadius: '100px',
            zIndex: 0,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 28 
          }}
          animate={{ 
            left: indicatorPosition.left,
            width: indicatorPosition.width,
            opacity: indicatorPosition.opacity
          }}
          data-testid="tab-indicator-pill"
        />
      )}
      
      {/* Highlight style indicator */}
      {indicatorStyle === 'highlight' && (
        <motion.div
          style={{
            position: 'absolute',
            height: '80%',
            backgroundColor: highlightBg,
            bottom: '10%',
            borderRadius: '4px',
            zIndex: 0,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 28 
          }}
          animate={{ 
            left: indicatorPosition.left - 8, // Add some padding
            width: indicatorPosition.width + 16, // Add some padding
            opacity: indicatorPosition.opacity
          }}
          data-testid="tab-indicator-highlight"
        />
      )}
    </Box>
  );
};

export default PanelTabs;