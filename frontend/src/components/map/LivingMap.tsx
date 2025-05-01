/**
 * LivingMap.tsx
 * Enhanced map visualization component using Sigma with viewport-based loading and LOD
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapData, MapNodeTypeEnum, MapNode } from '../../types/map';
import { Box, Spinner, Text, useToast, IconButton, useDisclosure, Input, HStack, List, 
         ListItem, Select, FormControl, FormLabel, Switch, VStack, Badge } from '@chakra-ui/react';
import { FaFilter } from 'react-icons/fa';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useApiClient } from '../../hooks/useApiClient';
import { useDeltaStream } from '../../hooks/useDeltaStream';

// Import from the shared styles
import { nodeStyles } from './styles/MapStyles';

// Import Sigma components
import { 
  SigmaContainer, 
  ControlsContainer, 
  LayoutForceAtlas2Control,
  useCamera, 
  useSigma 
} from '@react-sigma/core';
import SigmaGraphLoader from './SigmaGraphLoader';

// Import ContextPanel
import ContextPanel from '../panels/ContextPanel';

// Define type for search results
interface SearchResult {
  id: string;
  label: string;
  type?: MapNodeTypeEnum;
}

// Define viewport type for camera position tracking
interface Viewport {
  x: number;
  y: number;
  ratio: number;
  angle: number;
}

// Define filter options
interface MapFilters {
  types: MapNodeTypeEnum[];
  statuses: string[];
  depth: number;
  clusterTeams: boolean;
  centerNodeId?: string | null;
}

// Define available statuses
const AVAILABLE_STATUSES = ['active', 'planning', 'completed', 'blocked', 'archived'];

interface LivingMapProps {
  onNodeClick: (nodeId: string | null) => void;
  isClustered?: boolean;
  projectOverlaps: Record<string, string[]>;
  onMapLoad?: () => void;
}

// Camera controller component to track viewport changes
const CameraController: React.FC<{
  onViewportChange: (viewport: Viewport) => void;
  throttleMs?: number;
}> = ({ onViewportChange, throttleMs = 300 }) => {
  const camera = useCamera();
  const lastUpdateRef = useRef<number>(0);
  
  // Track camera changes and report back to parent
  useEffect(() => {
    if (!camera) return;
    
    const handler = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > throttleMs) {
        lastUpdateRef.current = now;
        const state = camera.getState();
        onViewportChange({
          x: state.x,
          y: state.y,
          ratio: state.ratio,
          angle: state.angle
        });
      }
    };
    
    // Subscribe to camera state changes
    camera.addListener('updated', handler);
    return () => {
      camera.removeListener('updated', handler);
    };
  }, [camera, onViewportChange, throttleMs]);
  
  return null;
};

const LivingMap: React.FC<LivingMapProps> = ({
  onNodeClick,
  onMapLoad,
}) => {
  const toast = useToast();
  const apiClient = useApiClient();
  const isMounted = useRef(true);
  const lastDeltaUpdateRef = useRef<number>(0);
  const lastViewportFetchRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiData, setRawApiData] = useState<MapData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [sigmaGraphData, setSigmaGraphData] = useState<{
    nodes: any[];
    edges: any[];
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, ratio: 1, angle: 0 });
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<MapFilters>({
    types: Object.values(MapNodeTypeEnum),
    statuses: ['active', 'planning'],
    depth: 1,
    clusterTeams: true
  });
  
  // Node and edge counts for stats
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});
  
  // Pagination support for large data sets
  const [hasMoreData, setHasMoreData] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 250; // Maximum nodes per page

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
    // Update zoom level for LOD renderer
    setZoomLevel(1 / newViewport.ratio);
    
    // Viewport-based data fetching (if supported by backend)
    const now = Date.now();
    if (now - lastViewportFetchRef.current > 2000) { // Throttle to every 2 seconds
      lastViewportFetchRef.current = now;
      
      // Only fetch new data if the camera has moved significantly
      if (Math.abs(newViewport.ratio - viewport.ratio) > 0.3 ||
          Math.abs(newViewport.x - viewport.x) > 200 ||
          Math.abs(newViewport.y - viewport.y) > 200) {
        fetchMapData(filters, newViewport);
      }
    }
  }, [viewport, filters]);

  // Effect for Processing API Data for Sigma
  useEffect(() => {
    if (!rawApiData || !isMounted.current) return;

    setIsLoading(true);

    try {
      const nodesToProcess = rawApiData.nodes || [];
      const edgesToProcess = rawApiData.edges || [];
      const nodeIdsToRender = new Set(nodesToProcess.map(n => n.id));
      
      // Update node type counts
      const counts: Record<string, number> = {};
      nodesToProcess.forEach(node => {
        counts[node.type] = (counts[node.type] || 0) + 1;
      });
      setNodeCounts(counts);

      const nodes = nodesToProcess.map(node => ({
        id: node.id,
        label: node.label,
        color: nodeStyles[node.type]?.color || '#999',
        size: nodeStyles[node.type]?.baseSize || 10,
        x: node.position?.x ?? Math.random() * 1000, 
        y: node.position?.y ?? Math.random() * 1000,
        entityType: node.type,
        originalApiData: node
      }));

      const edges: any[] = [];
      (edgesToProcess || []).forEach(edge => {
        if (nodeIdsToRender.has(edge.source) && nodeIdsToRender.has(edge.target)) {
          edges.push({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label || undefined,
            color: '#ccc',
            size: 1,
            originalApiData: edge
          });
        }
      });

      // Determine if there might be more data to load
      setHasMoreData(nodesToProcess.length >= PAGE_SIZE);

      // Update or replace the graph data
      if (currentPage > 1) {
        // Append new data to existing graph
        setSigmaGraphData(prevData => {
          if (!prevData) return { nodes, edges };
          
          // Combine existing and new nodes, removing duplicates
          const existingNodeIds = new Set(prevData.nodes.map(n => n.id));
          const newNodes = nodes.filter(node => !existingNodeIds.has(node.id));
          
          // Combine existing and new edges, removing duplicates
          const existingEdgeIds = new Set(prevData.edges.map(e => e.id));
          const newEdges = edges.filter(edge => !existingEdgeIds.has(edge.id));
          
          return {
            nodes: [...prevData.nodes, ...newNodes],
            edges: [...prevData.edges, ...newEdges]
          };
        });
      } else {
        // Replace existing graph with new data
        setSigmaGraphData({ nodes, edges });
      }

      if (isMounted.current && onMapLoad) {
        setTimeout(() => { if(isMounted.current && onMapLoad) onMapLoad(); }, 100);
      }

    } catch (processingError) {
      if (!isMounted.current) return;

      const msg = processingError instanceof Error ? processingError.message : "Unknown graph processing error";
      setError(msg);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [rawApiData, onMapLoad, currentPage]);

  // Data Fetching Logic - Enhanced with filters and pagination
  const fetchMapData = useCallback(async (filterOptions: MapFilters, viewportData?: Viewport, page: number = 1) => {
    if (!isMounted.current || !apiClient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params: Record<string, string> = {
        page: page.toString(),
        limit: PAGE_SIZE.toString()
      };
      
      // Add type filters
      if (filterOptions.types && filterOptions.types.length > 0 && 
          filterOptions.types.length < Object.values(MapNodeTypeEnum).length) {
        params.types = filterOptions.types.join(',');
      }
      
      // Add status filters
      if (filterOptions.statuses && filterOptions.statuses.length > 0) {
        params.statuses = filterOptions.statuses.join(',');
      }
      
      // Add depth parameter
      params.depth = filterOptions.depth.toString();
      
      // Add cluster teams parameter
      params.cluster_teams = filterOptions.clusterTeams.toString();
      
      // Add center node if specified
      if (filterOptions.centerNodeId) {
        params.center_node_id = filterOptions.centerNodeId;
      }
      
      // Add viewport params if available
      if (viewportData) {
        params.view_x = Math.round(viewportData.x).toString();
        params.view_y = Math.round(viewportData.y).toString();
        params.view_ratio = viewportData.ratio.toFixed(2);
      }
      
      const response = await apiClient.get<MapData>('/map/data', { params });
      
      if (!isMounted.current) return;
      
      setCurrentPage(page);
      setRawApiData(response.data);
    } catch (fetchError: unknown) {
      if (!isMounted.current) return;
      
      const message = fetchError instanceof Error ? fetchError.message : 'An unknown error occurred';
      setError(message);
      toast({
        title: 'Error fetching map data',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [apiClient, toast]);

  // Initial Map Load
  useEffect(() => {
    if (!rawApiData) {
      fetchMapData(filters);
    }
  }, [rawApiData, fetchMapData, filters]);
  
  // Load more data when scrolling out or requesting next page
  const loadMoreData = useCallback(() => {
    if (hasMoreData && !isLoading) {
      fetchMapData(filters, viewport, currentPage + 1);
    }
  }, [hasMoreData, isLoading, fetchMapData, filters, viewport, currentPage]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MapFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      // Reset pagination when filters change
      fetchMapData(updated, viewport, 1);
      return updated;
    });
  }, [fetchMapData, viewport]);

  // Delta Update Logic (simplified stub for now)
  const applyDeltaUpdates = useCallback((deltaData: any) => {
    // Placeholder for delta update functionality
    // Will be implemented when needed
  }, []);

  // Delta handler calls the adapted applyDeltaUpdates
  const handleDeltaUpdate = useCallback((deltaData: any) => {
    const now = Date.now();
    if (now - lastDeltaUpdateRef.current < 1000) {
      // Throttle frequent updates
    } else {
      lastDeltaUpdateRef.current = now;
      applyDeltaUpdates(deltaData);
    }
  }, [applyDeltaUpdates]);

  // Connect to delta stream
  useDeltaStream(handleDeltaUpdate);

  // Search Logic - enhanced with node types
  const focusOnNode = useCallback((nodeId: string) => {
    const node = sigmaGraphData?.nodes.find(n => n.id === nodeId);
    if (node && node.x !== undefined && node.y !== undefined) {
      // Focus the camera on this node
      updateFilters({ centerNodeId: nodeId });
    }
    setSearchResults([]);
  }, [sigmaGraphData, updateFilters]);

  // Enhanced search with type filtering
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const matches: SearchResult[] = [];
    sigmaGraphData?.nodes.forEach((node) => {
      if (node.label?.toLowerCase().includes(query)) {
        matches.push({ 
          id: node.id, 
          label: node.label || node.id,
          type: node.entityType
        });
      }
    });
    setSearchResults(matches.slice(0, 8));
  }, [searchQuery, sigmaGraphData]);

  // Filter Panel State
  const { isOpen: isFilterPanelOpen, onToggle: onFilterPanelToggle } = useDisclosure();

  // Render Logic
  if (isLoading && !sigmaGraphData) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Spinner size="xl" /></Box>;
  }
  
  if (error && !sigmaGraphData) {
    return <Box p={5}><Text color="red.500">Error: {error}</Text></Box>;
  }

  return (
    <Box height="100%" width="100%" position="relative">
      <Box height="100%" width="100%" background="#f8f8f8" minH="300px">
        {sigmaGraphData ? (
          <SigmaContainer 
            style={{ width: '100%', height: '100%' }} 
            settings={{ 
              allowInvalidContainer: true,
              // Enable labels only at high zoom levels
              renderLabels: viewport.ratio < 0.6,
              // Limit edge rendering at low zoom levels
              renderEdgeLabels: viewport.ratio < 0.4
            }}
          >
            <CameraController onViewportChange={handleViewportChange} />
            
            <SigmaGraphLoader
              nodes={sigmaGraphData.nodes.map(node => node.originalApiData)}
              edges={sigmaGraphData.edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                type: edge.type
              }))}
              onSigmaNodeClick={(node) => onNodeClick(node?.id || null)}
              onStageClick={() => onNodeClick(null)}
              onNodeHover={() => {}} // We'll implement this when needed
              zoomLevel={zoomLevel}
            />
            
            <ControlsContainer position={"bottom-right"}>
              <LayoutForceAtlas2Control autoRunFor={1000} settings={{
                gravity: 1.5,
                barnesHutOptimize: true,
                linLogMode: true,
                outboundAttractionDistribution: true,
                adjustSizes: true,
              }} />
            </ControlsContainer>
          </SigmaContainer>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            {isLoading ? <Spinner size="xl" /> : <Text>No graph data to display.</Text>}
          </Box>
        )}
      </Box>

      {/* Filter Toggle Button */}
      <IconButton
        aria-label="Toggle Filters"
        icon={<FaFilter />}
        size="sm"
        position="absolute"
        top="15px"
        right="15px"
        zIndex={4}
        onClick={onFilterPanelToggle}
        colorScheme={isFilterPanelOpen ? 'blue' : 'gray'}
        variant={isFilterPanelOpen ? 'solid' : 'outline'}
      />

      {/* Enhanced Filter Panel */}
      {isFilterPanelOpen && (
        <Box
          position="absolute"
          top="55px"
          right="15px"
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="md"
          zIndex={4}
          borderWidth="1px"
          borderColor="gray.200"
          minWidth="250px"
          _dark={{
            bg: '#363636',
            borderColor: 'gray.600',
            color: 'gray.200',
          }}
        >
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Map Filters</Text>
            
            {/* Node Type Filter */}
            <FormControl size="sm">
              <FormLabel fontSize="sm">Node Types</FormLabel>
              {Object.values(MapNodeTypeEnum).map(type => (
                <Box key={type} display="inline-block" mr={2} mb={2}>
                  <Badge 
                    colorScheme={filters.types.includes(type) ? 'blue' : 'gray'} 
                    cursor="pointer"
                    onClick={() => {
                      const newTypes = filters.types.includes(type)
                        ? filters.types.filter(t => t !== type)
                        : [...filters.types, type];
                      updateFilters({ types: newTypes });
                    }}
                    px={2}
                    py={1}
                  >
                    {type} {nodeCounts[type] ? `(${nodeCounts[type]})` : ''}
                  </Badge>
                </Box>
              ))}
            </FormControl>
            
            {/* Status Filter */}
            <FormControl size="sm">
              <FormLabel fontSize="sm">Status Filter</FormLabel>
              {AVAILABLE_STATUSES.map(status => (
                <Box key={status} display="inline-block" mr={2} mb={2}>
                  <Badge 
                    colorScheme={filters.statuses.includes(status) ? 'green' : 'gray'} 
                    cursor="pointer"
                    onClick={() => {
                      const newStatuses = filters.statuses.includes(status)
                        ? filters.statuses.filter(s => s !== status)
                        : [...filters.statuses, status];
                      updateFilters({ statuses: newStatuses });
                    }}
                    px={2}
                    py={1}
                  >
                    {status}
                  </Badge>
                </Box>
              ))}
            </FormControl>
            
            {/* Depth Filter */}
            <FormControl size="sm">
              <FormLabel fontSize="sm">Relationship Depth</FormLabel>
              <Select 
                size="sm" 
                value={filters.depth} 
                onChange={(e) => updateFilters({ depth: parseInt(e.target.value) })}
              >
                <option value={1}>Direct connections (1 level)</option>
                <option value={2}>Extended network (2 levels)</option>
              </Select>
            </FormControl>
            
            {/* Team Clustering */}
            <FormControl size="sm" display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">
                Cluster team members
              </FormLabel>
              <Switch 
                isChecked={filters.clusterTeams} 
                onChange={(e) => updateFilters({ clusterTeams: e.target.checked })}
              />
            </FormControl>
            
            {/* Reset Filter Button */}
            <IconButton
              aria-label="Reset filters"
              icon={<FiRefreshCw />}
              size="sm"
              onClick={() => updateFilters({
                types: Object.values(MapNodeTypeEnum),
                statuses: ['active', 'planning'],
                depth: 1,
                clusterTeams: true,
                centerNodeId: null
              })}
            />
            
            {/* Stats */}
            <Box fontSize="xs" mt={2} pt={2} borderTopWidth="1px" borderColor="gray.200">
              <Text>Showing {sigmaGraphData?.nodes.length || 0} nodes, {sigmaGraphData?.edges.length || 0} connections</Text>
              {hasMoreData && (
                <Text 
                  color="blue.500" 
                  cursor="pointer" 
                  onClick={loadMoreData}
                  _dark={{ color: 'blue.300' }}
                >
                  Load more data...
                </Text>
              )}
            </Box>
          </VStack>
        </Box>
      )}

      {/* Search Bar */}
      <HStack
        position="absolute"
        top="15px"
        left="15px"
        zIndex={4}
        bg="surface.500"
        p={1}
        borderRadius="md"
        shadow="sm"
        borderWidth="1px"
        borderColor="primary.300"
        _dark={{
          bg: '#363636',
          borderColor: 'primary.600',
        }}
      >
        <Input
          size="sm"
          placeholder="Search node..."
          value={searchQuery}
          onChange={(e)=>setSearchQuery(e.target.value)}
          onKeyDown={(e)=>{
            if (e.key === 'Enter' && searchResults.length) {
              focusOnNode(searchResults[0].id);
            }
          }}
          width="160px"
          variant="outline"
          bg="surface.500"
          color="#262626"
          _dark={{
            bg: '#363636',
            color: 'secondary.400',
          }}
        />
        <IconButton
          aria-label="Search"
          icon={<FiSearch />}
          size="sm"
          variant="ghost"
          color="#262626"
          _dark={{
            color: 'secondary.400',
          }}
          onClick={() => {
            if (searchResults.length) {
              focusOnNode(searchResults[0].id);
            }
          }}
        />
      </HStack>

      {/* Search Suggestions Dropdown */}
      {searchResults.length > 0 && (
        <Box
          position="absolute"
          top="50px"
          left="15px"
          zIndex={5}
          bg="surface.500"
          borderWidth="1px"
          borderColor="primary.300"
          borderRadius="md"
          shadow="sm"
          maxHeight="220px"
          overflowY="auto"
          width="220px"
          _dark={{
            bg: '#363636',
            borderColor: 'primary.600',
          }}
        >
          <List spacing={0}>
            {searchResults.map((node) => (
              <ListItem
                key={node.id}
                px={3}
                py={2}
                _hover={{ bg: 'secondary.400' }}
                cursor="pointer"
                color="#262626"
                _dark={{
                  _hover: { bg: '#464646' },
                  color: 'secondary.400',
                }}
                onClick={() => focusOnNode(node.id)}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text>{node.label}</Text>
                {node.type && (
                  <Badge 
                    size="sm" 
                    colorScheme={
                      node.type === MapNodeTypeEnum.USER ? 'green' :
                      node.type === MapNodeTypeEnum.TEAM ? 'blue' : 
                      node.type === MapNodeTypeEnum.PROJECT ? 'purple' : 
                      node.type === MapNodeTypeEnum.GOAL ? 'orange' : 'gray'
                    }
                  >
                    {node.type}
                  </Badge>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Loading Indicator Overlay */}
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(241, 242, 234, 0.7)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={10}
          _dark={{
            bg: "rgba(38, 38, 38, 0.7)"
          }}
        >
          <Spinner size="xl" color="#262626" _dark={{ color: "secondary.400" }} />
        </Box>
      )}
    </Box>
  );
};

export default LivingMap;