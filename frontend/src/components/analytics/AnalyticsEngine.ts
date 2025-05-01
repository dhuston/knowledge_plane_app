/**
 * AnalyticsEngine.ts
 * Core graph analytics and metrics calculations for the knowledge map
 */

import { MapNode, MapEdgeTypeEnum } from '../../types/map';
import * as AdvancedMetrics from './AdvancedMetrics';

// Analytics worker
let analyticsWorker: Worker | null = null;
let workerInitialized = false;
const pendingWorkerRequests = new Map<string, {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}>();

export interface NodeMetrics {
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  clusteringCoefficient: number;
  eigenvectorCentrality: number;
}

export interface GraphMetrics {
  nodes: Record<string, NodeMetrics>;
  clusters: Cluster[];
  mostCentralNodes: string[];
  mostConnectedClusters: string[];
  bottlenecks: BottleneckData[];
  collaborationOpportunities: CollaborationOpportunity[];
  // Network-level metrics
  density: number;
  modularity: number;
  connectedness: number;
  centralization: number;
  resilience: number;
  efficiency: number;
}

export interface Cluster {
  id: string;
  nodeIds: string[];
  score: number;
}

export interface MapData {
  nodes: MapNode[];
  edges: { source: string; target: string; type?: MapEdgeTypeEnum }[];
}

export interface BottleneckData {
  nodeId: string;
  name: string;
  type: string;
  severity: number;
  connectedNodes: string[];
  description: string;
  betweenness?: number;
  stress?: number;
  connections?: number;
}

export interface CollaborationOpportunity {
  nodeIds: [string, string];
  score: number;
  reason: string;
}

export interface FlowMetrics {
  inflow: number;
  outflow: number;
  throughput: number;
}

/**
 * Main analytics engine class for calculating graph metrics
 */
export class AnalyticsEngine {
  private mapData: MapData;
  private adjacencyList: Record<string, string[]> = {};
  private calculationCache: Map<string, { result: any; timestamp: number }> = new Map();
  private cacheLifetime = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  constructor(mapData: MapData) {
    this.mapData = mapData;
    this.buildAdjacencyList();
    this.initWorker();
  }
  
  /**
   * Initialize the web worker if supported
   */
  private initWorker(): void {
    console.log("Initializing analytics worker. Web Workers supported:", typeof Worker !== 'undefined');
    
    // Always set worker to null for this implementation to force calculations on the main thread
    // This avoids issues with module loading in development environments
    analyticsWorker = null;
    workerInitialized = false;
    console.log("Using main thread for analytics calculations instead of workers");
  }
  
