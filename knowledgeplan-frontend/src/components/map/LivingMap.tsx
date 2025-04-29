import React, { useState, useEffect, useCallback, useRef } from 'react';
// Remove react-force-graph import
// import { ForceGraph2D } from 'react-force-graph';

// React-Sigma (v1 Wrapper) Imports
// import { Sigma, RelativeSize, RandomizeNodePositions, SigmaEnableWebGL, ForceAtlas2 } from "react-sigma";

// Keep necessary types and hooks
import { MapData, MapNodeTypeEnum } from '../../types/map';
import { Box, Spinner, Text, useToast, IconButton, useDisclosure, Input, HStack, List, ListItem } from '@chakra-ui/react';
import { useApiClient } from '../../hooks/useApiClient';
import { FaFilter } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { useDeltaStream } from '../../hooks/useDeltaStream';
// import { throttle } from 'lodash';

// Custom node components are no longer needed for Sigma rendering directly
// import UserNode from './nodes/UserNode';
// ... other node imports removed ...

// Props remain the same for now
interface LivingMapProps {
    onNodeClick: (nodeId: string | null) => void;
    isClustered?: boolean; // Will need to be applied differently
    projectOverlaps: Record<string, string[]>;
    onMapLoad?: () => void;
}

// Node/Edge transformation helpers are not needed for Sigma's internal structure

// Constants for Filters remain
// const ALL_NODE_TYPES = Object.values(MapNodeTypeEnum); // Commented out
// const COMMON_STATUSES = ["Active", "Planning", "On Track", "Paused", "Blocked", "Completed", "At Risk", "Delayed"]; // Commented out

// --- Delta types remain the same ---
// Fix the any types in the DeltaData interface
interface DeltaData {
  nodes?: NodeData[];
  edges?: EdgeData[];
  addNodes?: NodeData[];
  updateNodes?: NodeData[];
  removeNodeIds?: string[];
  addEdges?: EdgeData[];
  updateEdges?: EdgeData[];
  removeEdgeIds?: string[];
  // Replace generic indexer with specific optional properties
  version?: number;
  timestamp?: string;
}

// Add these NodeData and EdgeData interfaces
interface NodeData {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label: string;
    entityType: string;
    entityId: string;
    color?: string;
    icon?: string;
    // Replace generic indexer with specific optional properties
    isExpanded?: boolean;
    isVisible?: boolean;
    metadata?: Record<string, unknown>;
  };
  // Replace generic indexer with specific optional properties
  style?: React.CSSProperties;
  className?: string;
  selected?: boolean;
  hidden?: boolean;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    label?: string;
    relation?: string;
    // Replace generic indexer with specific optional properties
    metadata?: Record<string, unknown>;
  };
  // Replace generic indexer with specific optional properties
  style?: React.CSSProperties;
  className?: string;
  animated?: boolean;
  hidden?: boolean;
}

// Viewport calculation remains relevant but unused for now
// interface ViewportBounds { /* ... */ }
// const calculateViewportBounds = (/* ... */): ViewportBounds | null => { /* ... */ }; // Commented out

// Type colors are still needed for Sigma nodes
const typeColors = {
    USER: '#3182bd',
    TEAM: '#6baed6',
    PROJECT: '#fd8d3c',
    GOAL: '#74c476',
    TEAM_CLUSTER: '#9e9ac8' // Keep cluster color
};

// Define type for search results
interface SearchResult {
    id: string;
    label: string;
}

// Define minimal types for internal usage before creating graphology graph
interface SigmaNodeTemp {
    id: string;
    label?: string;
    color?: string;
    size?: number;
    x?: number;
    y?: number;
    originalApiData?: unknown;
}
interface SigmaEdgeTemp {
    id: string;
    source: string;
    target: string;
    label?: string | null;
    color?: string;
    size?: number;
    originalApiData?: unknown;
}
interface SigmaGraphTemp {
    nodes: SigmaNodeTemp[];
    edges: SigmaEdgeTemp[];
}

