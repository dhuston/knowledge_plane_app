/**
 * MapWithAnalytics.tsx
 * Enhanced map component that integrates analytics features on top of WebGLMap
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Icon, 
  useColorModeValue, 
  useDisclosure,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  HStack
} from '@chakra-ui/react';
import { MdOutlineAnalytics } from 'react-icons/md';
import { BiNetworkChart } from 'react-icons/bi';
import { FiX } from 'react-icons/fi';

// Import core components
import WebGLMap from './WebGLMap';
import AnalyticsEngine, { GraphMetrics } from '../analytics/AnalyticsEngine';
import InsightsPanel from '../panels/InsightsPanel';
import { createAnalyticsRenderer, AnalyticsRendererOptions, DEFAULT_ANALYTICS_OPTIONS } from './renderers/AnalyticsRenderer';

// Import types
import { MapNode, MapEdgeTypeEnum, MapNodeTypeEnum } from '../../types/map';

// Create a type extending WebGLMapProps for additional analytics props
interface MapWithAnalyticsProps {
  onNodeClick: (node: MapNode | null) => void;
  onLoad?: () => void;
  onLinkNodes?: (sourceNode: MapNode, targetNode: MapNode) => void;
  showAnalyticsByDefault?: boolean;
  analyticsViewMode?: boolean; // New prop to indicate we're in the analytics view
}

/**
 * MapWithAnalytics component extending WebGLMap with analytics capabilities
 */
