import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
    Edge,
    Connection,
    BackgroundVariant,
    NodeTypes,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
// import dagre from 'dagre'; // Remove dagre import
import ELK from 'elkjs/lib/elk.bundled.js'; // Import ELK

import { useAuth } from '../../context/AuthContext';
// import { apiClient } from '../../api/client'; // Remove unused import
import { MapData, MapNode, MapEdge, MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { Box, Spinner, Text, useToast } from '@chakra-ui/react';
import { useApiClient } from '../../hooks/useApiClient'; // Trying corrected path

// Import custom node components
import UserNode from './nodes/UserNode';
import TeamNode from './nodes/TeamNode';
import ProjectNode from './nodes/ProjectNode';
import GoalNode from './nodes/GoalNode'; // Import GoalNode
// import BriefingPanel from '../panels/BriefingPanel'; // Removed - Handled by Layout
// Import GoalNode etc. later

// Props for the LivingMap component
interface LivingMapProps {
    onNodeClick: (node: MapNode | null) => void; // Use MapNode directly
    // Add a prop to control the layout algorithm if desired later
    // layoutAlgorithm?: string;
}

// Helper to transform backend nodes/edges to React Flow format
const transformApiNode = (apiNode: MapNode): Node => {
    let nodeType = 'default'; // Default type
    switch (apiNode.type) {
        case MapNodeTypeEnum.USER:
            nodeType = 'userNode'; // Match the key in nodeTypes map
            break;
        case MapNodeTypeEnum.TEAM:
            nodeType = 'teamNode';
            break;
        case MapNodeTypeEnum.PROJECT:
            nodeType = 'projectNode';
            break;
        case MapNodeTypeEnum.GOAL: // Add case for GOAL
            nodeType = 'goalNode';
            break;
        // Add cases for KNOWLEDGE_ASSET etc. later
        // default: console.warn("Unknown node type:", apiNode.type); // Optional warning
    }

    return {
        id: apiNode.id,
        type: nodeType, 
        position: apiNode.position || { x: Math.random() * 400, y: Math.random() * 400 }, 
        data: { 
            label: apiNode.label, 
            title: apiNode.label, // Keep title for tooltip
            ...apiNode.data, 
            originalApiNode: apiNode 
        }, 
    };
};

const transformApiEdge = (apiEdge: MapEdge): Edge => {
    const edgeStyle: React.CSSProperties = {};
    const isAnimated = false; // Use const for now

    // Basic styling based on type
    switch (apiEdge.type) {
        case MapEdgeTypeEnum.REPORTS_TO:
            edgeStyle.strokeDasharray = '5, 5'; // Dashed line
            edgeStyle.stroke = '#888888'; // Gray color
            break;
        case MapEdgeTypeEnum.MEMBER_OF:
            edgeStyle.stroke = '#cccccc'; // Lighter gray
            edgeStyle.strokeWidth = 1;
            break;
        case MapEdgeTypeEnum.LEADS:
            edgeStyle.stroke = '#4A5568'; // Darker gray/blue
            edgeStyle.strokeWidth = 2;
            break;
        case MapEdgeTypeEnum.OWNS:
            edgeStyle.stroke = '#805AD5'; // Purple (matching project node base)
            edgeStyle.strokeWidth = 1.5;
            break;
        case MapEdgeTypeEnum.ALIGNED_TO:
            edgeStyle.stroke = '#38A169'; // Green (like a goal/success color)
            edgeStyle.strokeWidth = 1.5;
            // isAnimated = true; // Re-enable later by changing const to let above
            break;
        // Add other types later
        default:
            edgeStyle.stroke = '#b1b1b7'; // Default React Flow color
            break;
    }

    return {
        id: apiEdge.id,
        source: apiEdge.source,
        target: apiEdge.target,
        label: apiEdge.label,
        type: 'default', // Still using default edge renderer for now
        style: edgeStyle, // Pass calculated style
        animated: isAnimated, // Pass animated flag
        data: apiEdge.data,
    };
};

// --- ELK Setup ---
const elk = new ELK();

// Default ELK options - start with layered, similar to dagre TB
// Experiment with 'stress', 'force', 'mrtree', 'radial'
const elkOptions = {
  'elk.algorithm': 'force', // Start with 'layered'
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  // Add other algorithm-specific options here if needed
  // e.g., for force: 'elk.force.iterations': '1000'
};

const nodeWidth = 172; // Keep using the defined dimensions
const nodeHeight = 50; // Keep using the defined dimensions

// Function to calculate layout using ELKjs
const getLayoutedElements = async (nodes: Node[], edges: Edge[], options = elkOptions): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    // Create the graph structure expected by ELK
    const elkGraph = {
        id: 'root',
        layoutOptions: options,
        children: nodes.map(node => ({
            id: node.id,
            width: node.width || nodeWidth,
            height: node.height || nodeHeight,
            // Store original data needed for rendering React Flow nodes
            _data: { ...node.data, type: node.type } // Ensure type is carried over
        })),
        edges: edges.map(edge => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
             _data: { ...edge.data, type: edge.type } // Ensure type is carried over
        }))
    };

    try {
        const layoutedGraph = await elk.layout(elkGraph);
        console.log("[LivingMap] ELK layout result:", layoutedGraph); // Log ELK output

        const layoutedNodes = layoutedGraph.children?.map((node: import('elkjs/lib/main').ElkNode) => ({
            id: node.id,
            // type: node._data.type, // Get type from stored _data
             // Use the node type determined by transformApiNode
             // which is stored in the input 'nodes' array
            type: nodes.find(n => n.id === node.id)?.type || 'default',
            position: { x: node.x ?? 0, y: node.y ?? 0 },
             // Restore original data, ensuring originalApiNode is preserved
            data: nodes.find(n => n.id === node.id)?.data || {},
            // Set target/source handles based on layout direction if needed
            // For layered TB, default Top/Bottom is often fine
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            width: node.width, // Carry over width/height used by ELK
            height: node.height,
        })) ?? [];

         // We don't typically need to modify edges much after ELK layout
         // unless dealing with edge routing points (sections), which is more advanced.
         // For now, just return the original edges passed in.
        const layoutedEdges = edges;

        return { nodes: layoutedNodes, edges: layoutedEdges };

    } catch (error) {
        console.error('ELK layout failed:', error);
        // Fallback: return nodes without positions or with random positions
        // Returning original nodes for now, React Flow will handle missing positions
        return { nodes: nodes.map(n => ({ ...n, position: { x: Math.random() * 400, y: Math.random() * 400 } })), edges };
    }
};

