/**
 * AnalyticsWorker.ts
 * Web worker for performant graph analytics calculations off the main thread
 */

import { MapNode, MapEdgeTypeEnum } from '../types/map';
import * as AdvancedMetrics from '../components/analytics/AdvancedMetrics';

// Define interfaces matching the main thread code for structural typing
interface MapData {
  nodes: MapNode[];
  edges: { source: string; target: string; type?: MapEdgeTypeEnum }[];
}

interface NodeMetrics {
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  clusteringCoefficient: number;
  eigenvectorCentrality: number;
}

interface Cluster {
  id: string;
  nodeIds: string[];
  score: number;
}

interface GraphMetrics {
  nodes: Record<string, NodeMetrics>;
  clusters: Cluster[];
  mostCentralNodes: string[];
  mostConnectedClusters: string[];
  bottlenecks: string[];
  collaborationOpportunities: Array<{
    nodeIds: [string, string];
    score: number;
    reason: string;
  }>;
}

interface AdjacencyList {
  [nodeId: string]: string[];
}

interface AdjacencyMatrix {
  [nodeId: string]: { [nodeId: string]: number };
}

// Message handling
self.onmessage = (event: MessageEvent) => {
  const { type, data, requestId } = event.data;

  try {
    switch (type) {
      case 'calculateAllMetrics':
        const result = calculateAllMetrics(data.mapData);
        self.postMessage({ type: 'result', requestId, result });
        break;
        
      case 'calculateMetric':
        const metricResult = calculateSpecificMetric(
          data.mapData, 
          data.metricName, 
          data.options
        );
        self.postMessage({ 
          type: 'result', 
          requestId, 
          result: metricResult 
        });
        break;
        
      default:
        throw new Error(`Unknown operation: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Calculate specific metric based on metric name
 * @param mapData The graph data
 * @param metricName Name of the metric to calculate
 * @param options Additional options for calculation
 * @returns The calculated metric result
 */
function calculateSpecificMetric(
  mapData: MapData, 
  metricName: string,
  options: any = {}
): any {
  const adjacencyList = buildAdjacencyList(mapData);
  
  switch (metricName) {
    case 'degreeCentrality':
      return calculateDegreeCentrality(mapData, adjacencyList);
    case 'betweennessCentrality':
      return calculateBetweennessCentrality(mapData, adjacencyList);
    case 'closenessCentrality':
      return calculateClosenessCentrality(mapData, adjacencyList);
    case 'clusteringCoefficient':
      return calculateClusteringCoefficient(mapData, adjacencyList);
    case 'eigenvectorCentrality':
      return AdvancedMetrics.calculateEigenvectorCentrality(mapData, adjacencyList, options.iterations || 100);
    case 'communities':
      return detectCommunities(mapData, adjacencyList);
    case 'bottlenecks':
      return AdvancedMetrics.identifyBottlenecks(mapData, adjacencyList);
    case 'collaborationOpportunities':
      return AdvancedMetrics.findCollaborationOpportunities(mapData, adjacencyList);
    default:
      throw new Error(`Unknown metric: ${metricName}`);
  }
}

/**
 * Calculate all metrics for the graph
 * @param mapData The graph data to analyze
 * @returns Complete graph metrics
 */
function calculateAllMetrics(mapData: MapData): GraphMetrics {
  const adjacencyList = buildAdjacencyList(mapData);
  
  // Calculate individual metrics
  const degreeCentrality = calculateDegreeCentrality(mapData, adjacencyList);
  const betweennessCentrality = calculateBetweennessCentrality(mapData, adjacencyList);
  const closenessCentrality = calculateClosenessCentrality(mapData, adjacencyList);
  const clusteringCoefficient = calculateClusteringCoefficient(mapData, adjacencyList);
  const eigenvectorCentrality = AdvancedMetrics.calculateEigenvectorCentrality(mapData, adjacencyList);
  
  // Combine metrics for each node
  const nodeMetrics: Record<string, NodeMetrics> = {};
  
  Object.keys(adjacencyList).forEach(nodeId => {
    nodeMetrics[nodeId] = {
      degreeCentrality: degreeCentrality[nodeId] || 0,
      betweennessCentrality: betweennessCentrality[nodeId] || 0,
      closenessCentrality: closenessCentrality[nodeId] || 0,
      clusteringCoefficient: clusteringCoefficient[nodeId] || 0,
      eigenvectorCentrality: eigenvectorCentrality[nodeId] || 0
    };
  });
  
  // Find most central nodes based on combination of metrics
  const centralityScores = Object.entries(nodeMetrics).map(([nodeId, metrics]) => {
    const score = 
      metrics.degreeCentrality + 
      metrics.betweennessCentrality + 
      metrics.closenessCentrality +
      metrics.eigenvectorCentrality;
    return { nodeId, score };
  });
  
  const mostCentralNodes = centralityScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.nodeId);
  
  // Detect clusters using the improved Louvain method
  const communityStructure = AdvancedMetrics.detectCommunitiesLouvain(mapData, adjacencyList);
  
  // Convert to our cluster format
  const clusters: Cluster[] = Object.entries(communityStructure.communities)
    .map(([communityId, nodeIds], index) => ({
      id: `cluster-${index}`,
      nodeIds,
      score: nodeIds.length
    }));
  
  // Find most connected clusters
  const mostConnectedClusters = clusters
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(cluster => cluster.id);
  
  // Identify bottlenecks
  const bottlenecks = AdvancedMetrics.identifyBottlenecks(mapData, adjacencyList);
  
  // Find collaboration opportunities
  const collaborationOpportunities = AdvancedMetrics.findCollaborationOpportunities(mapData, adjacencyList);
  
  return {
    nodes: nodeMetrics,
    clusters,
    mostCentralNodes,
    mostConnectedClusters,
    bottlenecks,
    collaborationOpportunities
  };
}

/**
 * Build an adjacency list representation of the graph for efficient traversal
 */
function buildAdjacencyList(mapData: MapData): AdjacencyList {
  const adjacencyList: AdjacencyList = {};
  
  // Initialize empty adjacency lists for all nodes
  mapData.nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  // Populate adjacency lists with edges
  mapData.edges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].push(edge.target);
    }
    
    // For undirected graph analysis, add the reverse connection
    if (adjacencyList[edge.target]) {
      adjacencyList[edge.target].push(edge.source);
    }
  });
  
  return adjacencyList;
}

/**
 * Calculate degree centrality for all nodes
 */
function calculateDegreeCentrality(mapData: MapData, adjacencyList: AdjacencyList): Record<string, number> {
  const result: Record<string, number> = {};
  const n = mapData.nodes.length;
  
  // Skip normalization if there's only one node
  const normalizationFactor = n > 1 ? 1 / (n - 1) : 0;
  
  Object.entries(adjacencyList).forEach(([nodeId, neighbors]) => {
    // Normalize by dividing by (n-1) so values are between 0 and 1
    result[nodeId] = neighbors.length * normalizationFactor;
  });
  
  return result;
}

/**
 * Calculate betweenness centrality for all nodes
 */
function calculateBetweennessCentrality(mapData: MapData, adjacencyList: AdjacencyList): Record<string, number> {
  // Implementation follows the same approach as the main thread code
  const result: Record<string, number> = {};
  const nodeIds = Object.keys(adjacencyList);
  
  // Initialize all nodes with zero betweenness centrality
  nodeIds.forEach(id => {
    result[id] = 0;
  });
  
  // For each pair of nodes, find shortest paths and count betweenness
  for (let i = 0; i < nodeIds.length; i++) {
    const source = nodeIds[i];
    
    for (let j = i + 1; j < nodeIds.length; j++) {
      const target = nodeIds[j];
      
      // Get all nodes on shortest paths from source to target
      const nodesOnShortestPaths = findNodesOnShortestPaths(source, target, adjacencyList);
      
      // Increase betweenness for each node on shortest paths (except source and target)
      nodesOnShortestPaths.forEach(nodeId => {
        if (nodeId !== source && nodeId !== target) {
          result[nodeId] += 1;
        }
      });
    }
  }
  
  // Normalize values
  const n = nodeIds.length;
  const normalizationFactor = n > 2 ? 1 / ((n - 1) * (n - 2) / 2) : 0;
  
  nodeIds.forEach(id => {
    result[id] = result[id] * normalizationFactor;
  });
  
  return result;
}

/**
 * Calculate closeness centrality for all nodes
 */
function calculateClosenessCentrality(mapData: MapData, adjacencyList: AdjacencyList): Record<string, number> {
  const result: Record<string, number> = {};
  const nodeIds = Object.keys(adjacencyList);
  
  nodeIds.forEach(source => {
    const distances = calculateShortestPaths(source, adjacencyList);
    
    // Sum up all distances
    let sum = 0;
    let reachableNodes = 0;
    
    nodeIds.forEach(target => {
      if (source !== target) {
        if (distances[target] !== Infinity) {
          sum += distances[target];
          reachableNodes++;
        }
      }
    });
    
    // Closeness is 0 if node can't reach any other nodes
    if (sum === 0 || reachableNodes === 0) {
      result[source] = 0;
    } else {
      // Normalized closeness: (n-1) / sum, where n is the number of reachable nodes
      result[source] = reachableNodes / sum;
    }
  });
  
  return result;
}

/**
 * Calculate clustering coefficient for all nodes
 */
function calculateClusteringCoefficient(mapData: MapData, adjacencyList: AdjacencyList): Record<string, number> {
  const result: Record<string, number> = {};
  
  Object.entries(adjacencyList).forEach(([nodeId, neighbors]) => {
    const k = neighbors.length;
    
    // If less than 2 neighbors, clustering coefficient is 0
    if (k < 2) {
      result[nodeId] = 0;
      return;
    }
    
    // Count connections between neighbors
    let connections = 0;
    
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor1 = neighbors[i];
      
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighbor2 = neighbors[j];
        
        // Check if these neighbors are connected
        if (adjacencyList[neighbor1].includes(neighbor2)) {
          connections++;
        }
      }
    }
    
    // Calculate coefficient: actual connections / possible connections
    // Possible connections in an undirected graph = k*(k-1)/2
    const possibleConnections = (k * (k - 1)) / 2;
    result[nodeId] = connections / possibleConnections;
  });
  
  return result;
}

/**
 * Detect clusters/communities in the graph
 */
function detectCommunities(mapData: MapData, adjacencyList: AdjacencyList): Cluster[] {
  const communityStructure = AdvancedMetrics.detectCommunitiesLouvain(
    mapData, 
    adjacencyList
  );
  
  // Convert to cluster format
  return Object.entries(communityStructure.communities)
    .map(([clusterId, nodeIds], index) => ({
      id: `cluster-${index}`,
      nodeIds,
      score: nodeIds.length
    }));
}

/**
 * Helper function to find shortest paths using BFS
 */
function findNodesOnShortestPaths(
  source: string, 
  target: string, 
  adjacencyList: AdjacencyList
): string[] {
  const visited: Record<string, boolean> = {};
  const distance: Record<string, number> = {};
  const predecessor: Record<string, string[]> = {};
  const result = new Set<string>();
  
  // Initialize data structures
  Object.keys(adjacencyList).forEach(id => {
    visited[id] = false;
    distance[id] = Infinity;
    predecessor[id] = [];
  });
  
  // BFS to find shortest paths
  const queue: string[] = [source];
  visited[source] = true;
  distance[source] = 0;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    adjacencyList[current].forEach(neighbor => {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        distance[neighbor] = distance[current] + 1;
        predecessor[neighbor] = [current];
        queue.push(neighbor);
      } else if (distance[neighbor] === distance[current] + 1) {
        // If this is another shortest path, add to predecessors
        predecessor[neighbor].push(current);
      }
    });
  }
  
  // Backtrack from target to source to find all nodes on shortest paths
  const backtrack = (nodeId: string): void => {
    if (nodeId === source) return;
    
    result.add(nodeId);
    
    predecessor[nodeId].forEach(pred => {
      backtrack(pred);
      result.add(pred);
    });
  };
  
  backtrack(target);
  return Array.from(result);
}

/**
 * Calculate shortest path distances from a source node to all other nodes
 */
function calculateShortestPaths(
  source: string, 
  adjacencyList: AdjacencyList
): Record<string, number> {
  const distances: Record<string, number> = {};
  const visited: Record<string, boolean> = {};
  
  // Initialize distances
  Object.keys(adjacencyList).forEach(id => {
    distances[id] = Infinity;
    visited[id] = false;
  });
  
  // Distance to self is 0
  distances[source] = 0;
  
  // BFS to find shortest paths
  const queue: string[] = [source];
  visited[source] = true;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    adjacencyList[current].forEach(neighbor => {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        distances[neighbor] = distances[current] + 1;
        queue.push(neighbor);
      }
    });
  }
  
  return distances;
}