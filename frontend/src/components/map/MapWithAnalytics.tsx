import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Icon, 
  useColorModeValue, 
  useDisclosure,
  Tooltip,
  HStack,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Divider,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Badge,
  VStack,
  Spinner,
  List,
  ListItem,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react';
import { MdOutlineAnalytics } from 'react-icons/md';
import { BiNetworkChart, BiExpand, BiCollapseAlt } from 'react-icons/bi';
import { FiX, FiMaximize, FiMinimize, FiArrowRight, FiArrowDown, FiChevronDown, FiMove } from 'react-icons/fi';

import WebGLMap from './WebGLMap';
import AnalyticsEngine, { GraphMetrics } from '../analytics/AnalyticsEngine';
import InsightsPanel from '../panels/InsightsPanel';
import { createAnalyticsRenderer, AnalyticsRendererOptions, DEFAULT_ANALYTICS_OPTIONS } from './renderers/AnalyticsRenderer';
import { MdDataUsage, MdGroups, MdOutlineHub } from 'react-icons/md';

import { MapNode, MapEdgeTypeEnum, MapNodeTypeEnum } from '../../types/map';

interface MapWithAnalyticsProps {
  onNodeClick: (node: MapNode | null) => void;
  onLoad?: () => void;
  onLinkNodes?: (sourceNode: MapNode, targetNode: MapNode) => void;
  showAnalyticsByDefault?: boolean;
  analyticsViewMode?: boolean;
}

// Panel position types
type PanelPosition = 'bottom' | 'right' | 'full';