// Pass props to the component
const LivingMap: React.FC<LivingMapProps> = ({ onNodeClick /*, layoutAlgorithm = 'layered' */ }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // State for selection
    // const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null); // Keep commented out
    const { token } = useAuth();
    const toast = useToast();
    const apiClient = useApiClient();

    // Define the custom node types and memoize them
    const nodeTypes: NodeTypes = useMemo(() => ({
        userNode: UserNode,
        teamNode: TeamNode,
        projectNode: ProjectNode,
        goalNode: GoalNode, // Register GoalNode
        // Add assetNode etc. here later when implemented
    }), []);

    // Ref to store the raw API data to avoid re-fetching layout unless data changes
    const rawMapDataRef = useRef<MapData | null>(null);

    useEffect(() => {
        const fetchAndLayoutData = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);

            try {
                // Fetch data only if we don't have it or maybe add refresh logic later
                if (!rawMapDataRef.current) {
                    console.log("[LivingMap] Fetching data...");
                    const response = await apiClient.get<MapData>('/map/data');
                    console.log("[LivingMap] API response received:", response);
                    rawMapDataRef.current = response.data;
                    console.log("[LivingMap] Map data stored:", rawMapDataRef.current);

                    if (!rawMapDataRef.current || !rawMapDataRef.current.nodes || !rawMapDataRef.current.edges) {
                        console.error("[LivingMap] Invalid map data structure:", rawMapDataRef.current);
                        throw new Error("Received invalid map data structure from API.");
                    }
                }

                const mapData = rawMapDataRef.current!;
                // Use the transformer without selectedNodeId
                const initialNodes = mapData.nodes.map(transformApiNode);
                const initialEdges = mapData.edges.map(transformApiEdge);
                console.log("[LivingMap] Initial nodes/edges (pre-layout):"); 

                // Calculate layout using ELK
                const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
                    initialNodes,
                    initialEdges
                );
                console.log("[LivingMap] Layouted nodes/edges:"); 

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);

            } catch (err: unknown) {
                 console.error("[LivingMap] Error during fetch/layout:", err);
                 // Keep existing error handling
                 let errorMessage = "Failed to load map data.";
                 if (err instanceof Error) {
                     const errorResponse = err as Error & { response?: { data?: { detail?: string } } };
                     const detail = errorResponse?.response?.data?.detail;
                    errorMessage += ` ${detail || err.message}`;
                } else {
                     errorMessage += " An unknown error occurred.";
                }
                setError(errorMessage);
                toast({ title: "Error loading map", description: errorMessage, status: "error", duration: 9000, isClosable: true });
                // Clear potentially bad data
                rawMapDataRef.current = null;
                setNodes([]);
                setEdges([]);
            } finally {
                console.log("[LivingMap] Fetch/layout attempt finished. Setting loading false.");
                setIsLoading(false);
            }
        };

        fetchAndLayoutData();
    // Ensure dependency array only includes things that necessitate re-fetching/re-layout
    }, [token, setNodes, setEdges, toast, apiClient]); // Keep selectedNodeId OUT

    // Effect to apply selection style WHEN selectedNodeId changes
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                // Add or remove the 'node-selected' class based on selection
                const isSelected = node.id === selectedNodeId;
                // Preserve existing classes if any, add/remove selected class
                const baseClasses = (node.className || '').split(' ').filter(cls => cls !== 'node-selected');
                if (isSelected) {
                    baseClasses.push('node-selected');
                }
                return {
                    ...node,
                    className: baseClasses.join(' ').trim() || undefined, // Set undefined if empty
                };
            })
        );
    }, [selectedNodeId, setNodes]); // Depend only on selection and setter

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // --- Interaction Handlers ---
    const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
        console.log("Hover Enter:", node.id); // Add console log
        // setHoveredNodeId(node.id); // Commented out for now
        // Update node style directly? - More complex, try CSS first
    }, []);

    const handleNodeMouseLeave = useCallback((_: React.MouseEvent, node: Node) => {
        console.log("Hover Leave:", node.id); // Add console log
        // setHoveredNodeId(null); // Commented out for now
    }, []);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        console.log("Click Node:", node.id); // Log click
        const originalApiNode = node.data?.originalApiNode as MapNode | undefined;
        setSelectedNodeId(node.id); // Set selected state
        onNodeClick(originalApiNode || null); // Pass data up to parent
    }, [onNodeClick]); // Removed setSelectedNodeId from deps for now, managed outside layout

    const handlePaneClick = useCallback(() => {
        console.log("Click Pane"); // Log click
        setSelectedNodeId(null); // Clear selection
        onNodeClick(null); // Notify parent
    }, [onNodeClick]); // Removed setSelectedNodeId from deps

    if (isLoading && nodes.length === 0) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="100%"><Spinner size="xl" /></Box>;
    }

    if (error && nodes.length === 0) {
        return <Box p={5}><Text color="red.500">Error: {error}</Text></Box>;
    }

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                attributionPosition="bottom-left"
                nodeTypes={nodeTypes}
                // Add hover handlers
                onNodeMouseEnter={handleNodeMouseEnter}
                onNodeMouseLeave={handleNodeMouseLeave}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
            >
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};

// Wrapper needs to accept and pass down the props
const LivingMapWrapper: React.FC<LivingMapProps> = (props) => {
    return (
        <ReactFlowProvider>
            <LivingMap {...props} />
        </ReactFlowProvider>
    );
};

export default LivingMapWrapper; 