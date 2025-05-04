import { useState } from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
  Button, 
  useColorModeValue, 
  Flex 
} from '@chakra-ui/react';
import { WelcomePanel } from './welcome/WelcomePanel';
import { DailyBriefing } from './briefing/DailyBriefing';
import { TeamActivity } from './activity/TeamActivity';
import { TaskManagement } from './tasks/TaskManagement';
import { QuickActions } from './actions/QuickActions';
import { LivingMap } from '../map/LivingMap';
import InsightsDailySummary from '../insights/InsightsDailySummary';

interface WorkspaceDashboardProps {
  initialLayout?: 'standard' | 'compact' | 'expanded';
  userId?: string;
  teamId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function WorkspaceDashboard({ 
  initialLayout = 'standard',
  userId, 
  teamId,
  showHeader = true,
  compact = false
}: WorkspaceDashboardProps) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'map'>('dashboard');
  const [layout, setLayout] = useState<'standard' | 'compact' | 'expanded'>(initialLayout);
  
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get layout class based on current setting
  const getLayoutClass = () => {
    switch(layout) {
      case 'compact': return 'compact-layout';
      case 'expanded': return 'expanded-layout';
      default: return 'dashboard-layout';
    }
  };
  
  return (
    <Box 
      w="100%" 
      h="calc(100vh - 64px)" 
      bg={bgColor} 
      p={4} 
      data-testid="workspace-dashboard"
      className={getLayoutClass()}
    >
      <Flex justifyContent="flex-end" mb={4}>
        <Button 
          size="sm" 
          colorScheme="blue" 
          onClick={() => setViewMode(viewMode === 'dashboard' ? 'map' : 'dashboard')}
          data-testid="workspace-layout-toggle"
        >
          {viewMode === 'dashboard' ? 'View Map' : 'View Dashboard'}
        </Button>
      </Flex>

      {viewMode === 'dashboard' ? (
        <Grid
          templateColumns="repeat(12, 1fr)"
          templateRows="auto"
          gap={3}
          maxHeight="calc(100vh - 110px)"
          overflow="auto"
          pr={2}
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { width: '8px' },
            '&::-webkit-scrollbar-thumb': { 
              background: borderColor, 
              borderRadius: '24px',
            },
          }}
        >
          {/* AI-powered insights summary - full width at top */}
          <GridItem colSpan={12} mb={2}>
            <InsightsDailySummary 
              maxHeight="300px"
              personalizationContext={{
                userId,
                teamId,
                filterPreferences: {
                  prioritizeTeamInsights: Boolean(teamId),
                  showPersonalInsights: true
                }
              }}
            />
          </GridItem>
          
          {/* Welcome Panel - Spans full width */}
          <GridItem colSpan={12} p={3} bg="white" borderRadius="md" borderWidth="1px" borderColor={borderColor} shadow="sm">
            <WelcomePanel />
          </GridItem>
          
          {/* Left and Right columns side by side */}
          <GridItem colSpan={12} display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={3}>
            {/* Daily Briefing - Left column */}
            <Box bg="white" borderRadius="md" borderWidth="1px" borderColor={borderColor} shadow="sm" p={3} maxHeight={{ lg: "520px" }} overflow="auto">
              <DailyBriefing userId={userId} />
            </Box>
            
            {/* Team Activity - Right column */}
            <Box bg="white" borderRadius="md" borderWidth="1px" borderColor={borderColor} shadow="sm" p={3} maxHeight={{ lg: "520px" }} overflow="auto">
              <TeamActivity teamId={teamId} />
            </Box>
          </GridItem>
          
          {/* Task Management - Left column on larger screens */}
          <GridItem colSpan={{ base: 12, lg: 8 }} p={4} bg="white" borderRadius="md" borderWidth="1px" borderColor={borderColor} shadow="sm">
            <TaskManagement />
          </GridItem>
          
          {/* Quick Actions - Right column on larger screens */}
          <GridItem colSpan={{ base: 12, lg: 4 }} p={4} bg="white" borderRadius="md" borderWidth="1px" borderColor={borderColor} shadow="sm">
            <QuickActions />
          </GridItem>
        </Grid>
      ) : (
        <Box 
          h="calc(100vh - 120px)"
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor} 
          shadow="sm"
          overflow="hidden"
        >
          <LivingMap 
            onNodeClick={() => {/* No action needed, handled by NodeSelectionContext */}}
            projectOverlaps={{}}
          />
        </Box>
      )}
    </Box>
  );
}