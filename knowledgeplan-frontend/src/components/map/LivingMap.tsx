import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import dagre from 'dagre';

import { useAuth } from '../../context/AuthContext';
// import { apiClient } from '../../api/client'; // Remove unused import
import { MapData, MapNode, MapEdge, MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';
import { Box, Spinner, Text, useToast } from '@chakra-ui/react';
import { useApiClient } from '../../hooks/useApiClient'; // Trying corrected path

// Import custom node components
import UserNode from './nodes/UserNode';
import TeamNode from './nodes/TeamNode';
import ProjectNode from './nodes/ProjectNode';
// import BriefingPanel from '../panels/BriefingPanel'; // Removed - Handled by Layout
// Import GoalNode etc. later

// Props for the LivingMap component
interface LivingMapProps {
    onNodeClick: (node: MapNode | null) => void; // Use MapNode directly
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
        // Add cases for GOAL, KNOWLEDGE_ASSET etc. later
        // default: console.warn("Unknown node type:", apiNode.type); // Optional warning
    }

    return {
        id: apiNode.id,
        type: nodeType, // Set the determined type
        position: apiNode.position || { x: Math.random() * 400, y: Math.random() * 400 },
        data: { label: apiNode.label, ...apiNode.data, originalApiNode: apiNode }, // Store original node data
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

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172; // Example width, adjust as needed
const nodeHeight = 50; // Example height, adjust as needed

// Function to calculate layout using Dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        // Use dimensions from node object if available, otherwise use defaults
        const width = node.width || nodeWidth;
        const height = node.height || nodeHeight;
        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // Adjust handle positions back for TB layout
        node.targetPosition = Position.Top;
        node.sourcePosition = Position.Bottom;

        // Center the node position based on its dimensions
        const width = node.width || nodeWidth;
        const height = node.height || nodeHeight;
        node.position = {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
        };
    });

    return { nodes, edges };
};

// Pass props to the component
const LivingMap: React.FC<LivingMapProps> = ({ onNodeClick }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const toast = useToast();
    const apiClient = useApiClient();

    // Define the custom node types and memoize them
    const nodeTypes: NodeTypes = useMemo(() => ({
        userNode: UserNode,
        teamNode: TeamNode,
        projectNode: ProjectNode,
        // Add goalNode etc. here later when implemented
    }), []);

    useEffect(() => {
        const fetchMapData = async () => {
            console.log("[LivingMap] useEffect triggered. Token:", token);
            if (!token) {
                console.log("[LivingMap] No token found, skipping fetch.");
                setIsLoading(false);
                return;
            }
            console.log("[LivingMap] Setting loading true and fetching data...");
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get<MapData>('/map/data');
                console.log("[LivingMap] API response received:", response);
                const mapData: MapData = response.data;
                console.log("[LivingMap] Map data extracted:", mapData);

                if (!mapData || !mapData.nodes || !mapData.edges) {
                    console.error("[LivingMap] Invalid map data structure:", mapData);
                    throw new Error("Received invalid map data structure from API.");
                }

                const initialNodes = mapData.nodes.map(transformApiNode);
                const initialEdges = mapData.edges.map(transformApiEdge);
                console.log("[LivingMap] Initial nodes/edges:", initialNodes, initialEdges);
                
                // Calculate layout
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    initialNodes,
                    initialEdges
                );
                console.log("[LivingMap] Layouted nodes/edges:", layoutedNodes, layoutedEdges);

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (err: unknown) {
                console.error("[LivingMap] Error fetching map data:", err);
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
            } finally {
                console.log("[LivingMap] Fetch attempt finished. Setting loading false.");
                setIsLoading(false);
            }
        };

        fetchMapData();
    }, [token, setNodes, setEdges, toast, apiClient]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // --- Interaction Handlers ---
    // Removed unused handlers for hover state
    // const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    //     setHoveredNodeId(node.id);
    // }, []);
    // const handleNodeMouseLeave = useCallback(() => {
    //     setHoveredNodeId(null);
    // }, []);

    // Updated to call the prop with the original API node data
    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const originalApiNode = node.data?.originalApiNode as MapNode | undefined;
        onNodeClick(originalApiNode || null); // Pass the original backend node structure
    }, [onNodeClick]);

    // Updated to call the prop with null
    const handlePaneClick = useCallback(() => {
        onNodeClick(null);
    }, [onNodeClick]);

    // TODO: Implement custom node types (FE-TASK-041)
    // TODO: Implement edge styling (FE-TASK-042)
    // TODO: Implement layout logic (FE-TASK-043)

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
                // onNodeMouseEnter={handleNodeMouseEnter} // Removed prop
                // onNodeMouseLeave={handleNodeMouseLeave} // Removed prop
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