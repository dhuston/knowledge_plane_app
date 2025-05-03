/**
 * PanelTabs.tsx
 * Tab navigation component for context panels with enhanced animations
 */
import React, { useRef, useEffect } from 'react';
import { HStack, Button, useColorModeValue, Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useFeatureFlags } from '../../../utils/featureFlags';
import { useAnimatedTab } from '../../../hooks/useAnimatedTab';

export type PanelTabType = 'details' | 'activity' | 'related';

interface PanelTabsProps {
  activeTab: PanelTabType;
  onTabChange: (tab: PanelTabType) => void;
}

const PanelTabs: React.FC<PanelTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const { flags } = useFeatureFlags();

  // Use our custom animated tab hook
  const { 
    isTransitioning,
    animationProps
  } = useAnimatedTab({
    initialTab: activeTab,
    transitionDuration: 0.3,
    onTabChanged: (newTab: string) => {
      console.log(`Tab changed to: ${newTab}`);
    }
  });

  // Refs for tab positions (for indicator animation)
  const tabsRef = useRef<Map<PanelTabType, HTMLButtonElement | null>>(new Map());
  
  // Track the active indicator position
  const [indicatorStyle, setIndicatorStyle] = React.useState({
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
        setIndicatorStyle({
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
        setIndicatorStyle({
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
        {flags.enableActivityTimeline && (
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
      <motion.div
        style={{
          position: 'absolute',
          height: '2px',
          backgroundColor: activeColor,
          bottom: '0px',
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 30 
        }}
        animate={{ 
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity
        }}
        data-testid="tab-indicator"
      />
    </Box>
  );
};

export default PanelTabs;