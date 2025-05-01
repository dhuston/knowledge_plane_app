/**
 * analytics-worker.ts
 * Web Worker implementation for computationally intensive analytics operations
 */

import { MapNode, MapEdgeTypeEnum } from '../types/map';

export interface MapData {
  nodes: MapNode[];
  edges: { source: string; target: string; type?: MapEdgeTypeEnum }[];
}

/**
 * Calculate degree centrality for each node
 * @param mapData Map data containing nodes and edges
 * @returns Map of node IDs to degree centrality values
 */
function calculateDegreeCentrality(mapData: MapData): Record<string, number> {
  const result: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};
  
  // Build adjacency list
  mapData.nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  mapData.edges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].push(edge.target);
    }
    
    // For undirected graph
    if (adjacencyList[edge.target]) {
      adjacencyList[edge.target].push(edge.source);
    }
  });
  
  const n = mapData.nodes.length;
  const normalizationFactor = n > 1 ? 1 / (n - 1) : 0;
  
  Object.entries(adjacencyList).forEach(([nodeId, neighbors]) => {
    result[nodeId] = neighbors.length * normalizationFactor;
  });
  
  return result;
}

/**
 * Calculate betweenness centrality for each node
 * @param mapData Map data containing nodes and edges
 * @returns Map of node IDs to betweenness centrality values
 */
function calculateBetweennessCentrality(mapData: MapData): Record<string, number> {
  const result: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};
  
  // Build adjacency list
  mapData.nodes.forEach(node => {
    adjacencyList[node.id] = [];
    result[node.id] = 0; // Initialize centrality values
  });
  
  mapData.edges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].push(edge.target);
    }
    
    // For undirected graph
    if (adjacencyList[edge.target]) {
      adjacencyList[edge.target].push(edge.source);
    }
  });
  
  const nodeIds = Object.keys(adjacencyList);
  
  // Calculate betweenness using Brandes algorithm
  for (const s of nodeIds) {
    // Single-source shortest paths
    const stack: string[] = [];
    const predecessors: Record<string, string[]> = {};
    nodeIds.forEach(id => { predecessors[id] = []; });
    
    const distances: Record<string, number> = {};
    nodeIds.forEach(id => { distances[id] = (id === s) ? 0 : Infinity; });
    
    const sigma: Record<string, number> = {};
    nodeIds.forEach(id => { sigma[id] = (id === s) ? 1 : 0; });
    
    const queue = [s];
    
    // BFS to find shortest paths
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      
      for (const neighbor of adjacencyList[v]) {
        // Path discovery
        if (distances[neighbor] === Infinity) {
          distances[neighbor] = distances[v] + 1;
          queue.push(neighbor);
        }
        
        // Path counting
        if (distances[neighbor] === distances[v] + 1) {
          sigma[neighbor] += sigma[v];
          predecessors[neighbor].push(v);
        }
      }
    }
    
    // Accumulation phase
    const delta: Record<string, number> = {};
    nodeIds.forEach(id => { delta[id] = 0; });
    
    // Back-propagation of dependencies
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) {
        result[w] += delta[w];
      }
    }
  }
  
  // Normalization
  const n = nodeIds.length;
  const normalizationFactor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 0;
  
  nodeIds.forEach(id => {
    result[id] = result[id] * normalizationFactor;
  });
  
  return result;
}

/**
 * Calculate all metrics for a graph
 * @param mapData Map data containing nodes and edges
 * @returns Object with all calculated metrics
 */
function calculateAllMetrics(mapData: MapData) {
  try {
    console.log('[Worker] Calculating all metrics for graph with', mapData.nodes.length, 'nodes');
    
    // Calculate individual metrics
    const degreeCentrality = calculateDegreeCentrality(mapData);
    const betweennessCentrality = calculateBetweennessCentrality(mapData);
    
    // Combine metrics for each node
    const nodeMetrics: Record<string, any> = {};
    
    Object.keys(degreeCentrality).forEach(nodeId => {
      nodeMetrics[nodeId] = {
        degreeCentrality: degreeCentrality[nodeId] || 0,
        betweennessCentrality: betweennessCentrality[nodeId] || 0,
        closenessCentrality: Math.random() * 0.5, // Placeholder
        clusteringCoefficient: Math.random() * 0.5, // Placeholder
        eigenvectorCentrality: Math.random() * 0.5  // Placeholder
      };
    });
    
    // For this initial implementation, generate mock data for other metrics
    return {
      nodes: nodeMetrics,
      clusters: [
        { id: 'cluster-1', nodeIds: Object.keys(nodeMetrics).slice(0, Math.floor(Object.keys(nodeMetrics).length / 2)), score: 10 },
        { id: 'cluster-2', nodeIds: Object.keys(nodeMetrics).slice(Math.floor(Object.keys(nodeMetrics).length / 2)), score: 8 }
      ],
      mostCentralNodes: Object.entries(betweennessCentrality)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id),
      bottlenecks: [],
      collaborationOpportunities: []
    };
  } catch (error) {
    console.error('[Worker] Error calculating metrics:', error);
    throw error;
  }
}

/**
 * Calculate a specific metric
 * @param mapData Map data containing nodes and edges
 * @param metricName The name of the metric to calculate
 * @param options Additional options for the calculation
 * @returns The calculated metric results
 */
function calculateSpecificMetric(mapData: MapData, metricName: string, options: any = {}): any {
  try {
    console.log(`[Worker] Calculating ${metricName} for graph with ${mapData.nodes.length} nodes`);
    
    switch (metricName) {
      case 'degreeCentrality':
        return calculateDegreeCentrality(mapData);
      case 'betweennessCentrality':
        return calculateBetweennessCentrality(mapData);
      default:
        throw new Error(`Unknown metric: ${metricName}`);
    }
  } catch (error) {
    console.error(`[Worker] Error calculating ${metricName}:`, error);
    throw error;
  }
}

// Set up message handler
self.onmessage = function(e) {
  try {
    const { type, data, requestId } = e.data;
    let result;
    
    switch (type) {
      case 'calculateAllMetrics':
        result = calculateAllMetrics(data.mapData);
        break;
      case 'calculateMetric':
        result = calculateSpecificMetric(
          data.mapData,
          data.metricName,
          data.options
        );
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    self.postMessage({ requestId, result });
  } catch (error) {
    self.postMessage({
      requestId: e.data.requestId,
      error: error.message || 'Unknown error in worker'
    });
  }
};