import React, { useState, useEffect } from 'react';
import {
  Box,
  useDisclosure,
  Spinner,
  Center,
  useColorModeValue,
  Grid,
  GridItem,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Icon,
  Button,
  Tag,
  Divider,
  Portal,
} from "@chakra-ui/react";
import { FiCheckCircle, FiClock, FiMap } from 'react-icons/fi';
import { MdOutlineInsights } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../modals/CreateProjectModal';
import WebGLMap from '../map/WebGLMap';
import BriefingPanel from '../panels/BriefingPanel';
import DailyBriefingPanel from '../panels/DailyBriefingPanel';
import NotificationCenter from '../notifications/NotificationCenter';
import { MapNode } from '../../types/map';
import Header from './Header';
import { SidebarNav } from '../ui/SidebarNav';
import SkipNavLink from '../ui/SkipNavLink';
import { useApiClient } from '../../hooks/useApiClient';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../error/ErrorBoundary';

// Define a fixed header height (adjust as needed based on Header content)
const HEADER_HEIGHT = '110px';

// Mock data for dashboard components
const mockTasks = [
  { id: '1', title: 'Complete project proposal', dueDate: '2023-09-15', priority: 'high', completed: false },
  { id: '2', title: 'Review team insights', dueDate: '2023-09-14', priority: 'medium', completed: false },
  { id: '3', title: 'Prepare quarterly report', dueDate: '2023-09-20', priority: 'high', completed: false },
  { id: '4', title: 'Knowledge base review', dueDate: '2023-09-18', priority: 'low', completed: true },
];

const mockInsights = [
  { id: '1', title: 'Collaboration opportunity with Design team', type: 'collaboration', importance: 'high' },
  { id: '2', title: 'Project Alpha is at risk of missing deadline', type: 'risk', importance: 'high' },
  { id: '3', title: 'Knowledge overlap found in Team Beta and Team Gamma', type: 'overlap', importance: 'medium' },
];

// Different workspace view types
type WorkspaceViewType = 'command-center' | 'map-focus' | 'grid';

