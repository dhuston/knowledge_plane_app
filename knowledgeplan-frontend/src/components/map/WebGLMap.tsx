import React, { useEffect, useState, useCallback, useRef } from 'react';

// Sigma v2 React bindings
import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  ControlsContainer,
  useSigma,
  FullScreenControl,
  useSetSettings,
} from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import forceAtlas2 from 'graphology-layout-forceatlas2';

import Graph from 'graphology';
// Sigma types
import type { MouseCoords } from 'sigma/types';

import { MapData, MapNode, MapNodeTypeEnum } from '../../types/map';
import { useApiClient } from '../../hooks/useApiClient';
import { Box, Spinner, Text, useToast } from '@chakra-ui/react';

interface WebGLMapProps {
  onNodeClick: (node: MapNode | null) => void;
  onLoad?: () => void;
}

// Provide colors per node type (partial so we don't have to list every type)
const typeColor: Partial<Record<MapNodeTypeEnum, string>> = {
  [MapNodeTypeEnum.USER]: '#3182bd',
  [MapNodeTypeEnum.TEAM]: '#6baed6',
  [MapNodeTypeEnum.PROJECT]: '#fd8d3c',
  [MapNodeTypeEnum.GOAL]: '#74c476',
};

// --- Helper child component --------------------------------------------------

interface SigmaGraphLoaderProps {
  nodes: MapNode[];
  edges: { source: string; target: string }[];
  onSigmaNodeClick: (node: MapNode) => void;
}

const SigmaGraphLoader: React.FC<SigmaGraphLoaderProps> = ({ nodes, edges, onSigmaNodeClick }) => {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const setSettings = useSetSettings();
  const nodeTypeMapRef = useRef<Map<string, MapNodeTypeEnum>>(new Map());

  // Maps for collapsible logic
  const childrenMap = useRef<Map<string, Set<string>>>(new Map());
  const collapsedTeams = useRef<Set<string>>(new Set());

  // Load graph once
  useEffect(() => {
    const graph = new Graph();

    // helper to reference node type
    const nodeTypeMap = nodeTypeMapRef.current;

    nodes.forEach((n) => {
      nodeTypeMap.set(n.id, n.type);
      if (!graph.hasNode(n.id)) {
        graph.addNode(n.id, {
          label: n.label,
          size: 10,
          color: typeColor[n.type] || '#999',
          entityType: n.type,
          x: Math.random(),
          y: Math.random(),
        });
        // default collapse for teams
        if (n.type === MapNodeTypeEnum.TEAM) {
          collapsedTeams.current.add(n.id);
        }
      }
    });

    edges.forEach((e, idx) => {
      const key = `e${idx}`;
      if (!graph.hasEdge(key)) {
        graph.addEdgeWithKey(key, e.source, e.target, { color: '#ccc', size: 1 });
      }

      // Build children map: if one end is TEAM and other is not TEAM, record
      const sourceType = nodeTypeMap.get(e.source);
      const targetType = nodeTypeMap.get(e.target);
      if (sourceType === MapNodeTypeEnum.TEAM && targetType !== MapNodeTypeEnum.TEAM) {
        if (!childrenMap.current.has(e.source)) childrenMap.current.set(e.source, new Set());
        childrenMap.current.get(e.source)!.add(e.target);
      } else if (targetType === MapNodeTypeEnum.TEAM && sourceType !== MapNodeTypeEnum.TEAM) {
        if (!childrenMap.current.has(e.target)) childrenMap.current.set(e.target, new Set());
        childrenMap.current.get(e.target)!.add(e.source);
      }
    });

    // Initially hide children of collapsed teams
    collapsedTeams.current.forEach((teamId) => {
      childrenMap.current.get(teamId)?.forEach((childId) => {
        if (graph.hasNode(childId)) graph.setNodeAttribute(childId, 'hidden', true);
      });
    });

    // Configure edge visibility (hide only if both ends hidden)
    setSettings({
      edgeReducer: (edge, attr) => {
        const [s, t] = graph.extremities(edge);
        const hidden = graph.getNodeAttribute(s, 'hidden') && graph.getNodeAttribute(t, 'hidden');
        return { ...attr, hidden };
      },
    });

    // Compute a ForceAtlas2 layout synchronously (e.g., 100 iterations)
    forceAtlas2.assign(graph, { iterations: 100, settings: { slowDown: 10 } });

    // Now load the positioned graph into Sigma
    loadGraph(graph);
    return; // no cleanup needed for synchronous layout
  }, [edges, loadGraph, nodes, setSettings]);

  // Register node click event
  useEffect(() => {
    // drag helpers
    let dragging = false as boolean;
    let draggedNode: string | null = null;

    registerEvents({
      clickNode: ({ node }) => {
        const nodeAttrs = sigma.getGraph().getNodeAttributes(node) as { entityType?: MapNodeTypeEnum; label?: string };
        const type = nodeAttrs.entityType ?? nodeTypeMapRef.current.get(node);
        // If TEAM node -> toggle collapse
        if (type === MapNodeTypeEnum.TEAM) {
          const isCollapsed = collapsedTeams.current.has(node as string);
          const children = childrenMap.current.get(node as string);
          if (children) {
            children.forEach((childId) => {
              sigma.getGraph().setNodeAttribute(childId, 'hidden', !isCollapsed);
            });
          }
          if (isCollapsed) collapsedTeams.current.delete(node as string);
          else collapsedTeams.current.add(node as string);
          sigma.refresh();
        } else {
          // regular behaviour
          const labelAttr = nodeAttrs.label;
          const mapNode: MapNode = {
            id: node,
            label: labelAttr ?? (node as string),
            type: nodes.find((n) => n.id === node)?.type ?? MapNodeTypeEnum.USER,
            data: {},
          };
          onSigmaNodeClick(mapNode);
        }
      },

      downNode: ({ node }) => {
        dragging = true;
        draggedNode = node as string;
      },

      mousemove: ({ x, y }: MouseCoords) => {
        if (dragging && draggedNode) {
          const pos = sigma.viewportToGraph({ x, y });
          sigma.getGraph().setNodeAttribute(draggedNode, 'x', pos.x);
          sigma.getGraph().setNodeAttribute(draggedNode, 'y', pos.y);
          sigma.refresh();
        }
      },

      mouseup: () => {
        dragging = false;
        draggedNode = null;
      },
    });
  }, [nodes, onSigmaNodeClick, registerEvents, sigma]);

  return null; // this component does not render anything
};