const LivingMap: React.FC<LivingMapProps> = ({
    onNodeClick,
    onMapLoad,
}) => {
    const toast = useToast();
    const apiClient = useApiClient();
    const isMounted = useRef(true);
    const lastDeltaUpdateRef = useRef<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawApiData, setRawApiData] = useState<MapData | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [sigmaGraphData, setSigmaGraphData] = useState<SigmaGraphTemp | null>(null);

    // Cleanup effect
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- Effect for Processing API Data for react-sigma (v1) ---
    useEffect(() => {
        if (!rawApiData || !isMounted.current) return;

        console.log("[LivingMap] Processing raw API data for react-sigma v1...");
        setIsLoading(true);

        try {
            // --- TODO: Filtering/Clustering ---
            const nodesToProcess = rawApiData.nodes || [];
            const edgesToProcess = rawApiData.edges || [];
            const nodeIdsToRender = new Set(nodesToProcess.map(n => n.id));
            // -----------------------------------

            const nodes: SigmaNodeTemp[] = nodesToProcess.map(node => ({
                id: node.id,
                label: node.label,
                color: typeColors[node.type] || '#999',
                size: node.type === MapNodeTypeEnum.TEAM ? 15 : 10,
                x: Math.random() * 1000, // ADD INITIAL X
                y: Math.random() * 1000, // ADD INITIAL Y
                originalApiData: node
            }));

            const edges: SigmaEdgeTemp[] = [];
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

            console.log(`[LivingMap] Setting data for react-sigma v1 (${nodes.length} nodes, ${edges.length} edges).`);
            setSigmaGraphData({ nodes, edges });

            if (isMounted.current && onMapLoad) {
                 setTimeout(() => { if(isMounted.current && onMapLoad) onMapLoad(); }, 100);
            }

        } catch (processingError) {
            console.error("[LivingMap] Error processing graph data:", processingError);
            if (isMounted.current) setError(processingError instanceof Error ? processingError.message : "Unknown graph processing error");
        } finally {
            if (isMounted.current) setIsLoading(false);
        }

    }, [rawApiData, onMapLoad]);

    // --- Data Fetching Logic ---
    const fetchInitialMapData = useCallback(async () => {
        if (!isMounted.current || !apiClient) return;
        console.log("[LivingMap] Fetching initial map data...");
        setIsLoading(true);
        setError(null);
        try {
            // For now, fetch all data initially - implement viewport loading later if needed
            const response = await apiClient.get<MapData>(`/map/data`);
            if (!isMounted.current) return;
            console.log("[LivingMap] Initial data received:", response.data);
            setRawApiData(response.data);
        } catch (fetchError: unknown) {
            console.error('[LivingMap] Error fetching initial map data:', fetchError);
             if (isMounted.current) {
                const message = fetchError instanceof Error ? fetchError.message : 'An unknown error occurred';
                setError(message);
                toast({
                    title: 'Error fetching map data',
                    description: message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
             }
        } finally {
            // Loading state is handled by the processing effect
            // setIsLoading(false);
        }
    }, [apiClient, toast]);

    // --- useEffect: Initial Map Load ---
    useEffect(() => {
        if (!rawApiData) {
            fetchInitialMapData();
        }
    }, [rawApiData, fetchInitialMapData]);

    // --- Delta Update Logic (Needs adaptation for react-force-graph) ---
    const applyDeltaUpdates = useCallback((/* deltaData: DeltaData - Comment out */) => {
        console.warn("[LivingMap] Delta update logic needs react-force-graph adaptation!");
    }, []);

    // Delta handler remains largely the same, calls the adapted applyDeltaUpdates
    const handleDeltaUpdate = useCallback((deltaData: DeltaData) => {
        const now = Date.now(); // Define now
        if (now - lastDeltaUpdateRef.current < 1000) {
            // ... (batching logic needs pendingDeltaUpdatesRef)
            console.warn("Delta batching skipped - pendingDeltaUpdatesRef commented out");
        } else {
             lastDeltaUpdateRef.current = now; // Define now
             applyDeltaUpdates(deltaData);
        }
    }, [applyDeltaUpdates]);

    useDeltaStream(handleDeltaUpdate);

    // --- Search Logic ---
    const focusOnNode = useCallback((nodeId: string) => {
        const node = sigmaGraphData?.nodes.find(n => n.id === nodeId);
        if (node && node.x !== undefined && node.y !== undefined) {
            // Remove expect-error comments if errors are gone
            // sigmaGraphData?.nodes.forEach((n) => {
            //     if (n.id === nodeId) {
            //         n.x = node.x;
            //         n.y = node.y;
            //     }
            // });
        }
        setSearchResults([]);
    }, [sigmaGraphData]);

    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const matches: SearchResult[] = [];
        sigmaGraphData?.nodes.forEach((node) => {
            if (node.label?.toLowerCase().includes(query)) {
                matches.push({ id: node.id, label: node.label || node.id });
            }
        });
        setSearchResults(matches.slice(0, 8));
    }, [searchQuery, sigmaGraphData]); // Depend on sigmaGraphData

    // ---------------------------------------------------------------------------
    // Child component to load graphology graph into Sigma v5 and register events
    // ---------------------------------------------------------------------------

    interface SigmaLoaderProps {
        graphData: SigmaGraphTemp;
    }

    const SigmaLoader: React.FC<SigmaLoaderProps & { onSigmaNodeClick: (id: string | null) => void }> = ({ graphData, onSigmaNodeClick }) => {
        const loadGraph = useLoadGraph();
        const registerEvents = useRegisterEvents();

        // Load graph when data changes
        useEffect(() => {
            if (!graphData) return;
            const graph = new Graph();
            graphData.nodes.forEach((n) => {
                graph.addNode(n.id, {
                    label: n.label,
                    color: n.color,
                    size: n.size ?? 10,
                    x: n.x ?? Math.random(),
                    y: n.y ?? Math.random(),
                });
            });
            graphData.edges.forEach((e) => {
                graph.addEdgeWithKey(e.id, e.source, e.target, { color: e.color ?? '#ccc', size: e.size ?? 1 });
            });
            loadGraph(graph);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [graphData, loadGraph]);

        // Register click events
        useEffect(() => {
            const handlers = registerEvents({
                clickNode: ({ node }) => onSigmaNodeClick(node as string),
                clickStage: () => onSigmaNodeClick(null),
            });
            return () => {
                // cleanup events
                handlers();
            };
        }, [onSigmaNodeClick, registerEvents]);

        return null;
    };

    // --- Filter Panel State ---
    const { isOpen: isFilterPanelOpen, onToggle: onFilterPanelToggle } = useDisclosure();

    // --- Render Logic ---
    if (isLoading && sigmaGraphData?.nodes.length === 0) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Spinner size="xl" /></Box>;
    }
    if (error) {
        return <Box p={5}><Text color="red.500">Error: {error}</Text></Box>;
    }

    return (
        <Box height="100%" width="100%" position="relative">
            <Box height="100%" width="100%" background="#f8f8f8" minH="300px">
                 {sigmaGraphData ? (
                    <SigmaContainer style={{ width: '100%', height: '100%' }} settings={{ allowInvalidContainer: true }}>
                        <SigmaLoader graphData={sigmaGraphData} onSigmaNodeClick={(id)=>onNodeClick(id)} />
                        <ControlsContainer position={"bottom-right"}>
                            <LayoutForceAtlas2Control autoRunFor={2000} />
                        </ControlsContainer>
                    </SigmaContainer>
                ) : (
                     <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                         {isLoading ? <Spinner size="xl" /> : <Text>No graph data to display.</Text>}
                     </Box>
                 )}
            </Box>

            {/* Keep Overlays */}
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

            {/* Filter Panel (Logic needs reimplementing) */}
            {isFilterPanelOpen && (
                 <Box
                    position="absolute"
                    top="55px" // Adjust position
                    right="15px"
                    bg="white"
                    p={4}
                    borderRadius="md"
                    boxShadow="md"
                    zIndex={4}
                    borderWidth="1px"
                    borderColor="gray.200"
                    minWidth="220px"
                 >
                    {/* TODO: Reimplement filter logic based on graphology/sigma */}
                    <Text fontWeight="bold" mb={3}>Filters (WIP)</Text>
                    <Text fontSize="sm">Node Type / Status filters need reimplementation.</Text>
                 </Box>
            )}

            {/* Search Bar */}
            <HStack
                position="absolute"
                top="15px"
                left="15px" // Moved to left
                zIndex={4}
                bg="surface.500" // White
                p={1}
                borderRadius="md"
                shadow="sm"
                borderWidth="1px"
                borderColor="primary.300" // Light mint green
                _dark={{
                    bg: '#363636', // Lighter button color
                    borderColor: 'primary.600', // Sage green
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
                    bg="surface.500" // White
                    color="#262626" // Button color - dark gray/almost black
                    _dark={{
                        bg: '#363636', // Lighter button color
                        color: 'secondary.400', // Off-white/cream
                    }}
                />
                <IconButton
                    aria-label="Search"
                    icon={<FiSearch />}
                    size="sm"
                    variant="ghost"
                    color="#262626" // Button color - dark gray/almost black
                    _dark={{
                        color: 'secondary.400', // Off-white/cream
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
                    left="15px" // Moved to left
                    zIndex={5}
                    bg="surface.500" // White
                    borderWidth="1px"
                    borderColor="primary.300" // Light mint green
                    borderRadius="md"
                    shadow="sm"
                    maxHeight="220px"
                    overflowY="auto"
                    width="220px"
                    _dark={{
                        bg: '#363636', // Lighter button color
                        borderColor: 'primary.600', // Sage green
                    }}
                >
                    <List spacing={0}>
                        {searchResults.map((node) => (
                            <ListItem
                                key={node.id}
                                px={3}
                                py={2}
                                _hover={{ bg: 'secondary.400' }} // Off-white/cream
                                cursor="pointer"
                                color="#262626" // Button color - dark gray/almost black
                                _dark={{
                                    _hover: { bg: '#464646' }, // Even lighter button color
                                    color: 'secondary.400', // Off-white/cream
                                }}
                                onClick={() => focusOnNode(node.id)}
                            >
                                {node.label}
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
                    bg="rgba(241, 242, 234, 0.7)" // Off-white/cream with transparency
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    zIndex={10} // Ensure it's above the map container
                    _dark={{
                        bg: "rgba(38, 38, 38, 0.7)" // Button color with transparency
                    }}
                 >
                    <Spinner size="xl" color="#262626" _dark={{ color: "secondary.400" }} />
                 </Box>
            )}
        </Box>
    );
};

// Remove ReactFlowProvider wrapper
// const LivingMapWrapper: React.FC<LivingMapProps> = (props) => {
//     return (
//         <ReactFlowProvider>
//             <LivingMap {...props} />
//         </ReactFlowProvider>
//     );
// };

export default LivingMap; // Export the component directly