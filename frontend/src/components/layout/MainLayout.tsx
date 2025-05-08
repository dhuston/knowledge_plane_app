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
  Tag,
  Portal,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FiMap } from 'react-icons/fi';
import { useAuth } from '../../auth/AuthContext';
import { MapWithAnalytics, WebGLMap, BasicMap } from '../map/core';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import ContextPanel from '../panels/ContextPanel';
import Header from './Header';
import SkipNavLink from '../ui/SkipNavLink';
import { useApiClient } from '../../hooks/useApiClient';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../error/ErrorBoundary';
// MyTeamTile import removed
import EntityActionButton from '../actions/EntityActionButton';
import HighlightedText, { HighlightedTextSegment } from '../text/HighlightedText';
// Feature flags import removed
import { HierarchyNavigator } from '../hierarchy/HierarchyNavigator';
import InsightsDailySummary from '../insights/InsightsDailySummary';

// Different workspace view types
type WorkspaceViewType = 'command-center' | 'map-focus' | 'grid';

// Define a fixed header height (adjust as needed based on Header content)
const HEADER_HEIGHT = '60px';

// No mock data needed anymore

export default function MainLayout() {
  const navigate = useNavigate();
  const { isLoading, logout, user } = useAuth();

  // Workspace view state
  const [workspaceView, setWorkspaceView] = useState<WorkspaceViewType>('command-center');
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  // State for active view
  const [activeView, setActiveView] = useState<'myWork' | 'explore'>('myWork');
  // Placeholder until overlaps feature re-implemented
  const projectOverlaps: Record<string, string[]> = {};
  const [isMapLoading, setIsMapLoading] = useState(true);
  const apiClient = useApiClient();

  // Theme colors - using our new color palette
  const bgColor = useColorModeValue('secondary.400', '#262626'); // Off-white/cream : Button color
  const cardBgColor = useColorModeValue('surface.500', '#363636'); // White : Lighter button color
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
  const secondaryTextColor = useColorModeValue('#565656', 'secondary.300'); // Button variant : Lighter off-white
  const accentColor = useColorModeValue('primary.600', 'primary.300'); // Sage green : Light mint green
  // Removed unused hoverBgColor variable
  const glassBgColor = useColorModeValue('rgba(241, 242, 234, 0.8)', 'rgba(38, 38, 38, 0.8)'); // Off-white/cream : Button color with transparency

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleMapNodeClick = (node: MapNode | null) => {
    if (node) {
      // Handle different node types
      if (node.type === MapNodeTypeEnum.TEAM) {
        // Navigate to team page
        navigate(`/team/${node.id}`);
        return;
      }
      // For other node types, show the briefing panel
      setSelectedNode(node);
    } else {
      // Clear selection when clicking on empty space
      setSelectedNode(null);
    }
  };

  // Handle linking nodes from the map
  const handleLinkNodes = (sourceNode: MapNode, targetNode: MapNode) => {
    // Open the entity linking modal with pre-filled source and target
    const sourceNodeId = sourceNode.id;
    const sourceNodeType = sourceNode.type;
    const targetNodeId = targetNode.id;
    const targetNodeType = targetNode.type;

    // Here you would open a modal to confirm the link type
    // For now, we'll just log the information
    console.log('Linking nodes:', {
      source: { id: sourceNodeId, type: sourceNodeType, label: sourceNode.label },
      target: { id: targetNodeId, type: targetNodeType, label: targetNode.label }
    });

    // You could implement a modal to confirm the link type
    // For example:
    // setLinkingNodes({ sourceNode, targetNode });
    // onLinkingModalOpen();
  };

  const useWebGL = ((import.meta as unknown) as { env: Record<string, string> }).env.VITE_WEBGL_MAP === 'true';


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

  // Render Map-Only View - Filling the entire space
  const renderMapFocusView = () => (
    <Box position="absolute" inset={0} overflow="hidden">
      <ErrorBoundary>
        {isMapLoading && (
          <Center position="absolute" inset={0} bg="rgba(0,0,0,0.1)" zIndex={1}>
            <Spinner size="xl" color="primary.500" />
          </Center>
        )}
        {/* Restored main map - now that BasicMap works successfully */}
        <MapWithAnalytics
          onNodeClick={handleMapNodeClick}
          onLoad={handleMapLoad}
          onLinkNodes={handleLinkNodes}
          showAnalyticsByDefault={false}
        />
      </ErrorBoundary>
    </Box>
  );

  // This state is already defined at the top of the component
  // const [activeView, setActiveView] = useState<'myWork' | 'explore' | 'analytics'>('myWork');

  // Render Grid View (could be customized as needed)
  const renderGridView = () => (
    <Box p={{ base: 6, md: 8 }} height="100%">
      <Heading size="lg" mb={6}>Grid View</Heading>
      <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={{ base: 6, md: 8, lg: 10 }}>
        {/* Project Cards */}
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Project Alpha</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>Strategy initiative focused on market expansion</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Project Beta</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>Product development for next-gen platform</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Project Gamma</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>Internal process optimization</Text>
          </CardBody>
        </Card>

        {/* Team Cards */}
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Design Team</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>8 members - UI/UX focus</Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Engineering Team</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>12 members - Platform & Infrastructure</Text>
          </CardBody>
        </Card>

        {/* Knowledge Cards */}
        <Card>
          <CardHeader p={{ base: 6, md: 8 }}>
            <Heading size="md">Q3 Strategy</Heading>
          </CardHeader>
          <CardBody p={{ base: 6, md: 8 }} pt={0}>
            <Text>Organization focus areas and priorities</Text>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );

  // Render Command Center View - Simplified with rearranged components
  const renderCommandCenterView = () => (
    <Box maxWidth="1400px" mx="auto" pb="120px">
      {/* Removed header section - no content needed here */}
      <Box mb={8}></Box>

      {/* Main Content Grid - Rearranged for better flow with increased spacing */}
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={{ base: 10, md: 12, lg: 16 }}
      >
        {/* Daily Briefing Card - Updated to match screenshot */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Card
            shadow="md"
            bg={cardBgColor}
            borderColor={borderColor}
            borderWidth="1px"
            borderRadius="xl"
            transition="all 0.2s"
            mb={10}
          >
            <CardBody p={{ base: 10, md: 12 }}>
              <VStack align="stretch" spacing={6}>
                {/* Header with greeting and action button */}
                <Flex direction="column" width="100%">
                  <Heading
                    size="lg"
                    mb={2}
                    color="#262626" // Dark button color for light mode
                    fontWeight="bold"
                    _dark={{ color: "secondary.400" }} // Off-white/cream for dark mode
                  >
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
                  </Heading>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    Here's what's happening in your research today
                  </Text>
                </Flex>

                {/* Using simplified InsightsDailySummary component */}
                <Box>
                  <InsightsDailySummary 
                    maxHeight="300px"
                    personalizationContext={{
                      userId: user?.id,
                      userName: user?.name,
                      filterPreferences: {
                        prioritizeTeamInsights: Boolean(user?.team_id),
                        showPersonalInsights: true
                      }
                    }}
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* MyTeamTile component removed */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Card
            shadow="md"
            bg={cardBgColor}
            borderColor={borderColor}
            borderWidth="1px"
            borderRadius="xl"
            transition="all 0.2s"
            onClick={() => {
              if (user?.team_id) {
                navigate(`/team/${user.team_id}`);
              } else {
                // If user doesn't have a team, show a message or navigate to teams list
                alert("You are not currently assigned to a team.");
              }
            }}
            cursor="pointer"
            _hover={{ shadow: "lg" }}
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <Heading size="md">{user?.team_id ? "My Team" : "Join a Team"}</Heading>
              <Text mt={2}>View team information and projects</Text>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );

  // This state is already defined at the top of the component
  // const [activeView, setActiveView] = useState<'myWork' | 'explore' | 'analytics'>('myWork');

  // Handle view change with additional logging to help debug
  const handleViewToggle = (view: 'myWork' | 'explore') => {
    console.log(`ViewToggle clicked: ${view}`);
    
    setActiveView(view);
    
    // Map views to workspace views
    const mappedView: WorkspaceViewType = view === 'myWork' ? 'command-center' : 'map-focus';
    console.log(`Changing workspace view to: ${mappedView}`);
    
    handleViewChange(mappedView);
    
    // Force the view change directly to ensure it works
    setWorkspaceView(mappedView);
  };

  return (
    <ErrorBoundary>
      <Box h="100vh" overflow="hidden" bg={bgColor} position="relative">
        {/* Accessibility Skip Link */}
        <SkipNavLink targetId="main-content" />

        {/* Header - Simplified with toggle */}
        <Header
          user={user}
          onLogout={handleLogout}
          onViewChange={handleViewToggle}
          activeView={activeView}
        />

        {/* Main Content Area with optional Hierarchy Navigator sidebar */}
        <Flex
          as="main"
          overflow="hidden"
          id="main-content"
          position="relative"
          h={`calc(100vh - ${HEADER_HEIGHT})`}
          mt={HEADER_HEIGHT}
        >
          {/* Hierarchy Navigator - Only shown in My Work view */}
          {activeView === 'myWork' && workspaceView === 'command-center' && (
            <Box height="100%" zIndex="5">
              <HierarchyNavigator 
                onUnitSelected={(unitId) => {
                  console.log(`Selected unit: ${unitId}`);
                  // Here we could filter workspace content based on organization unit
                }}
              />
            </Box>
          )}
          
          {/* Main Content */}
          <Box
            flex="1"
            overflow={workspaceView === 'map-focus' ? "hidden" : "auto"}
            bg={bgColor}
            px={workspaceView === 'map-focus' ? 0 : { base: 8, md: 16, lg: 32 }}
            py={workspaceView === 'map-focus' ? 0 : { base: 8, md: 10 }}
            maxWidth={workspaceView === 'map-focus' ? "100%" : "1800px"}
            mx="auto"
            width="100%"
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
              display="none" // Hidden by default, toggle with keyboard shortcut
            >
              {/* Command bar content would go here */}
            </Box>

            {/* Render different views based on selected workspace view */}
            {workspaceView === 'command-center' && renderCommandCenterView()}
            {workspaceView === 'map-focus' && renderMapFocusView()}
            {workspaceView === 'grid' && renderGridView()}
          </Box>
        </Flex>

        {/* Modals and Panels - Refined with better styling */}
        <Portal>
          {selectedNode && (
            <ContextPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              projectOverlaps={projectOverlaps}
              getProjectNameById={(id: string) => `Project ${id.substring(0, 4)}...`}
              onNodeClick={(nodeId) => {
                console.log("Node clicked in ContextPanel:", nodeId);
                if (nodeId) {
                  // Handle node click in the main layout
                  handleMapNodeClick({
                    id: nodeId,
                    label: `Item ${nodeId}`,
                    type: MapNodeTypeEnum.USER, // Default type
                    data: {}
                  });
                }
              }}
            />
          )}

          {/* Daily briefing panel removed as it's now integrated in the main view */}
        </Portal>



        {/* Entity Action Button for creating and linking entities */}
        <EntityActionButton
          onEntityCreated={(entityType, entity) => {
            // Refresh the map data when a new entity is created
            console.log(`New ${entityType} created:`, entity);
            // You could trigger a map refresh here
          }}
          onEntityLinked={() => {
            // Refresh the map data when entities are linked
            console.log('Entities linked');
            // You could trigger a map refresh here
          }}
        />
      </Box>
    </ErrorBoundary>
  );
}