  /**
   * Send a task to the worker if available, otherwise run on main thread
   * @param task Task type to run
   * @param data Data for the task
   * @returns Promise resolving to the result
   */
  private async sendToWorker(task: string, data: any): Promise<any> {
    // Return cached result if available and fresh
    const cacheKey = `${task}-${JSON.stringify(data)}`;
    const cachedItem = this.calculationCache.get(cacheKey);
    
    if (cachedItem && Date.now() - cachedItem.timestamp < this.cacheLifetime) {
      return cachedItem.result;
    }
    
    // Use worker if available
    if (workerInitialized && analyticsWorker) {
      const requestId = `${Date.now()}-${Math.random()}`;
      
      const resultPromise = new Promise((resolve, reject) => {
        pendingWorkerRequests.set(requestId, { resolve, reject });
      });
      
      analyticsWorker.postMessage({
        type: task,
        data,
        requestId
      });
      
      const result = await resultPromise;
      
      // Cache the result
      this.calculationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    } else {
      // Fallback to main thread calculation
      let result;
      
      switch (task) {
        case 'calculateAllMetrics':
          result = this.calculateAllMetricsOnMainThread();
          break;
        case 'calculateMetric':
          result = this.calculateSpecificMetricOnMainThread(
            data.metricName,
            data.options
          );
          break;
        default:
          throw new Error(`Unknown task: ${task}`);
      }
      
      // Cache the result
      this.calculationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
  }
  
  /**
   * Build an adjacency list representation of the graph for efficient traversal
   */
  private buildAdjacencyList(): void {
    this.adjacencyList = {};
    
    // Initialize empty adjacency lists for all nodes
    this.mapData.nodes.forEach(node => {
      this.adjacencyList[node.id] = [];
    });
    
    // Populate adjacency lists with edges
    this.mapData.edges.forEach(edge => {
      if (this.adjacencyList[edge.source]) {
        this.adjacencyList[edge.source].push(edge.target);
      }
      
      // For undirected graph analysis, add the reverse connection
      if (this.adjacencyList[edge.target]) {
        this.adjacencyList[edge.target].push(edge.source);
      }
    });
  }

  /**
   * Calculate degree centrality for each node in the graph
   * Degree centrality is the number of direct connections a node has
   * @returns Record of node IDs to degree centrality values
   */
  public async calculateDegreeCentrality(): Promise<Record<string, number>> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'degreeCentrality'
    });
  }

  /**
   * Calculate betweenness centrality for each node in the graph
   * Betweenness centrality measures how often a node appears on shortest paths
   * @returns Record of node IDs to betweenness centrality values
   */
  public async calculateBetweennessCentrality(): Promise<Record<string, number>> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'betweennessCentrality'
    });
  }

  /**
   * Calculate closeness centrality for each node in the graph
   * Closeness is the reciprocal of the sum of the shortest path distances
   * @returns Record of node IDs to closeness centrality values
   */
  public async calculateClosenessCentrality(): Promise<Record<string, number>> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'closenessCentrality'
    });
  }

  /**
   * Calculate clustering coefficient for each node in the graph
   * Measures how connected a node's neighbors are to each other
   * @returns Record of node IDs to clustering coefficient values
   */
  public async calculateClusteringCoefficient(): Promise<Record<string, number>> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'clusteringCoefficient'
    });
  }
  
  /**
   * Calculate eigenvector centrality for each node
   * @param iterations Maximum number of iterations for convergence
   * @returns Record of node IDs to eigenvector centrality values
   */
  public async calculateEigenvectorCentrality(
    iterations: number = 100
  ): Promise<Record<string, number>> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'eigenvectorCentrality',
      options: { iterations }
    });
  }

  /**
   * Detect communities/clusters in the graph using Louvain method
   * @returns Array of detected clusters
   */
  public async detectClusters(): Promise<Cluster[]> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'communities'
    });
  }
  
  /**
   * Identify bottlenecks in the network
   * @returns Array of node IDs of bottleneck nodes
   */
  public async identifyBottlenecks(): Promise<BottleneckData[]> {
    const nodeIds = await this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'bottlenecks'
    });
    
    // Convert to BottleneckData objects with node information
    return nodeIds.map((nodeId: string) => {
      const node = this.mapData.nodes.find(n => n.id === nodeId);
      const connectedNodeIds = this.adjacencyList[nodeId] || [];
      
      if (!node) {
        // Fallback if node not found
        return {
          nodeId,
          name: `Node ${nodeId}`,
          type: 'unknown',
          severity: 0.5,
          connectedNodes: connectedNodeIds,
          description: `Potential bottleneck in the network`,
          betweenness: 0.5,
          stress: 0.5,
          connections: connectedNodeIds.length
        };
      }
      
      return {
        nodeId,
        name: node.label,
        type: node.type,
        severity: Math.random() * 0.5 + 0.3, // Mock severity for demo
        connectedNodes: connectedNodeIds,
        description: `${node.label} is a potential bottleneck for information flow`,
        betweenness: Math.random() * 0.5 + 0.4, // Mock metrics for visualization
        stress: Math.random() * 0.7 + 0.2,
        connections: connectedNodeIds.length * 2 // Just for visualization scaling
      };
    });
  }
  
  /**
   * Find collaboration opportunities in the network
   * @returns Array of potential collaborations
   */
  public async findCollaborationOpportunities(): Promise<CollaborationOpportunity[]> {
    return this.sendToWorker('calculateMetric', {
      mapData: this.mapData,
      metricName: 'collaborationOpportunities'
    });
  }

  /**
   * Calculate all metrics for the graph
   * @returns Complete graph metrics
   */
  public async calculateAllMetrics(): Promise<GraphMetrics> {
    const baseMetrics = await this.sendToWorker('calculateAllMetrics', {
      mapData: this.mapData
    });
    
    // Add network-level metrics that aren't calculated in the worker
    return {
      ...baseMetrics,
      // Mock network-level metrics for the demo
      density: Math.random() * 0.3 + 0.2,
      modularity: Math.random() * 0.4 + 0.3,
      connectedness: Math.random() * 0.3 + 0.6,
      centralization: Math.random() * 0.3 + 0.4,
      resilience: Math.random() * 0.2 + 0.5,
      efficiency: Math.random() * 0.2 + 0.6
    };
  }
  
  /**
   * Calculate flow metrics for information flow visualization
   * @returns Record of node IDs to flow metrics
   */
  public async calculateFlowMetrics(): Promise<Record<string, FlowMetrics>> {
    // This is a simplified implementation just for the demo
    const flowMetrics: Record<string, FlowMetrics> = {};
    
    const betweennessCentrality = await this.calculateBetweennessCentralitySync();
    const degreeCentrality = await this.calculateDegreeCentralitySync();
    
    Object.keys(this.adjacencyList).forEach(nodeId => {
      flowMetrics[nodeId] = {
        inflow: Math.min(1, (0.3 + Math.random() * 0.4 + betweennessCentrality[nodeId] * 0.5)),
        outflow: Math.min(1, (0.2 + Math.random() * 0.3 + degreeCentrality[nodeId] * 0.7)),
        throughput: Math.min(1, (0.1 + Math.random() * 0.4 + betweennessCentrality[nodeId] * 0.8))
      };
    });
    
    return flowMetrics;
  }
  
  /**
   * Calculate all metrics for the graph on the main thread
   * This is a fallback method when web workers aren't available
   * @returns Complete graph metrics
   */
  private calculateAllMetricsOnMainThread(): GraphMetrics {
    // Calculate individual metrics
    const degreeCentrality = this.calculateDegreeCentralitySync();
    const betweennessCentrality = this.calculateBetweennessCentralitySync();
    const closenessCentrality = this.calculateClosenessCentralitySync();
    const clusteringCoefficient = this.calculateClusteringCoefficientSync();
    const eigenvectorCentrality = this.calculateEigenvectorCentralitySync();
    
    // Combine metrics for each node
    const nodeMetrics: Record<string, NodeMetrics> = {};
    
    Object.keys(this.adjacencyList).forEach(nodeId => {
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
    
    // Detect clusters using the improved Louvain method with error handling
    let clusters: Cluster[] = [];
    let communityModularity = 0;
    
    try {
      const communityStructure = AdvancedMetrics.detectCommunitiesLouvain(
        this.mapData, 
        this.adjacencyList
      );
      
      // Validate community structure before processing
      if (communityStructure && communityStructure.communities) {
        // Convert to our cluster format
        clusters = Object.entries(communityStructure.communities)
          .filter(([_, nodeIds]) => Array.isArray(nodeIds)) // Safety check
          .map(([communityId, nodeIds], index) => ({
            id: `cluster-${index}`,
            nodeIds,
            score: nodeIds.length
          }));
          
        communityModularity = communityStructure.modularity || 0;
      } else {
        console.error("Invalid community structure returned", communityStructure);
        // Create a fallback single cluster with all nodes
        clusters = [{
          id: 'cluster-0',
          nodeIds: Object.keys(this.adjacencyList),
          score: Object.keys(this.adjacencyList).length
        }];
      }
    } catch (error) {
      console.error("Error detecting communities:", error);
      // Create a fallback single cluster with all nodes
      clusters = [{
        id: 'cluster-0',
        nodeIds: Object.keys(this.adjacencyList),
        score: Object.keys(this.adjacencyList).length
      }];
    }
    
    // Find most connected clusters
    const mostConnectedClusters = clusters
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, clusters.length))
      .map(cluster => cluster.id);
    
    // Identify bottlenecks with error handling
    let bottlenecks: BottleneckData[] = [];
    
    try {
      // Get bottleneck node IDs
      const bottleneckNodeIds = AdvancedMetrics.identifyBottlenecks(
        this.mapData, 
        this.adjacencyList
      );
      
      // Convert to BottleneckData objects with safety checks
      if (Array.isArray(bottleneckNodeIds)) {
        bottlenecks = bottleneckNodeIds.map(nodeId => {
          if (!nodeId) return null; // Skip invalid entries
          
          try {
            const node = this.mapData.nodes.find(n => n.id === nodeId);
            const connectedNodeIds = this.adjacencyList[nodeId] || [];
            
            if (!node) {
              return {
                nodeId,
                name: `Node ${nodeId}`,
                type: 'unknown',
                severity: 0.5,
                connectedNodes: connectedNodeIds,
                description: `Potential bottleneck in the network`,
                betweenness: 0.5,
                stress: 0.5,
                connections: connectedNodeIds.length
              };
            }
            
            return {
              nodeId,
              name: node.label || `Node ${nodeId}`,
              type: node.type || 'unknown',
              severity: Math.random() * 0.5 + 0.3,
              connectedNodes: connectedNodeIds,
              description: `${node.label || 'This node'} is a potential bottleneck for information flow`,
              betweenness: Math.random() * 0.5 + 0.4,
              stress: Math.random() * 0.7 + 0.2,
              connections: connectedNodeIds.length * 2
            };
          } catch (error) {
            console.error(`Error processing bottleneck ${nodeId}:`, error);
            return null;
          }
        }).filter(bottleneck => bottleneck !== null) as BottleneckData[];
      }
    } catch (error) {
      console.error("Error identifying bottlenecks:", error);
      // Create a minimal fallback bottleneck
      bottlenecks = [];
    }
    
    // Find collaboration opportunities with error handling
    let collaborationOpportunities = [];
    
    try {
      collaborationOpportunities = AdvancedMetrics.findCollaborationOpportunities(
        this.mapData, 
        this.adjacencyList
      );
      
      if (!Array.isArray(collaborationOpportunities)) {
        console.error("Invalid collaboration opportunities returned", collaborationOpportunities);
        collaborationOpportunities = [];
      }
    } catch (error) {
      console.error("Error finding collaboration opportunities:", error);
      collaborationOpportunities = [];
    }
    
    // Calculate network-level metrics with error handling
    // These are simplified implementations for demo purposes
    let density = 0;
    
    try {
      density = this.calculateNetworkDensity();
    } catch (error) {
      console.error("Error calculating network density:", error);
      density = 0.5; // Default value
    }
    
    // Use community modularity from earlier calculation to avoid reference error
    const connectedness = Math.random() * 0.3 + 0.6; // Mock for demo
    const centralization = Math.random() * 0.3 + 0.4; // Mock for demo
    const resilience = Math.random() * 0.2 + 0.5; // Mock for demo
    const efficiency = Math.random() * 0.2 + 0.6; // Mock for demo
    
    return {
      nodes: nodeMetrics,
      clusters,
      mostCentralNodes,
      mostConnectedClusters,
      bottlenecks,
      collaborationOpportunities,
      density,
      modularity: communityModularity,
      connectedness,
      centralization,
      resilience,
      efficiency
    };
  }
  
  /**
   * Helper method to create an empty metric for each node
   * Used as a fallback when metric calculation fails
   */
  private getEmptyMetric(): Record<string, number> {
    const result: Record<string, number> = {};
    
    // Make sure all nodes have a default value
    Object.keys(this.adjacencyList).forEach(nodeId => {
      result[nodeId] = 0;
    });
    
    return result;
  }
  
  /**
   * Calculate network density
   * Density is the ratio of actual connections to possible connections
   */
  private calculateNetworkDensity(): number {
    const n = this.mapData.nodes.length;
    if (n <= 1) return 0;
    
    const maxPossibleEdges = (n * (n - 1)) / 2; // For undirected graph
    const actualEdges = this.mapData.edges.length;
    
    return actualEdges / maxPossibleEdges;
  }
  
  /**
   * Calculate specific metric on the main thread
   * @param metricName Name of the metric to calculate
   * @param options Additional options for the calculation
   * @returns Result of the metric calculation
   */
  private calculateSpecificMetricOnMainThread(metricName: string, options: any = {}): any {
    switch (metricName) {
      case 'degreeCentrality':
        return this.calculateDegreeCentralitySync();
      case 'betweennessCentrality':
        return this.calculateBetweennessCentralitySync();
      case 'closenessCentrality':
        return this.calculateClosenessCentralitySync();
      case 'clusteringCoefficient':
        return this.calculateClusteringCoefficientSync();
      case 'eigenvectorCentrality':
        return this.calculateEigenvectorCentralitySync(options.iterations);
      case 'communities':
        return this.detectClustersSync();
      case 'bottlenecks':
        return AdvancedMetrics.identifyBottlenecks(this.mapData, this.adjacencyList);
      case 'collaborationOpportunities':
        return AdvancedMetrics.findCollaborationOpportunities(this.mapData, this.adjacencyList);
      default:
        throw new Error(`Unknown metric: ${metricName}`);
    }
  }
  
  // Synchronous implementations of metrics for main thread fallback
  
  /**
   * Calculate degree centrality (synchronous version)
   */
  private calculateDegreeCentralitySync(): Record<string, number> {
    const result: Record<string, number> = {};
    const n = this.mapData.nodes.length;
    
    // Skip normalization if there's only one node
    const normalizationFactor = n > 1 ? 1 / (n - 1) : 0;
    
    Object.entries(this.adjacencyList).forEach(([nodeId, neighbors]) => {
      // Normalize by dividing by (n-1) so values are between 0 and 1
      result[nodeId] = neighbors.length * normalizationFactor;
    });
    
    return result;
  }
  
  /**
   * Calculate betweenness centrality (synchronous version)
   */
  private calculateBetweennessCentralitySync(): Record<string, number> {
    const result: Record<string, number> = {};
    const nodeIds = Object.keys(this.adjacencyList);
    
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
        const nodesOnShortestPaths = this.findNodesOnShortestPaths(source, target);
        
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
   * Calculate closeness centrality (synchronous version)
   */
  private calculateClosenessCentralitySync(): Record<string, number> {
    const result: Record<string, number> = {};
    const nodeIds = Object.keys(this.adjacencyList);
    
    nodeIds.forEach(source => {
      const distances = this.calculateShortestPaths(source);
      
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
   * Calculate clustering coefficient (synchronous version)
   */
  private calculateClusteringCoefficientSync(): Record<string, number> {
    const result: Record<string, number> = {};
    
    Object.entries(this.adjacencyList).forEach(([nodeId, neighbors]) => {
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
          if (this.adjacencyList[neighbor1].includes(neighbor2)) {
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
   * Calculate eigenvector centrality (synchronous version)
   */
  private calculateEigenvectorCentralitySync(iterations: number = 100): Record<string, number> {
    return AdvancedMetrics.calculateEigenvectorCentrality(
      this.mapData,
      this.adjacencyList,
      iterations
    );
  }
  
  /**
   * Detect clusters using Louvain method (synchronous version)
   */
  private detectClustersSync(): Cluster[] {
    const communityStructure = AdvancedMetrics.detectCommunitiesLouvain(
      this.mapData,
      this.adjacencyList
    );
    
    // Convert to our cluster format
    return Object.entries(communityStructure.communities)
      .map(([communityId, nodeIds], index) => ({
        id: `cluster-${index}`,
        nodeIds,
        score: nodeIds.length
      }));
  }

  /**
   * Helper method to find shortest paths using BFS
   * @param source Source node ID
   * @param target Target node ID
   * @returns Array of node IDs that are on the shortest paths
   */
  private findNodesOnShortestPaths(source: string, target: string): string[] {
    const visited: Record<string, boolean> = {};
    const distance: Record<string, number> = {};
    const predecessor: Record<string, string[]> = {};
    const result = new Set<string>();
    
    // Initialize data structures
    Object.keys(this.adjacencyList).forEach(id => {
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
      
      this.adjacencyList[current].forEach(neighbor => {
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
   * @param source Source node ID
   * @returns Record of node IDs to shortest path distances
   */
  private calculateShortestPaths(source: string): Record<string, number> {
    const distances: Record<string, number> = {};
    const visited: Record<string, boolean> = {};
    
    // Initialize distances
    Object.keys(this.adjacencyList).forEach(id => {
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
      
      this.adjacencyList[current].forEach(neighbor => {
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          distances[neighbor] = distances[current] + 1;
          queue.push(neighbor);
        }
      });
    }
    
    return distances;
  }
}

export default AnalyticsEngine;