// ----------------------------------------------------------------------------

const WebGLMap: React.FC<WebGLMapProps> = ({ onNodeClick, onLoad }) => {
  const apiClient = useApiClient();
  const toast = useToast();

  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial graph
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get<MapData>('/map/data');

        if (!isMounted) return;

        setNodes(res.data.nodes);
        setEdges(res.data.edges.map((e) => ({ source: e.source, target: e.target })));

        // Notify parent
        onLoad?.();
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error('Error loading graph', err);
        const msg = err instanceof Error ? err.message : 'Failed to load map data';
        setError(msg);
        toast({ title: 'Error', description: msg, status: 'error', duration: 6000, isClosable: true });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [apiClient, onLoad, toast]);

  // Click handler wrapper for sigma
  const handleSigmaNodeClick = useCallback(
    (node: MapNode) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100%">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box position="relative" width="100%" height="100%">
      <SigmaContainer style={{ width: '100%', height: '100%' }} settings={{ allowInvalidContainer: true }}>
        <SigmaGraphLoader nodes={nodes} edges={edges} onSigmaNodeClick={handleSigmaNodeClick} />
        {/* Controls */}
        <ControlsContainer position={'bottom-right'}>
          <LayoutForceAtlas2Control autoRunFor={2000} />
        </ControlsContainer>
        <ControlsContainer position={'top-right'}>
          <FullScreenControl />
        </ControlsContainer>
      </SigmaContainer>

      {/* Color legend */}
      <Box position="absolute" top="8px" right="8px" bg="white" p={2} borderRadius="md" boxShadow="sm" fontSize="xs" zIndex={10}>
        {Object.entries(typeColor).map(([key, color]) => (
          <Box key={key} display="flex" alignItems="center" mb={1} _last={{ mb: 0 }}>
            <Box boxSize="10px" borderRadius="50%" bg={color} mr={2} />
            <Text>{key.toLowerCase()}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WebGLMap; 