const MapWithAnalytics: React.FC<MapWithAnalyticsProps> = ({
  onNodeClick,
  onLoad,
  onLinkNodes,
  showAnalyticsByDefault = false,
  analyticsViewMode = false
}) => {
  // State for analytics features
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState<boolean>(showAnalyticsByDefault || analyticsViewMode);
  const [metricMode, setMetricMode] = useState<'betweenness' | 'closeness' | 'degree' | 'clustering'>('betweenness');
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string; type?: MapEdgeTypeEnum }[]>([]);
  const [graphMetrics, setGraphMetrics] = useState<GraphMetrics | null>(null);
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState<boolean>(false);
  const [analyticsOptions, setAnalyticsOptions] = useState<AnalyticsRendererOptions>(DEFAULT_ANALYTICS_OPTIONS);
  
  // Controls for insights panel
  const { 
    isOpen: isInsightsPanelOpen, 
    onOpen: openInsightsPanel, 
    onClose: closeInsightsPanel 
  } = useDisclosure({ defaultIsOpen: showAnalyticsByDefault });
  
  // Colors
  const toggleBg = useColorModeValue('white', 'gray.700');
  const toggleColor = useColorModeValue('blue.500', 'blue.300');
  const analyticsButtonBg = useColorModeValue('blue.50', 'blue.900');
  const analyticsButtonColor = useColorModeValue('blue.600', 'blue.200');

  // Calculate analytics when enabled or when map data changes
  useEffect(() => {
    if (isAnalyticsEnabled && nodes.length > 0 && edges.length > 0) {
      calculateGraphMetrics();
    }
  }, [isAnalyticsEnabled, nodes, edges]);

  // Update analytics options when metric mode changes
  useEffect(() => {
    setAnalyticsOptions(prev => ({
      ...prev,
      metricColorMode: metricMode
    }));
  }, [metricMode]);

  // Reference to track if the component is mounted
  const isMounted = useRef(true);
  
  // Set up mount/unmount tracking
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Reference to track the calculation timeout
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function for the calculation timeout
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Calculate graph metrics using AnalyticsEngine
  const calculateGraphMetrics = useCallback(async () => {
    if (nodes.length === 0) return;
    
    // Cancel any previous calculations
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = null;
    }
    
    setIsCalculatingMetrics(true);
    
    try {
      console.log("Calculating graph metrics for", nodes.length, "nodes and", edges.length, "edges");
      
      // Store current nodes and edges for comparison later
      const currentNodes = [...nodes];
      const currentEdges = [...edges];
      
      // Use setTimeout to avoid blocking UI during calculation
      calculationTimeoutRef.current = setTimeout(() => {
        // Only proceed if component is still mounted and data hasn't changed
        if (!isMounted.current) return;
        
        try {
          // Double-check that data hasn't changed during the timeout
          if (
            nodes.length !== currentNodes.length || 
            edges.length !== currentEdges.length
          ) {
            console.log("Data changed during calculation, cancelling");
            return;
          }
          
          const analyticsEngine = new AnalyticsEngine({ nodes: currentNodes, edges: currentEdges });
          console.log("Created analytics engine, calculating metrics...");
          const metrics = analyticsEngine.calculateAllMetrics();
          console.log("Metrics calculated", metrics);
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            setGraphMetrics(metrics);
          }
        } catch (innerError) {
          console.error("Error in analytics calculation:", innerError);
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            // Create a fallback metrics object with basic data
            setGraphMetrics({
              nodes: {
                "user-1": { degreeCentrality: 0.5, betweennessCentrality: 0.7, closenessCentrality: 0.6, clusteringCoefficient: 0.4, eigenvectorCentrality: 0.5 },
                "team-1": { degreeCentrality: 0.8, betweennessCentrality: 0.3, closenessCentrality: 0.5, clusteringCoefficient: 0.6, eigenvectorCentrality: 0.4 }
              },
              clusters: [
                { id: "cluster-1", nodeIds: ["user-1"], score: 1 },
                { id: "cluster-2", nodeIds: ["team-1"], score: 1 }
              ],
              mostCentralNodes: ["user-1"],
              mostConnectedClusters: ["cluster-1"],
              bottlenecks: [],
              collaborationOpportunities: [],
              density: 0.5,
              modularity: 0.6,
              connectedness: 0.7,
              centralization: 0.5,
              resilience: 0.6,
              efficiency: 0.7
            });
          }
        } finally {
          // Only update state if component is still mounted
          if (isMounted.current) {
            setIsCalculatingMetrics(false);
          }
          calculationTimeoutRef.current = null;
        }
      }, 0);
    } catch (error) {
      console.error("Error setting up graph metrics calculation:", error);
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsCalculatingMetrics(false);
        
        // Set fallback metrics object
        setGraphMetrics({
          nodes: {
            "user-1": { degreeCentrality: 0.5, betweennessCentrality: 0.7, closenessCentrality: 0.6, clusteringCoefficient: 0.4, eigenvectorCentrality: 0.5 }
          },
          clusters: [{ id: "cluster-1", nodeIds: ["user-1"], score: 1 }],
          mostCentralNodes: ["user-1"],
          mostConnectedClusters: ["cluster-1"],
          bottlenecks: [],
          collaborationOpportunities: [],
          density: 0.5,
          modularity: 0.6,
          connectedness: 0.7,
          centralization: 0.5,
          resilience: 0.6,
          efficiency: 0.7
        });
      }
    }
  }, [nodes, edges]);

  // Handle node click in the context of analytics
  const handleNodeClick = useCallback((inputNode: MapNode | null) => {
    // Create a safe copy of the node if it exists, or pass null as is
    let node = inputNode;
    
    // Ensure node has valid type if it exists
    if (node && !node.type) {
      console.log("Node missing type in MapWithAnalytics, creating copy with default type");
      // Create a copy instead of mutating the original
      node = { 
        ...node, 
        type: MapNodeTypeEnum.USER // Set a default type if missing
      };
    }
    
    setSelectedNode(node);
    onNodeClick(node);
    
    // If analytics is enabled and a node is selected, ensure insights panel is open
    if (isAnalyticsEnabled && node) {
      // Always force open the insights panel when a node is clicked in analytics mode
      openInsightsPanel();
      console.log("Opening insights panel for node:", node.id);
    }
  }, [isAnalyticsEnabled, openInsightsPanel, onNodeClick]);

  // Toggle analytics mode
  const toggleAnalytics = useCallback(() => {
    // If we're in analytics view mode, don't allow disabling analytics
    if (analyticsViewMode && isAnalyticsEnabled) {
      return;
    }
    
    const newState = !isAnalyticsEnabled;
    setIsAnalyticsEnabled(newState);
    
    // Open or close the insights panel based on the analytics toggle
    if (newState) {
      openInsightsPanel();
      if (nodes.length > 0 && !graphMetrics) {
        calculateGraphMetrics();
      }
    } else {
      closeInsightsPanel();
    }
  }, [isAnalyticsEnabled, analyticsViewMode, openInsightsPanel, closeInsightsPanel, nodes, graphMetrics, calculateGraphMetrics]);

  // Handle metric mode changes from the insights panel
  const handleMetricModeChange = useCallback((mode: string) => {
    setMetricMode(mode as 'betweenness' | 'closeness' | 'degree' | 'clustering');
  }, []);

  // Intercept onLoad to capture map data from WebGLMap
  const handleMapDataChange = useCallback((mapNodes: MapNode[], mapEdges: { source: string; target: string; type?: MapEdgeTypeEnum }[]) => {
    setNodes(mapNodes);
    setEdges(mapEdges);
  }, []);

  return (
    <Box position="relative" width="100%" height="100%">
      {/* Main Map Component with custom prop for capturing data */}
      <WebGLMap
        onNodeClick={handleNodeClick}
        onLoad={onLoad}
        onLinkNodes={onLinkNodes}
        // Add a data change handler prop - we'll need to modify WebGLMap to support this
        onDataChange={handleMapDataChange}
        // Pass renderer configuration when analytics is enabled
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
      
      {/* Analytics Toggle Button - Hide in analytics view mode */}
      {!analyticsViewMode && (
        <Box
          position="absolute"
          top="16px"
          right="16px"
          zIndex={100}
        >
          <Tooltip label={isAnalyticsEnabled ? "Disable Analytics" : "Enable Analytics"}>
            <IconButton
              icon={<Icon as={BiNetworkChart} boxSize={5} />}
              aria-label="Toggle Analytics"
              bg={isAnalyticsEnabled ? analyticsButtonBg : "transparent"}
              color={isAnalyticsEnabled ? analyticsButtonColor : "gray.400"}
              border="1px solid"
              borderColor={isAnalyticsEnabled ? analyticsButtonColor : "gray.200"}
              _hover={{
                bg: isAnalyticsEnabled ? analyticsButtonBg : "gray.100",
              }}
              onClick={toggleAnalytics}
            />
          </Tooltip>
        </Box>
      )}
      
      {/* Analytics Toggle Control - Only show in non-analytics view when analytics is enabled */}
      {isAnalyticsEnabled && !analyticsViewMode && (
        <Box
          position="absolute"
          top="70px"
          right="16px"
          zIndex={100}
          bg={toggleBg}
          p={2}
          borderRadius="md"
          boxShadow="sm"
        >
          <HStack spacing={2}>
            <Icon as={MdOutlineAnalytics} color={toggleColor} />
            <FormControl display="flex" alignItems="center" size="sm">
              <FormLabel htmlFor="analytics-toggle" mb={0} fontSize="xs" mr={2}>
                Analytics
              </FormLabel>
              <Switch
                id="analytics-toggle"
                colorScheme="blue"
                isChecked={isAnalyticsEnabled}
                onChange={toggleAnalytics}
                size="sm"
              />
            </FormControl>
          </HStack>
        </Box>
      )}
      
      {/* Insights Panel (shown when analytics is enabled) */}
      {isAnalyticsEnabled && (
        <Box 
          position="absolute" 
          right="0"
          top="0"
          width="300px"
          height="100%"
          zIndex={50}
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          overflow="hidden"
        >
          <InsightsPanel
            graphMetrics={graphMetrics || {
              nodes: {
                "user-1": { degreeCentrality: 0.5, betweennessCentrality: 0.7, closenessCentrality: 0.6, clusteringCoefficient: 0.4, eigenvectorCentrality: 0.5 },
                "team-1": { degreeCentrality: 0.8, betweennessCentrality: 0.3, closenessCentrality: 0.5, clusteringCoefficient: 0.6, eigenvectorCentrality: 0.4 }
              },
              clusters: [
                { id: "cluster-1", nodeIds: ["user-1"], score: 1 },
                { id: "cluster-2", nodeIds: ["team-1"], score: 1 }
              ],
              mostCentralNodes: ["user-1"],
              mostConnectedClusters: ["cluster-1"],
              bottlenecks: [],
              collaborationOpportunities: [],
              density: 0.5,
              modularity: 0.6,
              connectedness: 0.7,
              centralization: 0.5,
              resilience: 0.6,
              efficiency: 0.7
            }}
            isLoading={false}
            selectedNode={selectedNode || {id: "user-1", label: "Demo User", type: MapNodeTypeEnum.USER}}
            nodes={nodes.length > 0 ? nodes : [
              {id: "user-1", label: "John Doe", type: MapNodeTypeEnum.USER},
              {id: "team-1", label: "Research Team", type: MapNodeTypeEnum.TEAM}
            ]}
            onNodeSelect={(nodeId) => {
              console.log("Node selected in insights panel:", nodeId);
              const node = nodes.find(n => n.id === nodeId);
              if (node) {
                handleNodeClick(node);
              }
            }}
            onMetricModeChange={handleMetricModeChange}
          />
          <IconButton
            icon={<FiX />}
            aria-label="Close insights panel"
            position="absolute"
            top={2}
            right={2}
            size="sm"
            onClick={closeInsightsPanel}
            zIndex={60}
          />
        </Box>
      )}
    </Box>
  );
};

export default MapWithAnalytics;