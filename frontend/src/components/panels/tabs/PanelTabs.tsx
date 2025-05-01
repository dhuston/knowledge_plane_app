/**
 * PanelTabs.tsx
 * Tab navigation component for context panels
 */
import React from 'react';
import { HStack, Button, useColorModeValue } from '@chakra-ui/react';

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

  return (
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
        variant={activeTab === 'details' ? 'solid' : 'ghost'} 
        size="sm"
        onClick={() => onTabChange('details')}
        colorScheme={activeTab === 'details' ? 'blue' : undefined}
        role="tab"
        id="tab-details"
        aria-selected={activeTab === 'details'}
        aria-controls="panel-details"
      >
        Details
      </Button>
      <Button 
        variant={activeTab === 'related' ? 'solid' : 'ghost'} 
        size="sm"
        onClick={() => onTabChange('related')}
        colorScheme={activeTab === 'related' ? 'blue' : undefined}
        role="tab"
        id="tab-related"
        aria-selected={activeTab === 'related'}
        aria-controls="panel-related"
      >
        Relationships
      </Button>
      <Button 
        variant={activeTab === 'activity' ? 'solid' : 'ghost'} 
        size="sm"
        onClick={() => onTabChange('activity')}
        colorScheme={activeTab === 'activity' ? 'blue' : undefined}
        role="tab"
        id="tab-activity"
        aria-selected={activeTab === 'activity'}
        aria-controls="panel-activity"
      >
        Activity
      </Button>
    </HStack>
  );
};

export default PanelTabs;