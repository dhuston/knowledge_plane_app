/**
 * AdvancedMetrics.ts
 * Advanced graph metrics and algorithms for network analysis
 */

import { MapNode, MapEdgeTypeEnum } from '../../types/map';

// Types
export interface MapData {
  nodes: MapNode[];
  edges: { source: string; target: string; type?: MapEdgeTypeEnum }[];
}

export interface AdjacencyList {
  [nodeId: string]: string[];
}

export interface AdjacencyMatrix {
  [nodeId: string]: { [nodeId: string]: number };
}

export interface CommunityStructure {
  communities: Record<string, string[]>;
  modularity: number;
}

export interface CollaborationOpportunity {
  nodeIds: [string, string];
  score: number;
  reason: string;
}

/**
 * Builds an adjacency matrix from an adjacency list
 * @param adjacencyList The adjacency list representation
 * @returns Adjacency matrix representation
 */
export function buildAdjacencyMatrix(adjacencyList: AdjacencyList): AdjacencyMatrix {
  const matrix: AdjacencyMatrix = {};
  const nodeIds = Object.keys(adjacencyList);
  
  // Initialize empty matrix
  nodeIds.forEach(id1 => {
    matrix[id1] = {};
    nodeIds.forEach(id2 => {
      matrix[id1][id2] = 0;
    });
  });
  
  // Fill matrix based on adjacency list
  nodeIds.forEach(id => {
    adjacencyList[id].forEach(neighbor => {
      matrix[id][neighbor] = 1;
    });
  });
  
  return matrix;
}

/**
 * Calculate eigenvector centrality for all nodes in the graph
 * Eigenvector centrality measures a node's influence based on the influence of its neighbors
 * @param mapData The graph data
 * @param adjacencyList Adjacency list representation of the graph
 * @param maxIterations Maximum number of iterations for convergence
 * @returns Record of node IDs to eigenvector centrality values
 */
export function calculateEigenvectorCentrality(
  mapData: MapData,
  adjacencyList: AdjacencyList,
  maxIterations: number = 100
): Record<string, number> {
  const nodeIds = Object.keys(adjacencyList);
  const n = nodeIds.length;
  
  // Initialize centrality values
  let centrality: Record<string, number> = {};
  nodeIds.forEach(id => {
    centrality[id] = 1 / n;
  });
  
  // Power iteration method
  for (let iter = 0; iter < maxIterations; iter++) {
    const newCentrality: Record<string, number> = {};
    nodeIds.forEach(id => {
      newCentrality[id] = 0;
    });
    
    // Update based on neighbor centrality
    nodeIds.forEach(nodeId => {
      adjacencyList[nodeId].forEach(neighbor => {
        newCentrality[neighbor] += centrality[nodeId];
      });
    });
    
    // Normalize
    let sum = 0;
    nodeIds.forEach(id => {
      sum += newCentrality[id] * newCentrality[id];
    });
    
    const normFactor = Math.sqrt(sum);
    
    if (normFactor > 0) {
      nodeIds.forEach(id => {
        newCentrality[id] /= normFactor;
      });
    }
    
    // Check for convergence
    let diff = 0;
    nodeIds.forEach(id => {
      diff += Math.abs(newCentrality[id] - centrality[id]);
    });
    
    centrality = { ...newCentrality };
    
    if (diff < 0.0001) {
      break;
    }
  }
  
  return centrality;
}

/**
 * Detect communities in the graph using the Louvain method
 * The Louvain method is a hierarchical community detection algorithm 
 * that maximizes modularity
 * @param mapData The graph data
 * @param adjacencyList Adjacency list representation of the graph
 * @returns Detected community structure
 */
export function detectCommunitiesLouvain(
  mapData: MapData,
  adjacencyList: AdjacencyList
): CommunityStructure {
  const nodeIds = Object.keys(adjacencyList);
  let totalEdges = 0;
  
  // Count total edges
  Object.values(adjacencyList).forEach(neighbors => {
    totalEdges += neighbors.length;
  });
  totalEdges /= 2; // For undirected graph
  
  // Initialize: each node in its own community
  const communities: Record<string, string> = {};
  nodeIds.forEach(id => {
    communities[id] = id;
  });
  
  // Calculate initial modularity
  let currentModularity = calculateModularity(adjacencyList, communities, totalEdges);
  let improved = true;
  
  // Phase 1: Optimize modularity locally
  while (improved) {
    improved = false;
    
    // Try moving each node to its neighbors' communities
    for (const nodeId of nodeIds) {
      const currentCommunity = communities[nodeId];
      
      // Get unique communities of neighbors
      const neighborCommunities = new Set<string>();
      adjacencyList[nodeId].forEach(neighbor => {
        neighborCommunities.add(communities[neighbor]);
      });
      
      let bestModularity = currentModularity;
      let bestCommunity = currentCommunity;
      
      // Try moving to each neighbor community
      neighborCommunities.forEach(community => {
        if (community !== currentCommunity) {
          communities[nodeId] = community;
          const newModularity = calculateModularity(adjacencyList, communities, totalEdges);
          
          if (newModularity > bestModularity) {
            bestModularity = newModularity;
            bestCommunity = community;
          }
        }
      });
      
      // If we found a better community, move to it
      if (bestCommunity !== currentCommunity) {
        communities[nodeId] = bestCommunity;
        currentModularity = bestModularity;
        improved = true;
      } else {
        communities[nodeId] = currentCommunity;
      }
    }
  }
  
  // Phase 2: Aggregate nodes in same community
  // For simplicity, we'll skip the hierarchical part and just return the communities
  
  // Group nodes by community
  const communityNodes: Record<string, string[]> = {};
  nodeIds.forEach(nodeId => {
    const community = communities[nodeId];
    if (!communityNodes[community]) {
      communityNodes[community] = [];
    }
    communityNodes[community].push(nodeId);
  });
  
  return {
    communities: communityNodes,
    modularity: currentModularity
  };
}