const MapWithAnalytics: React.FC<MapWithAnalyticsProps> = ({
  onNodeClick,
  onLoad,
  onLinkNodes,
  showAnalyticsByDefault = false,
  analyticsViewMode = false
}) => {
  // Analytics state
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState<boolean>(showAnalyticsByDefault || analyticsViewMode);
  const [metricMode, setMetricMode] = useState<'betweenness' | 'closeness' | 'degree' | 'clustering'>('betweenness');
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string; type?: MapEdgeTypeEnum }[]>([]);
  const [graphMetrics, setGraphMetrics] = useState<GraphMetrics | null>(null);
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analyticsOptions, setAnalyticsOptions] = useState<AnalyticsRendererOptions>(DEFAULT_ANALYTICS_OPTIONS);
  
  // Fixed panel state - always use right side panel
  const panelPosition = 'right';
  const [panelSize, setPanelSize] = useState<{height: string, width: string}>({height: '100%', width: '320px'});
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartPos = useRef<{x: number, y: number}>({x: 0, y: 0});
  const startSize = useRef<{height: number, width: number}>({height: 0, width: 0});
  
  const { 
    isOpen: isInsightsPanelOpen, 
    onOpen: openInsightsPanel, 
    onClose: closeInsightsPanel 
  } = useDisclosure({ defaultIsOpen: showAnalyticsByDefault });
  
  // No need to force analytics mode since we removed the dedicated analytics view
  // This would have been where we'd force-enable analytics, but we're now using a simpler toggle approach
  
  const toggleBg = useColorModeValue('white', 'gray.700');
  const toggleColor = useColorModeValue('blue.500', 'blue.300');
  const analyticsButtonBg = useColorModeValue('blue.50', 'blue.900');
  const analyticsButtonColor = useColorModeValue('blue.600', 'blue.200');

  useEffect(() => {
    if (isAnalyticsEnabled && nodes.length > 0 && edges.length > 0) {
      setIsLoading(true);
      calculateGraphMetrics().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isAnalyticsEnabled, nodes, edges]);

  useEffect(() => {
    setAnalyticsOptions(prev => ({
      ...prev,
      metricColorMode: metricMode
    }));
  }, [metricMode]);

  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = null;
      }
    };
  }, []);
  
  const calculateGraphMetrics = useCallback(async () => {
    if (nodes.length === 0) return Promise.resolve();
    
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = null;
    }
    
    setIsCalculatingMetrics(true);
    
    return new Promise<void>((resolve) => {
      try {
        console.log("Calculating graph metrics for", nodes.length, "nodes and", edges.length, "edges");
        
        const currentNodes = [...nodes];
        const currentEdges = [...edges];
        
        calculationTimeoutRef.current = setTimeout(() => {
          if (!isMounted.current) {
            resolve();
            return;
          }
          
          try {
            if (
              nodes.length !== currentNodes.length || 
              edges.length !== currentEdges.length
            ) {
              console.log("Data changed during calculation, cancelling");
              resolve();
              return;
            }
            
            const analyticsEngine = new AnalyticsEngine({ nodes: currentNodes, edges: currentEdges });
            console.log("Created analytics engine, calculating metrics...");
            const metrics = analyticsEngine.calculateAllMetrics();
            console.log("Metrics calculated", metrics);
            
            if (isMounted.current) {
              setGraphMetrics(metrics);
            }
          } catch (innerError) {
            console.error("Error in analytics calculation:", innerError);
            
            if (isMounted.current) {
              // Instead of using mock data, just set null metrics which will prevent showing analytics
              setGraphMetrics(null);
            }
          } finally {
            if (isMounted.current) {
              setIsCalculatingMetrics(false);
            }
            calculationTimeoutRef.current = null;
            resolve();
          }
        }, 0);
      } catch (error) {
        console.error("Error setting up graph metrics calculation:", error);
        
        if (isMounted.current) {
          setIsCalculatingMetrics(false);
          setGraphMetrics(null);
        }
        resolve();
      }
    });
  }, [nodes, edges]);

  // Resize panel handlers
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    
    // Store starting position
    resizeStartPos.current = { 
      x: e.clientX, 
      y: e.clientY 
    };
    
    // Parse current size values
    const currentHeight = parseFloat(panelSize.height);
    const currentWidth = parseFloat(panelSize.width);
    
    // Store starting size
    startSize.current = {
      height: isNaN(currentHeight) ? 35 : currentHeight, 
      width: isNaN(currentWidth) ? 320 : currentWidth
    };
    
    // Add global event listeners
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, [panelSize]);
  
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStartPos.current.x;
    
    // Calculate new width (pixels)
    const newWidthPx = startSize.current.width + deltaX;
    
    // Constrain width (min 250px, max 50% of viewport)
    const maxWidth = window.innerWidth * 0.5;
    const constrained = Math.min(Math.max(newWidthPx, 250), maxWidth);
    setPanelSize(prev => ({ ...prev, width: `${constrained}px` }));
  }, [isResizing]);
  
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  // Toggle full screen mode
  const toggleFullScreen = useCallback(() => {
    if (panelSize.width === '100%') {
      // Exit full screen
      setPanelSize({ width: '320px', height: '100%' });
    } else {
      // Enter full screen
      setPanelSize({ width: '100%', height: '100%' });
    }
  }, [panelSize.width]);

  const handleNodeClick = useCallback((inputNode: MapNode | null) => {
    let node = inputNode;
    
    if (node && !node.type) {
      console.log("Node missing type in MapWithAnalytics, creating copy with default type");
      node = { 
        ...node, 
        type: MapNodeTypeEnum.USER
      };
    }
    
    setSelectedNode(node);
    
    // IMPORTANT: Check if onNodeClick exists before calling it
    if (typeof onNodeClick === 'function') {
      onNodeClick(node);
    } else {
      console.warn('onNodeClick is not defined in MapWithAnalytics');
    }
    
    if (isAnalyticsEnabled && node) {
      openInsightsPanel();
      console.log("Opening insights panel for node:", node.id);
    }
  }, [isAnalyticsEnabled, openInsightsPanel, onNodeClick]);

  const toggleAnalytics = useCallback(() => {
    if (analyticsViewMode && isAnalyticsEnabled) {
      return;
    }
    
    const newState = !isAnalyticsEnabled;
    setIsAnalyticsEnabled(newState);
    
    if (newState) {
      openInsightsPanel();
      if (nodes.length > 0 && !graphMetrics) {
        setIsLoading(true);
        calculateGraphMetrics().finally(() => {
          setIsLoading(false);
        });
      }
    } else {
      closeInsightsPanel();
    }
  }, [isAnalyticsEnabled, analyticsViewMode, openInsightsPanel, closeInsightsPanel, nodes, graphMetrics, calculateGraphMetrics]);

  const handleMetricModeChange = useCallback((mode: string) => {
    setMetricMode(mode as 'betweenness' | 'closeness' | 'degree' | 'clustering');
  }, []);

  const handleMapDataChange = useCallback((mapNodes: MapNode[], mapEdges: { source: string; target: string; type?: MapEdgeTypeEnum }[]) => {
    setNodes(mapNodes);
    setEdges(mapEdges);
  }, []);

  return (
    <Box position="absolute" inset="0">
      <WebGLMap
        onNodeClick={handleNodeClick}
        onLoad={onLoad}
        onLinkNodes={onLinkNodes}
        onDataChange={handleMapDataChange}
        analyticsEnabled={isAnalyticsEnabled}
        analyticsRenderer={graphMetrics ? 
          { 
            createRenderer: createAnalyticsRenderer,
            metrics: graphMetrics.nodes || {},
            clusters: (graphMetrics.clusters || []).reduce((acc, cluster) => {
              acc[cluster.id] = cluster.nodeIds;
              return acc;
            }, {} as Record<string, string[]>),
            options: analyticsOptions
          } : undefined}
      />
      
      {/* Ultra-simple Analytics Toggle Button - top right corner, away from side panel */}
      {!analyticsViewMode && (
        <Box
          position="absolute"
          top="16px"
          right="16px"
          zIndex={100}
        >
          <Tooltip label={isAnalyticsEnabled ? "Hide Analytics" : "Show Analytics"} placement="left">
            <IconButton
              icon={<Icon as={BiNetworkChart} boxSize={5} />}
              aria-label="Toggle Analytics"
              onClick={toggleAnalytics}
              colorScheme={isAnalyticsEnabled ? "blue" : "gray"}
              bg={isAnalyticsEnabled ? analyticsButtonBg : "white"}
              color={isAnalyticsEnabled ? analyticsButtonColor : "gray.400"}
              border="1px solid"
              borderColor={isAnalyticsEnabled ? analyticsButtonColor : "gray.200"}
              size="md"
              shadow="md"
              _hover={{
                bg: isAnalyticsEnabled ? analyticsButtonBg : "gray.100",
              }}
            />
          </Tooltip>
        </Box>
      )}
      
      {/* Fixed Side Insights Panel */}
      {isAnalyticsEnabled && (
        <Box
          position="absolute"
          left="auto"
          right={0}
          top="60px" /* Adjusted to prevent overlapping with header */
          bottom={0}
          width={panelSize.width}
          height="calc(100% - 60px)" /* Adjusted height to account for header */
          zIndex={50}
          borderLeft="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="lg"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          transition="width 0.2s"
        >
          {/* Side panel resize handle */}
          <Box
            position="absolute"
            cursor="ew-resize"
            width="6px"
            height="100%"
            top={0}
            left="-3px"
            zIndex={2}
            onMouseDown={handleResizeStart}
            _hover={{ bg: "rgba(0,0,0,0.05)" }}
          />

          {/* Unified Panel Header with metrics controls */}
          <Flex 
            p={3}
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderBottom="1px solid" 
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            justifyContent="space-between"
            alignItems="center"
          >
            <HStack spacing={2}>
              <Icon as={MdOutlineAnalytics} boxSize={5} />
              <VStack align="flex-start" spacing={0}>
                <Heading size="sm">Network Analytics</Heading>
                {selectedNode && (
                  <Text fontSize="xs" color="gray.500">
                    {selectedNode.label} ({selectedNode.type})
                  </Text>
                )}
              </VStack>
            </HStack>
            
            <HStack>
              {/* Full Screen toggle */}
              <Tooltip label={panelSize.width === '100%' ? "Exit Full Screen" : "Full Screen"} placement="top">
                <IconButton
                  icon={panelSize.width === '100%' ? <FiMinimize /> : <FiMaximize />}
                  aria-label="Toggle full screen"
                  size="sm"
                  colorScheme={panelSize.width === '100%' ? 'blue' : undefined}
                  variant="ghost"
                  onClick={toggleFullScreen}
                />
              </Tooltip>
              
              {/* Close button */}
              <IconButton
                icon={<FiX />}
                aria-label="Close insights panel"
                size="sm"
                variant="ghost"
                onClick={() => {
                  closeInsightsPanel();
                  setIsAnalyticsEnabled(false);
                }}
              />
            </HStack>
          </Flex>
          
          {/* Metric Type Selector */}
          <Flex 
            px={3} 
            py={2} 
            bg={useColorModeValue('gray.100', 'gray.800')} 
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            justifyContent="center"
          >
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="medium">Metric:</Text>
              <HStack spacing={1}>
                <Badge 
                  px={2} py={1} 
                  cursor="pointer"
                  colorScheme={metricMode === 'betweenness' ? 'blue' : 'gray'} 
                  onClick={() => handleMetricModeChange('betweenness')}
                >
                  Betweenness
                </Badge>
                <Badge 
                  px={2} py={1} 
                  cursor="pointer"
                  colorScheme={metricMode === 'closeness' ? 'blue' : 'gray'} 
                  onClick={() => handleMetricModeChange('closeness')}
                >
                  Closeness
                </Badge>
                <Badge 
                  px={2} py={1} 
                  cursor="pointer"
                  colorScheme={metricMode === 'degree' ? 'blue' : 'gray'} 
                  onClick={() => handleMetricModeChange('degree')}
                >
                  Degree
                </Badge>
              </HStack>
            </HStack>
          </Flex>
          
          {/* Main content area - with customized InsightsPanel */}
          <Box flex="1" overflow="auto">
            {/* Using customized render of InsightsPanel without redundant header */}
            {isLoading ? (
              <Box flex="1" display="flex" alignItems="center" justifyContent="center" p={8}>
                <Spinner size="xl" />
              </Box>
            ) : (
              <Box p={4}>
                {/* Render tabs directly */}
                <Tabs variant="enclosed" colorScheme="blue" size="sm">
                  <TabList>
                    <Tab><Icon as={MdDataUsage} mr={2} />Metrics</Tab>
                    <Tab><Icon as={MdGroups} mr={2} />Clusters</Tab>
                    <Tab><Icon as={MdOutlineHub} mr={2} />Network</Tab>
                  </TabList>
                  <TabPanels>
                    {/* Same content structure as InsightsPanel but with header removed */}
                    {/* Top nodes by metric */}
                    <TabPanel>
                      <Box mb={4}>
                        <Heading size="xs" mb={2}>Top Entities</Heading>
                        <List spacing={1}>
                          {getTopNodesByMetric(5).length > 0 ? (
                            getTopNodesByMetric(5).map((node) => (
                              <ListItem
                                key={node.id}
                                p={2}
                                borderRadius="md"
                                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                                cursor="pointer"
                                onClick={() => handleNodeClick(node)}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <HStack>
                                  <Badge colorScheme={node.type === MapNodeTypeEnum.USER ? 'green' : node.type === MapNodeTypeEnum.TEAM ? 'blue' : 'purple'}>
                                    {node.type}
                                  </Badge>
                                  <Text fontSize="sm">{node.label}</Text>
                                </HStack>
                                {graphMetrics?.nodes?.[node.id] && (
                                  <Badge colorScheme="blue">
                                    {formatMetricValue(graphMetrics.nodes[node.id][`${metricMode}Centrality`] || 0)}
                                  </Badge>
                                )}
                              </ListItem>
                            ))
                          ) : (
                            <ListItem p={2} borderRadius="md">
                              <Text fontSize="sm" color="gray.500">
                                No entities found with this metric.
                              </Text>
                            </ListItem>
                          )}
                        </List>
                      </Box>

                      {/* Selected node metrics */}
                      {selectedNode && graphMetrics?.nodes && graphMetrics.nodes[selectedNode.id] && (
                        <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat size="sm">
                              <StatLabel>Degree Centrality</StatLabel>
                              <StatNumber>
                                {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.degreeCentrality || 0)}
                              </StatNumber>
                              <StatHelpText>Direct connections</StatHelpText>
                            </Stat>
                            <Stat size="sm">
                              <StatLabel>Betweenness</StatLabel>
                              <StatNumber>
                                {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.betweennessCentrality || 0)}
                              </StatNumber>
                              <StatHelpText>Bridge importance</StatHelpText>
                            </Stat>
                            <Stat size="sm">
                              <StatLabel>Closeness</StatLabel>
                              <StatNumber>
                                {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.closenessCentrality || 0)}
                              </StatNumber>
                              <StatHelpText>Network proximity</StatHelpText>
                            </Stat>
                            <Stat size="sm">
                              <StatLabel>Clustering</StatLabel>
                              <StatNumber>
                                {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.clusteringCoefficient || 0)}
                              </StatNumber>
                              <StatHelpText>Connected neighbors</StatHelpText>
                            </Stat>
                          </SimpleGrid>
                        </Box>
                      )}
                    </TabPanel>

                    {/* Clusters Panel - same as InsightsPanel but simplified */}
                    <TabPanel>
                      <Text fontSize="sm" color="gray.500" mb={4}>
                        {graphMetrics?.clusters?.length || 0} clusters identified in the network
                      </Text>
                      
                      <List spacing={3}>
                        {(graphMetrics?.clusters || []).map((cluster, index) => (
                          <Box 
                            key={cluster.id} 
                            p={3} 
                            borderWidth="1px" 
                            borderRadius="md"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                          >
                            <HStack mb={1} justify="space-between">
                              <Text fontWeight="medium">Cluster {index + 1}</Text>
                              <Badge colorScheme="blue">{cluster.nodeIds.length} entities</Badge>
                            </HStack>
                            
                            <List>
                              {cluster.nodeIds
                                .slice(0, 3)
                                .map(id => nodes.find(n => n.id === id))
                                .filter(Boolean)
                                .map(node => (
                                  <ListItem 
                                    key={node!.id} 
                                    fontSize="sm" 
                                    cursor="pointer"
                                    onClick={() => handleNodeClick(node!)}
                                    _hover={{ textDecoration: "underline" }}
                                  >
                                    {node!.label} ({node!.type})
                                  </ListItem>
                                ))
                              }
                              {cluster.nodeIds.length > 3 && (
                                <Text fontSize="xs" color="gray.500">
                                  ...and {cluster.nodeIds.length - 3} more
                                </Text>
                              )}
                            </List>
                          </Box>
                        ))}
                      </List>
                    </TabPanel>

                    {/* Network Panel - simplified */}
                    <TabPanel>
                      {/* Network statistics */}
                      <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <SimpleGrid columns={2} spacing={4}>
                          <Stat size="sm">
                            <StatLabel>Total Nodes</StatLabel>
                            <StatNumber>{nodes.length}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel>Clusters</StatLabel>
                            <StatNumber>{graphMetrics?.clusters?.length || 0}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel>Density</StatLabel>
                            <StatNumber>{graphMetrics?.density ? (graphMetrics.density * 100).toFixed(1) + '%' : 'N/A'}</StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel>Centralization</StatLabel>
                            <StatNumber>{graphMetrics?.centralization ? (graphMetrics.centralization * 100).toFixed(1) + '%' : 'N/A'}</StatNumber>
                          </Stat>
                        </SimpleGrid>
                      </Box>

                      {/* Recommendations based on metrics */}
                      {selectedNode && (
                        <Box>
                          <Heading size="xs" mb={2}>Recommendations</Heading>
                          <List spacing={2}>
                            {generateRecommendations().length > 0 ? (
                              generateRecommendations().map((recommendation, index) => (
                                <ListItem 
                                  key={index} 
                                  fontSize="sm" 
                                  p={2} 
                                  borderRadius="md" 
                                  bg={useColorModeValue('yellow.50', 'yellow.900')}
                                  color={useColorModeValue('yellow.800', 'yellow.200')}
                                >
                                  {recommendation}
                                </ListItem>
                              ))
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                No recommendations available for this node.
                              </Text>
                            )}
                          </List>
                        </Box>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  // Utility functions extracted from InsightsPanel
  function getTopNodesByMetric(count: number = 5): MapNode[] {
    if (!graphMetrics || !graphMetrics.nodes) return [];
    
    try {
      const nodeScores = Object.entries(graphMetrics.nodes || {}).map(([nodeId, metrics]) => {
        if (!metrics) return { nodeId, score: 0 };
        
        let score = 0;
        switch (metricMode) {
          case 'degree':
            score = metrics.degreeCentrality || 0;
            break;
          case 'betweenness':
            score = metrics.betweennessCentrality || 0;
            break;
          case 'closeness':
            score = metrics.closenessCentrality || 0;
            break;
          case 'clustering':
            score = metrics.clusteringCoefficient || 0;
            break;
          default:
            score = metrics.betweennessCentrality || 0;
        }
        return { nodeId, score };
      });
      
      // Sort by score and get top nodes
      const topNodeIds = nodeScores
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(item => item.nodeId);
        
      // Map to actual node objects
      return topNodeIds
        .map(id => nodes.find(n => n.id === id))
        .filter((node): node is MapNode => !!node);
    } catch (error) {
      console.error("Error getting top nodes by metric:", error);
      return [];
    }
  }

  function formatMetricValue(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  function generateRecommendations(): string[] {
    if (!graphMetrics || !graphMetrics.nodes || !selectedNode) return [];
    
    const recommendations: string[] = [];
    
    try {
      // Get metrics for the selected node
      const metrics = graphMetrics.nodes[selectedNode.id];
      if (!metrics) return [];
      
      // Recommendation based on betweenness
      if ((metrics.betweennessCentrality || 0) > 0.7) {
        recommendations.push(
          "This node is a critical connector. Consider reducing dependency on this entity."
        );
      } else if ((metrics.betweennessCentrality || 0) < 0.1) {
        recommendations.push(
          "This entity has low connectivity. Consider establishing more relationships."
        );
      }
      
      // Recommendation based on clustering
      if ((metrics.clusteringCoefficient || 0) > 0.8) {
        recommendations.push(
          "This entity is in a highly clustered group. Look for opportunities to connect with other clusters."
        );
      } else if ((metrics.clusteringCoefficient || 0) < 0.2) {
        recommendations.push(
          "This entity's connections are not well connected to each other. Consider strengthening internal relationships."
        );
      }
      
      // Add more recommendations based on other metrics
      if ((metrics.degreeCentrality || 0) > 0.6) {
        recommendations.push(
          "This entity has many direct connections. Review if all connections are necessary."
        );
      }
      
      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return ["Unable to generate recommendations due to data issues."];
    }
  }
};

export default MapWithAnalytics;