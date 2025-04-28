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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { FiCheckCircle, FiClock, FiMap, FiMaximize } from 'react-icons/fi';
import { AddIcon } from '@chakra-ui/icons';
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

  // Theme colors - refined for better visual hierarchy and harmony
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const tertiaryTextColor = useColorModeValue('gray.500', 'gray.500');
  const highlightColor = useColorModeValue('primary.50', 'primary.900');
  const accentColor = useColorModeValue('primary.500', 'primary.300');
  const subtleBgColor = useColorModeValue('gray.50', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const glassBgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)');

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

  // Render Command Center View - Refined for better visual hierarchy and user experience
  const renderCommandCenterView = () => (
    <Box>
      {/* Dashboard Header - Refined with better styling and breadcrumbs */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={2}>
          <Box>
            <Breadcrumb separator="/" fontSize="sm" color={tertiaryTextColor} mb={1}>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink href="#">Command Center</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Heading
              size="lg"
              letterSpacing="tight"
              bgGradient="linear(to-r, primary.500, primary.400)"
              bgClip="text"
            >
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
              {' '}{user?.name?.split(' ')[0] || 'there'}
            </Heading>
          </Box>
          <HStack spacing={3}>
            <Button
              variant="outline"
              leftIcon={<Icon as={FiClock} />}
              size="sm"
              onClick={() => {/* View recent activity */}}
            >
              Recent
            </Button>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="primary"
              onClick={handleCreateProjectClick}
              size="sm"
            >
              New Project
            </Button>
          </HStack>
        </Flex>
        <Text color={secondaryTextColor}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </Box>

      {/* Dashboard Grid Layout - Refined with better spacing and visual hierarchy */}
      <Grid
        templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
        templateRows={{ base: "auto 1fr", lg: "1fr" }}
        gap={6}
        h="calc(100% - 80px)" // Account for dashboard header
      >
        {/* Map Section - Large in left column - Refined with better styling */}
        <GridItem rowSpan={{ base: 1, lg: 2 }}>
          <Card
            h="100%"
            shadow="md"
            bg={cardBgColor}
            borderColor={borderColor}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.2s"
            _hover={{ boxShadow: "lg" }}
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FiMap} color={accentColor} boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Heading size="md">Living Map</Heading>
                    <Text fontSize="xs" color={secondaryTextColor}>Interactive organizational visualization</Text>
                  </VStack>
                </HStack>
                <HStack spacing={2}>
                  <Tag size="sm" colorScheme={useWebGL ? "green" : "blue"} borderRadius="full">
                    {useWebGL ? "WebGL" : "Standard"}
                  </Tag>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewChange('map-focus')}
                    aria-label="Expand map"
                  >
                    <Icon as={FiMaximize} />
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <Box
                position="relative"
                h="100%"
                borderRadius="md"
                overflow="hidden"
                boxShadow="inner"
              >
                <ErrorBoundary>
                  {isMapLoading && (
                    <Center position="absolute" inset={0} bg="rgba(0,0,0,0.05)" zIndex={1} backdropFilter="blur(2px)">
                      <Spinner size="xl" color="primary.500" thickness="3px" speed="0.8s" />
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

        {/* Right Column - Command Cards - Refined with better styling */}
        <GridItem>
          {/* Daily Briefing Card - Refined with better styling */}
          <Card
            shadow="md"
            bg={cardBgColor}
            borderColor={borderColor}
            borderWidth="1px"
            h="100%"
            mb={6}
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={MdOutlineInsights} color={accentColor} boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Heading size="md">Daily Briefing</Heading>
                    <Text fontSize="xs" color={secondaryTextColor}>Your daily organizational summary</Text>
                  </VStack>
                </HStack>
                <Button
                  variant="ghost"
                  size="sm"
                  colorScheme="primary"
                  onClick={onBriefingOpen}
                  aria-label="Expand briefing"
                >
                  <Icon as={FiMaximize} />
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              {isLoadingDailySummary ? (
                <Center h="100%">
                  <Spinner color="primary.500" />
                </Center>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="sm" lineHeight="tall">{dailySummary}</Text>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Top Insights:</Text>
                    <VStack align="stretch" spacing={3}>
                      {mockInsights.map((insight) => (
                        <Box
                          key={insight.id}
                          p={3}
                          bg={highlightColor}
                          borderRadius="md"
                          borderLeftWidth="3px"
                          borderLeftColor={
                            insight.importance === 'high' ? 'error.500' :
                            insight.importance === 'medium' ? 'warning.500' :
                            'info.500'
                          }
                          transition="all 0.2s"
                          _hover={{ transform: "translateX(2px)" }}
                          cursor="pointer"
                        >
                          <Text fontSize="sm">{insight.title}</Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Tasks Card - Refined with better styling */}
        <GridItem>
          <Card
            shadow="md"
            bg={cardBgColor}
            borderColor={borderColor}
            borderWidth="1px"
            h="100%"
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={FiCheckCircle} color={accentColor} boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Heading size="md">Today's Tasks</Heading>
                    <Text fontSize="xs" color={secondaryTextColor}>Your upcoming tasks and deadlines</Text>
                  </VStack>
                </HStack>
                <Button
                  variant="ghost"
                  size="sm"
                  colorScheme="primary"
                  aria-label="View all tasks"
                >
                  <Icon as={FiMaximize} />
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                {mockTasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                  <Flex
                    key={task.id}
                    justify="space-between"
                    align="center"
                    p={3}
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor={
                      task.priority === 'high' ? 'error.500' :
                      task.priority === 'medium' ? 'warning.500' :
                      'info.500'
                    }
                    bg={subtleBgColor}
                    _hover={{ bg: hoverBgColor, transform: "translateX(2px)" }}
                    cursor="pointer"
                    transition="all 0.2s"
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">{task.title}</Text>
                      <Text fontSize="xs" color={secondaryTextColor}>Due: {task.dueDate}</Text>
                    </VStack>
                    <Tag
                      size="sm"
                      colorScheme={
                        task.priority === 'high' ? 'red' :
                        task.priority === 'medium' ? 'orange' :
                        'blue'
                      }
                      borderRadius="full"
                    >
                      {task.priority}
                    </Tag>
                  </Flex>
                ))}
                <Button size="sm" variant="outline" rightIcon={<FiClock />} width="full">
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
      <Box h="100vh" overflow="hidden" bg={bgColor} position="relative">
        {/* Accessibility Skip Link */}
        <SkipNavLink targetId="main-content" />

        {/* Header - Refined with better styling */}
        <Header
          user={user}
          onCreateProjectClick={handleCreateProjectClick}
          onLogout={handleLogout}
          onOpenBriefing={onBriefingOpen}
          onOpenNotifications={onNotificationsOpen}
        />

        {/* Main Layout Grid - Improved with better spacing and visual hierarchy */}
        <Grid
          templateColumns={{ base: "1fr", md: "64px 1fr" }}
          h={`calc(100vh - ${HEADER_HEIGHT})`}
          mt={HEADER_HEIGHT}
        >
          {/* Sidebar - Command Navigation Hub - Refined with better styling */}
          <GridItem
            as="aside"
            bg={cardBgColor}
            borderRightWidth="1px"
            borderColor={borderColor}
            boxShadow={`1px 0 3px ${shadowColor}`}
            zIndex="10"
            transition="all 0.2s"
            _hover={{
              width: { base: "auto", md: "200px" },
              position: { base: "fixed", md: "relative" },
              height: "100%",
            }}
          >
            {/* Pass the view change handler to SidebarNav */}
            <SidebarNav onViewChange={handleViewChange} activeView={workspaceView} />
          </GridItem>

          {/* Main Content Area - Command Center - Refined with better styling */}
          <GridItem
            as="main"
            overflow="auto"
            id="main-content"
            position="relative"
            bg={bgColor}
            px={{ base: 2, md: 4 }}
            py={{ base: 2, md: 4 }}
          >
            {/* Global Command Bar - Keyboard accessible (⌘+K) */}
            <Box
              position="absolute"
              top="16px"
              left="50%"
              transform="translateX(-50%)"
              zIndex="100"
              width={{ base: "90%", md: "600px" }}
              maxWidth="600px"
              bg={glassBgColor}
              backdropFilter="blur(8px)"
              borderRadius="lg"
              boxShadow="lg"
              border="1px solid"
              borderColor={borderColor}
              display={false ? "block" : "none"} // Toggle with keyboard shortcut
            >
              {/* Command bar content would go here */}
            </Box>

            {/* Render different views based on selected workspace view */}
            {workspaceView === 'command-center' && renderCommandCenterView()}
            {workspaceView === 'map-focus' && renderMapFocusView()}
            {workspaceView === 'grid' && renderGridView()}
          </GridItem>
        </Grid>

        {/* Modals and Panels - Refined with better styling */}
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

        {/* Keyboard Shortcuts Help - Toggle with ? key */}
        <Box
          position="fixed"
          bottom="16px"
          right="16px"
          zIndex="100"
          bg={cardBgColor}
          borderRadius="full"
          boxShadow="md"
          border="1px solid"
          borderColor={borderColor}
          width="40px"
          height="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          _hover={{ bg: hoverBgColor }}
          onClick={() => {/* Toggle keyboard shortcuts help */}}
        >
          <Text fontSize="lg" fontWeight="bold">?</Text>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}