/**
 * Calculate modularity of a given community assignment
 * Modularity measures the density of links inside communities compared to links between communities
 * @param adjacencyList Adjacency list representation
 * @param communities Community assignment for each node
 * @param totalEdges Total number of edges in the graph
 * @returns Modularity value
 */
function calculateModularity(
  adjacencyList: AdjacencyList,
  communities: Record<string, string>,
  totalEdges: number
): number {
  let modularity = 0;
  const nodeIds = Object.keys(adjacencyList);
  
  // Calculate modularity
  for (let i = 0; i < nodeIds.length; i++) {
    const nodeId1 = nodeIds[i];
    
    for (let j = 0; j < nodeIds.length; j++) {
      const nodeId2 = nodeIds[j];
      
      // Check if nodes are in same community
      if (communities[nodeId1] === communities[nodeId2]) {
        // Check if there's an edge between the nodes
        const isConnected = adjacencyList[nodeId1].includes(nodeId2) ? 1 : 0;
        
        // Expected number of edges
        const ki = adjacencyList[nodeId1].length;
        const kj = adjacencyList[nodeId2].length;
        const expected = ki * kj / (2 * totalEdges);
        
        modularity += (isConnected - expected) / (2 * totalEdges);
      }
    }
  }
  
  return modularity;
}

/**
 * Identify bottlenecks in the network
 * Bottlenecks are nodes whose removal would significantly impact the network structure
 * @param mapData The graph data
 * @param adjacencyList Adjacency list representation
 * @returns Array of node IDs that are bottlenecks, sorted by importance
 */
export function identifyBottlenecks(
  mapData: MapData,
  adjacencyList: AdjacencyList
): string[] {
  const nodeIds = Object.keys(adjacencyList);
  
  // Calculate betweenness centrality
  const betweenness = calculateBetweennessCentrality(mapData, adjacencyList);
  
  // Calculate clustering coefficient
  const clustering = calculateClusteringCoefficient(mapData, adjacencyList);
  
  // Calculate degree
  const degree: Record<string, number> = {};
  nodeIds.forEach(id => {
    degree[id] = adjacencyList[id].length;
  });
  
  // Bottleneck score = betweenness * (1 - clustering) / (degree + 1)
  const bottleneckScores = nodeIds.map(id => ({
    id,
    score: betweenness[id] * (1 - clustering[id]) / (degree[id] + 1)
  }));
  
  // Return top bottlenecks
  return bottleneckScores
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(5, Math.floor(nodeIds.length * 0.05))) // Top 5% or at least 5
    .map(item => item.id);
}

/**
 * Calculate betweenness centrality for all nodes
 * @param mapData Graph data
 * @param adjacencyList Adjacency list representation
 * @returns Betweenness centrality values for each node
 */
function calculateBetweennessCentrality(
  mapData: MapData,
  adjacencyList: AdjacencyList
): Record<string, number> {
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
      
      // Get all shortest paths from source to target
      const { paths, distances } = findAllShortestPaths(source, target, adjacencyList);
      
      if (paths.length === 0) continue;
      
      // For each shortest path, increment betweenness for intermediate nodes
      const betweennessDelta = 1 / paths.length;
      
      for (const path of paths) {
        // Skip source and target nodes
        for (let k = 1; k < path.length - 1; k++) {
          result[path[k]] += betweennessDelta;
        }
      }
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
 * Find all shortest paths between two nodes
 * @param source Source node ID
 * @param target Target node ID
 * @param adjacencyList Adjacency list representation
 * @returns Object containing all shortest paths and the distances
 */
function findAllShortestPaths(
  source: string,
  target: string,
  adjacencyList: AdjacencyList
): { paths: string[][]; distances: Record<string, number> } {
  const distances: Record<string, number> = {};
  const visited: Record<string, boolean> = {};
  const predecessor: Record<string, string[]> = {};
  const nodeIds = Object.keys(adjacencyList);
  
  // Initialize
  nodeIds.forEach(id => {
    distances[id] = Infinity;
    visited[id] = false;
    predecessor[id] = [];
  });
  
  // BFS to find shortest paths
  const queue: string[] = [source];
  distances[source] = 0;
  visited[source] = true;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Stop BFS when we reach the target
    if (current === target) {
      break;
    }
    
    for (const neighbor of adjacencyList[current]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        distances[neighbor] = distances[current] + 1;
        predecessor[neighbor] = [current];
        queue.push(neighbor);
      } else if (distances[neighbor] === distances[current] + 1) {
        // This is another path of the same length
        predecessor[neighbor].push(current);
      }
    }
  }
  
  // Backtrack to find all shortest paths
  const paths: string[][] = [];
  
  function backtrack(currentNode: string, path: string[]): void {
    if (currentNode === source) {
      paths.push([currentNode, ...path]);
      return;
    }
    
    for (const pred of predecessor[currentNode]) {
      backtrack(pred, [currentNode, ...path]);
    }
  }
  
  if (distances[target] !== Infinity) {
    backtrack(target, []);
  }
  
  return { paths, distances };
}