export default function MainLayout() {
  const navigate = useNavigate();
  const { isLoading, setToken, user } = useAuth();
  const {
    isOpen: isCreateProjectOpen,
    onOpen: onCreateProjectOpen,
    onClose: onCreateProjectClose
  } = useDisclosure();
  const {
    isOpen: isBriefingOpen,
    onOpen: onBriefingOpen,
    onClose: onBriefingClose
  } = useDisclosure();
  const {
    isOpen: isNotificationsOpen,
    onOpen: onNotificationsOpen,
    onClose: onNotificationsClose
  } = useDisclosure();

  // Workspace view state
  const [workspaceView, setWorkspaceView] = useState<WorkspaceViewType>('command-center');
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  // Placeholder until overlaps feature re-implemented
  const projectOverlaps: Record<string, string[]> = {};
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<string>('');
  const [isLoadingDailySummary, setIsLoadingDailySummary] = useState(true);
  
  const apiClient = useApiClient();
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const highlightColor = useColorModeValue('primary.50', 'primary.900');
  const accentColor = useColorModeValue('primary.500', 'primary.300');

  const handleLogout = () => {
    setToken(null);
    navigate('/login', { replace: true });
  };

  const handleMapNodeClick = (node: MapNode | null) => {
    setSelectedNode(node);
  };

  const handleCreateProjectClick = () => {
    onCreateProjectOpen();
  };

  const useWebGL = ((import.meta as unknown) as { env: Record<string, string> }).env.VITE_WEBGL_MAP === 'true';

  // Fetch daily summary - fix the endpoint to match backend
  const fetchDailySummary = React.useCallback(async () => {
    setIsLoadingDailySummary(true);
    try {
      // Changed from '/briefings/daily_summary' to '/briefings/daily'
      const response = await apiClient.get('/briefings/daily');
      setDailySummary(response.data.summary || 'No summary available for today.');
    } catch (err) {
      console.error("[MainLayout] Error fetching daily summary:", err);
      setDailySummary('Unable to load daily summary. Please try again later.');
    } finally {
      setIsLoadingDailySummary(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary]);

  const handleMapLoad = () => {
    setIsMapLoading(false);
  };

  // Handle workspace view change from SidebarNav
  const handleViewChange = (view: WorkspaceViewType) => {
    setWorkspaceView(view);
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg={bgColor}>
        <Spinner
          size="xl"
          color="primary.500"
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
        />
      </Center>
    );
  }

  // Render Map-Only View
  const renderMapFocusView = () => (
    <Box height="100%" p={4}>
      <Card h="100%" shadow="sm" bg={cardBgColor} borderColor={borderColor} borderWidth="1px">
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FiMap} color={accentColor} boxSize={5} />
              <Heading size="md">Living Map</Heading>
            </HStack>
            <HStack>
              <Tag size="sm" colorScheme={useWebGL ? "green" : "blue"}>
                {useWebGL ? "WebGL" : "Standard"}
              </Tag>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <Box 
            position="relative" 
            h="100%" 
            borderRadius="md" 
            overflow="hidden"
          >
            <ErrorBoundary>
              {isMapLoading && (
                <Center position="absolute" inset={0} bg="rgba(0,0,0,0.1)" zIndex={1}>
                  <Spinner size="xl" color="primary.500" />
                </Center>
              )}
              <WebGLMap
                onNodeClick={handleMapNodeClick}
                onLoad={handleMapLoad}
              />
            </ErrorBoundary>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );

  // Render Grid View (could be customized as needed)
  const renderGridView = () => (
    <Box p={4} height="100%">
      <Heading size="lg" mb={4}>Grid View</Heading>
      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
        {/* Project Cards */}
        <Card>
          <CardHeader>
            <Heading size="md">Project Alpha</Heading>
          </CardHeader>
          <CardBody>
            <Text>Strategy initiative focused on market expansion</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Project Beta</Heading>
          </CardHeader>
          <CardBody>
            <Text>Product development for next-gen platform</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Project Gamma</Heading>
          </CardHeader>
          <CardBody>
            <Text>Internal process optimization</Text>
          </CardBody>
        </Card>
        
        {/* Team Cards */}
        <Card>
          <CardHeader>
            <Heading size="md">Design Team</Heading>
          </CardHeader>
          <CardBody>
            <Text>8 members - UI/UX focus</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="md">Engineering Team</Heading>
          </CardHeader>
          <CardBody>
            <Text>12 members - Platform & Infrastructure</Text>
          </CardBody>
        </Card>
        
        {/* Knowledge Cards */}
        <Card>
          <CardHeader>
            <Heading size="md">Q3 Strategy</Heading>
          </CardHeader>
          <CardBody>
            <Text>Organization focus areas and priorities</Text>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );

  // Render Command Center View
  const renderCommandCenterView = () => (
    <Box height="100%">
      {/* Dashboard Header with Welcome and Date */}
      <Flex justifyContent="space-between" alignItems="center" p={4} pb={2}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, 
            {' '}{user?.name?.split(' ')[0] || 'there'}
          </Heading>
          <Text color={secondaryTextColor}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </VStack>
      </Flex>
      
      {/* Dashboard Grid Layout */}
      <Grid
        templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
        templateRows={{ base: "auto 1fr", lg: "1fr" }}
        gap={4}
        px={4}
        pb={4}
        h="calc(100% - 60px)" // Account for dashboard header
      >
        {/* Map Section - Large in left column */}
        <GridItem rowSpan={{ base: 1, lg: 2 }}>
          <Card h="100%" shadow="sm" bg={cardBgColor} borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={0}>
              <Flex justify="space-between" align="center">
                <HStack>
                  <Icon as={FiMap} color={accentColor} boxSize={5} />
                  <Heading size="md">Living Map</Heading>
                </HStack>
                <HStack>
                  <Tag size="sm" colorScheme={useWebGL ? "green" : "blue"}>
                    {useWebGL ? "WebGL" : "Standard"}
                  </Tag>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <Box 
                position="relative" 
                h="100%" 
                borderRadius="md" 
                overflow="hidden"
              >
                <ErrorBoundary>
                  {isMapLoading && (
                    <Center position="absolute" inset={0} bgColor="rgba(0,0,0,0.1)" zIndex={1}>
                      <Spinner size="xl" color="primary.500" />
                    </Center>
                  )}
                  <WebGLMap
                    onNodeClick={handleMapNodeClick}
                    onLoad={handleMapLoad}
                  />
                </ErrorBoundary>
              </Box>
            </CardBody>
          </Card>
        </GridItem>

        {/* Right Column - Command Cards */}
        <GridItem>
          {/* Daily Briefing Card */}
          <Card shadow="sm" bg={cardBgColor} borderColor={borderColor} borderWidth="1px" h="100%" mb={4}>
            <CardHeader pb={0}>
              <Flex justify="space-between" align="center">
                <HStack>
                  <Icon as={MdOutlineInsights} color={accentColor} boxSize={5} />
                  <Heading size="md">Daily Briefing</Heading>
                </HStack>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  colorScheme="primary"
                  onClick={onBriefingOpen}
                >
                  Expand
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              {isLoadingDailySummary ? (
                <Center h="100%">
                  <Spinner color="primary.500" />
                </Center>
              ) : (
                <VStack align="stretch" spacing={3}>
                  <Text>{dailySummary}</Text>
                  <Divider />
                  <Text fontSize="sm" fontWeight="medium">Top Insights:</Text>
                  <VStack align="stretch" spacing={2}>
                    {mockInsights.map((insight) => (
                      <Box 
                        key={insight.id} 
                        p={2} 
                        bg={highlightColor} 
                        borderRadius="md"
                        borderLeftWidth="3px"
                        borderLeftColor={
                          insight.importance === 'high' ? 'error.500' : 
                          insight.importance === 'medium' ? 'warning.500' : 
                          'info.500'
                        }
                      >
                        <Text fontSize="sm">{insight.title}</Text>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Tasks Card */}
          <Card shadow="sm" bg={cardBgColor} borderColor={borderColor} borderWidth="1px" h="100%">
            <CardHeader pb={0}>
              <HStack>
                <Icon as={FiCheckCircle} color={accentColor} boxSize={5} />
                <Heading size="md">Today's Tasks</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {mockTasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                  <HStack 
                    key={task.id} 
                    p={2} 
                    bg="transparent" 
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    justify="space-between"
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">{task.title}</Text>
                      <Text fontSize="xs" color={secondaryTextColor}>Due: {task.dueDate}</Text>
                    </VStack>
                    <Tag 
                      size="sm" 
                      colorScheme={
                        task.priority === 'high' ? 'error' : 
                        task.priority === 'medium' ? 'warning' : 
                        'info'
                      }
                    >
                      {task.priority}
                    </Tag>
                  </HStack>
                ))}
                <Button size="sm" variant="ghost" rightIcon={<FiClock />}>
                  View All Tasks
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );

  return (
    <ErrorBoundary>
      <Box h="100vh" overflow="hidden" bg={bgColor}>
        {/* Accessibility Skip Link */}
        <SkipNavLink targetId="main-content" />
        
        {/* Header */} 
        <Header 
          user={user}
          onCreateProjectClick={handleCreateProjectClick} 
          onLogout={handleLogout}
          onOpenBriefing={onBriefingOpen}
          onOpenNotifications={onNotificationsOpen}
        />
        
        {/* Main Layout Grid */}
        <Grid
          templateColumns={{ base: "1fr", md: "64px 1fr" }}
          h={`calc(100vh - ${HEADER_HEIGHT})`}
          mt={HEADER_HEIGHT}
        >
          {/* Sidebar - Command Navigation Hub */}
          <GridItem
            as="aside"
            bg={cardBgColor}
            borderRightWidth="1px"
            borderColor={borderColor}
          >
            {/* Pass the view change handler to SidebarNav */}
            <SidebarNav onViewChange={handleViewChange} activeView={workspaceView} />
          </GridItem>

          {/* Main Content Area - Command Center */}
          <GridItem 
            as="main"
            overflow="auto"
            id="main-content"
          >
            {/* Render different views based on selected workspace view */}
            {workspaceView === 'command-center' && renderCommandCenterView()}
            {workspaceView === 'map-focus' && renderMapFocusView()}
            {workspaceView === 'grid' && renderGridView()}
          </GridItem>
        </Grid>

        {/* Modals and Panels */}
        <Portal>
          <CreateProjectModal
            isOpen={isCreateProjectOpen}
            onClose={onCreateProjectClose}
          />

          {selectedNode && (
            <BriefingPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              projectOverlaps={projectOverlaps}
              getProjectNameById={(id: string) => `Project ${id.substring(0, 4)}...`}
            />
          )}

          <DailyBriefingPanel
            isOpen={isBriefingOpen}
            onClose={onBriefingClose}
          />

          <NotificationCenter
            isOpen={isNotificationsOpen}
            onClose={onNotificationsClose}
          />
        </Portal>
      </Box>
    </ErrorBoundary>
  );
} 