/**
 * Calculate clustering coefficient for each node
 * @param mapData Graph data
 * @param adjacencyList Adjacency list representation
 * @returns Clustering coefficient for each node
 */
function calculateClusteringCoefficient(
  mapData: MapData,
  adjacencyList: AdjacencyList
): Record<string, number> {
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
 * Find potential collaboration opportunities in the network
 * Identifies pairs of nodes that are not connected but would benefit from connection
 * @param mapData Graph data
 * @param adjacencyList Adjacency list representation
 * @returns Array of collaboration opportunities
 */
export function findCollaborationOpportunities(
  mapData: MapData,
  adjacencyList: AdjacencyList
): CollaborationOpportunity[] {
  const opportunities: CollaborationOpportunity[] = [];
  const nodeIds = Object.keys(adjacencyList);
  
  // Strategy 1: Common neighbors (basic)
  // Find node pairs that share many common neighbors but aren't connected
  for (let i = 0; i < nodeIds.length; i++) {
    const node1 = nodeIds[i];
    
    for (let j = i + 1; j < nodeIds.length; j++) {
      const node2 = nodeIds[j];
      
      // Skip if nodes are already connected
      if (adjacencyList[node1].includes(node2)) {
        continue;
      }
      
      // Find common neighbors
      const neighbors1 = new Set(adjacencyList[node1]);
      const neighbors2 = new Set(adjacencyList[node2]);
      const commonNeighbors: string[] = [];
      
      neighbors1.forEach(neighbor => {
        if (neighbors2.has(neighbor)) {
          commonNeighbors.push(neighbor);
        }
      });
      
      if (commonNeighbors.length >= 2) {
        opportunities.push({
          nodeIds: [node1, node2],
          score: commonNeighbors.length,
          reason: `Share ${commonNeighbors.length} common connections`
        });
      }
    }
  }
  
  // Strategy 2: Community bridging opportunities
  const communityStructure = detectCommunitiesLouvain(mapData, adjacencyList);
  const communities = Object.values(communityStructure.communities);
  
  // For each pair of communities, find potential bridge nodes
  for (let i = 0; i < communities.length; i++) {
    const community1 = communities[i];
    
    for (let j = i + 1; j < communities.length; j++) {
      const community2 = communities[j];
      
      // Find nodes in each community with connections to the other community
      const bridgeNodes1 = community1.filter(nodeId => 
        adjacencyList[nodeId].some(neighbor => community2.includes(neighbor))
      );
      
      const bridgeNodes2 = community2.filter(nodeId => 
        adjacencyList[nodeId].some(neighbor => community1.includes(neighbor))
      );
      
      // Find potential bridges that aren't connected yet
      for (const node1 of bridgeNodes1) {
        for (const node2 of bridgeNodes2) {
          if (!adjacencyList[node1].includes(node2)) {
            opportunities.push({
              nodeIds: [node1, node2],
              score: 0.8 * Math.min(bridgeNodes1.length, bridgeNodes2.length),
              reason: 'Potential community bridge'
            });
          }
        }
      }
    }
  }
  
  // Strategy 3: Similar expertise but disconnected
  // For simplicity, we'll assume similar expertise is implied by similar connection patterns
  // Calculate Jaccard similarity between nodes that aren't connected
  for (let i = 0; i < nodeIds.length; i++) {
    const node1 = nodeIds[i];
    const neighbors1 = new Set(adjacencyList[node1]);
    
    for (let j = i + 1; j < nodeIds.length; j++) {
      const node2 = nodeIds[j];
      
      // Skip if already connected
      if (adjacencyList[node1].includes(node2)) {
        continue;
      }
      
      const neighbors2 = new Set(adjacencyList[node2]);
      
      // Calculate intersection size
      let intersectionSize = 0;
      neighbors1.forEach(n => {
        if (neighbors2.has(n)) intersectionSize++;
      });
      
      // Calculate union size
      const unionSize = neighbors1.size + neighbors2.size - intersectionSize;
      
      // Jaccard similarity
      if (unionSize > 0) {
        const similarity = intersectionSize / unionSize;
        
        if (similarity > 0.3) { // Threshold for recommendation
          opportunities.push({
            nodeIds: [node1, node2],
            score: similarity * 10, // Scale to similar range as other methods
            reason: 'Similar connection patterns'
          });
        }
      }
    }
  }
  
  // Sort by score and return top opportunities
  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // Return top 20
}