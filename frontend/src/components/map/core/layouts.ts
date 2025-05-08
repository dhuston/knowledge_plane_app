/**
 * Layout engine for Sigma.js graph
 * Provides a standardized way to apply various layout algorithms to the graph
 */

import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { MapNodeTypeEnum } from '../../../types/map';

/**
 * Available layout types
 */
export type LayoutType = 'forceAtlas2' | 'circular' | 'grid' | 'radial' | 'cluster';

/**
 * Options for circular layout
 */
export interface CircularLayoutOptions {
  /** Spacing multiplier between nodes (default: 1.0) */
  spacing?: number;
  /** Whether to group nodes by type (default: true) */
  groupByType?: boolean;
  /** Multiplier for spacing between different type groups (default: 0.8) */
  typeSpacing?: number;
  /** Whether to apply random jitter for more natural look (default: true) */
  jitter?: boolean;
}

/**
 * Options for grid layout
 */
export interface GridLayoutOptions {
  /** Base cell size for grid (default: 800) */
  cellSize?: number;
  /** Whether to group nodes by type (default: true) */
  groupByType?: boolean;
  /** Horizontal spacing between type groups (default: 2.0) */
  horizontalSpacing?: number;
  /** Vertical spacing between type groups (default: 2.0) */
  verticalSpacing?: number;
  /** Whether to apply random jitter for more natural look (default: true) */
  jitter?: boolean;
}

/**
 * Options for radial layout
 */
export interface RadialLayoutOptions {
  /** Base radius for rings (default: 2000) */
  radiusMultiplier?: number;
  /** Whether to prioritize certain node types in center (default: true) */
  prioritizeCentral?: boolean;
  /** Central node types to place in inner rings */
  centralTypes?: string[];
}

/**
 * Options for cluster layout
 */
export interface ClusterLayoutOptions {
  /** Fixed positions for cluster centers by type */
  clusterCenters?: Record<string, {x: number, y: number}>;
  /** Spacing multiplier for clusters (default: 1.0) */
  spacing?: number;
}

/**
 * Options for ForceAtlas2 layout
 */
export interface ForceAtlas2Options {
  /** Number of algorithm iterations (default: 100) */
  iterations?: number;
  /** Advanced settings for forceAtlas2 algorithm */
  settings?: {
    /** Whether to use Barnes-Hut optimization (default: true) */
    barnesHutOptimize?: boolean;
    /** Gravity strength (default: 0.05) */
    gravity?: number;
    /** Scaling ratio (default: 10.0) */
    scalingRatio?: number;
    /** Whether to adjust sizes based on node degree (default: true) */
    adjustSizes?: boolean;
    /** Edge weight influence (default: 0.5) */
    edgeWeightInfluence?: number;
    /** Whether to use stronger gravity (default: false) */
    strongGravityMode?: boolean;
    /** Whether to prevent overlap between nodes (default: false) */
    preventOverlap?: boolean;
    /** Whether linLog mode should be used (default: false) */
    linLogMode?: boolean;
  }
}

/**
 * Combined options for all layout algorithms
 */
export interface LayoutOptions {
  circular?: CircularLayoutOptions;
  grid?: GridLayoutOptions;
  radial?: RadialLayoutOptions;
  cluster?: ClusterLayoutOptions;
  forceAtlas2?: ForceAtlas2Options;
}

/**
 * The layout engine interface
 */
export interface LayoutEngine {
  /** Available layout algorithms */
  layouts: Record<LayoutType, (graph: Graph) => void>;
  /** Apply a layout to the graph */
  applyLayout: (graph: Graph, layoutType: LayoutType) => void;
  /** Get options for a layout */
  getOptions: <T extends keyof LayoutOptions>(layoutType: T) => LayoutOptions[T];
}

/**
 * Create a layout engine with the given options
 */
export function createLayoutEngine(options: LayoutOptions = {}): LayoutEngine {
  // Create a clone of the options with defaults
  const engineOptions: LayoutOptions = {
    circular: {
      spacing: 1.0,
      groupByType: true,
      typeSpacing: 0.8,
      jitter: true,
      ...options.circular
    },
    grid: {
      cellSize: 800,
      groupByType: true,
      horizontalSpacing: 2.0,
      verticalSpacing: 2.0,
      jitter: true,
      ...options.grid
    },
    radial: {
      radiusMultiplier: 2000,
      prioritizeCentral: true,
      centralTypes: ['DEPARTMENT', 'TEAM', 'PROJECT'],
      ...options.radial
    },
    cluster: {
      clusterCenters: {
        [MapNodeTypeEnum.USER]: { x: -4000, y: -3000 },
        [MapNodeTypeEnum.TEAM]: { x: 0, y: -4000 },
        [MapNodeTypeEnum.PROJECT]: { x: 4000, y: 0 },
        [MapNodeTypeEnum.GOAL]: { x: 0, y: 4000 },
        [MapNodeTypeEnum.DEPARTMENT]: { x: -4000, y: 2000 },
        [MapNodeTypeEnum.KNOWLEDGE_ASSET]: { x: 4000, y: -3000 },
        'unknown': { x: 0, y: 0 }
      },
      spacing: 1.0,
      ...options.cluster
    },
    forceAtlas2: {
      iterations: 100,
      settings: {
        barnesHutOptimize: true,
        gravity: 0.05,
        scalingRatio: 10.0,
        adjustSizes: true,
        edgeWeightInfluence: 0.5,
        strongGravityMode: false,
        preventOverlap: false,
        linLogMode: false,
        ...options.forceAtlas2?.settings
      },
      ...options.forceAtlas2
    }
  };

  // Define the layout algorithms
  const layouts: Record<LayoutType, (graph: Graph) => void> = {
    // Circular layout - places nodes in a circle
    circular: (graph: Graph) => {
      try {
        console.log("Applying circular layout");
        const nodes = graph.nodes();
        const count = nodes.length;
        const opts = engineOptions.circular!;
        const radius = Math.sqrt(count) * 500 * opts.spacing!; 
    
        // Group nodes by type if configured
        if (opts.groupByType) {
          const nodesByType: Record<string, string[]> = {};
          nodes.forEach(nodeId => {
            const type = graph.getNodeAttribute(nodeId, 'entityType') || 'unknown';
            if (!nodesByType[type]) nodesByType[type] = [];
            nodesByType[type].push(nodeId);
          });
      
          // Position each type in a separate circle with spacing
          let angleOffset = 0;
          Object.entries(nodesByType).forEach(([type, typeNodes]) => {
            const typeCount = typeNodes.length;
            // Use spacing between different types
            const typeRadius = radius * (1 + Object.keys(nodesByType).indexOf(type) * opts.typeSpacing!);
            
            typeNodes.forEach((nodeId, i) => {
              // Use golden ratio for more even distribution
              const golden = 1.618033988749895;
              const angle = angleOffset + ((i * golden) % typeCount / typeCount) * 2 * Math.PI;
              const x = Math.cos(angle) * typeRadius;
              const y = Math.sin(angle) * typeRadius;
              
              // Set position with jitter if enabled
              if (opts.jitter) {
                const jitter = typeRadius * 0.05;
                graph.setNodeAttribute(nodeId, 'x', x + (Math.random() * jitter - jitter/2));
                graph.setNodeAttribute(nodeId, 'y', y + (Math.random() * jitter - jitter/2));
              } else {
                graph.setNodeAttribute(nodeId, 'x', x);
                graph.setNodeAttribute(nodeId, 'y', y);
              }
            });
            
            angleOffset += 1.5;
          });
        } else {
          // Simple circular layout without type grouping
          nodes.forEach((nodeId, i) => {
            const angle = (i / count) * 2 * Math.PI;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (opts.jitter) {
              const jitter = radius * 0.05;
              graph.setNodeAttribute(nodeId, 'x', x + (Math.random() * jitter - jitter/2));
              graph.setNodeAttribute(nodeId, 'y', y + (Math.random() * jitter - jitter/2));
            } else {
              graph.setNodeAttribute(nodeId, 'x', x);
              graph.setNodeAttribute(nodeId, 'y', y);
            }
          });
        }
        
        console.log("Circular layout completed successfully");
      } catch (err) {
        console.error("Error in circular layout:", err);
        applyFallbackLayout(graph);
      }
    },
    
    // Grid layout - places nodes in a grid
    grid: (graph: Graph) => {
      try {
        console.log("Applying grid layout");
        const nodes = graph.nodes();
        const opts = engineOptions.grid!;
        const cellSize = opts.cellSize!; 
        
        // Group nodes by type if configured
        if (opts.groupByType) {
          const nodesByType: Record<string, string[]> = {};
          nodes.forEach(nodeId => {
            const type = graph.getNodeAttribute(nodeId, 'entityType') || 'unknown';
            if (!nodesByType[type]) nodesByType[type] = [];
            nodesByType[type].push(nodeId);
          });
          
          // Position each type in a separate grid region
          let xOffset = 0;
          let yOffset = 0;
          Object.entries(nodesByType).forEach(([type, typeNodes]) => {
            const typeCount = typeNodes.length;
            const gridSize = Math.ceil(Math.sqrt(typeCount));
            
            typeNodes.forEach((nodeId, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              
              // Position with offset for type
              const baseX = xOffset + col * cellSize;
              const baseY = yOffset + row * cellSize;
              
              // Add jitter for more natural look if enabled
              if (opts.jitter) {
                const jitter = cellSize * 0.1;
                const x = baseX + (Math.random() * jitter - jitter/2);
                const y = baseY + (Math.random() * jitter - jitter/2);
                graph.setNodeAttribute(nodeId, 'x', x);
                graph.setNodeAttribute(nodeId, 'y', y);
              } else {
                graph.setNodeAttribute(nodeId, 'x', baseX);
                graph.setNodeAttribute(nodeId, 'y', baseY);
              }
            });
            
            // Increment offset for next type
            xOffset += gridSize * cellSize * opts.horizontalSpacing!;
            
            // If we're getting too far to the right, start a new row of grids
            if (xOffset > cellSize * 10) {
              xOffset = 0;
              yOffset += gridSize * cellSize * opts.verticalSpacing!;
            }
          });
        } else {
          // Simple grid layout without type grouping
          const count = nodes.length;
          const gridSize = Math.ceil(Math.sqrt(count));
          
          nodes.forEach((nodeId, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            const baseX = col * cellSize - (gridSize * cellSize / 2);
            const baseY = row * cellSize - (gridSize * cellSize / 2);
            
            if (opts.jitter) {
              const jitter = cellSize * 0.1;
              graph.setNodeAttribute(nodeId, 'x', baseX + (Math.random() * jitter - jitter/2));
              graph.setNodeAttribute(nodeId, 'y', baseY + (Math.random() * jitter - jitter/2));
            } else {
              graph.setNodeAttribute(nodeId, 'x', baseX);
              graph.setNodeAttribute(nodeId, 'y', baseY);
            }
          });
        }
        
        console.log("Grid layout completed successfully");
      } catch (err) {
        console.error("Error in grid layout:", err);
        applyFallbackLayout(graph);
      }
    },
    
    // Radial layout - nodes radiate from center by type
    radial: (graph: Graph) => {
      try {
        console.log("Applying radial layout");
        const nodes = graph.nodes();
        const opts = engineOptions.radial!;
        
        // Group nodes by type
        const nodesByType: Record<string, string[]> = {};
        nodes.forEach(nodeId => {
          const type = graph.getNodeAttribute(nodeId, 'entityType') || 'unknown';
          if (!nodesByType[type]) nodesByType[type] = [];
          nodesByType[type].push(nodeId);
        });
        
        if (opts.prioritizeCentral) {
          // Organize types into rings based on priority
          const centralTypes = opts.centralTypes || [
            'DEPARTMENT', 'TEAM', 'PROJECT'
          ];
          
          const rings = [
            centralTypes,
            ['USER', 'GOAL'],
            ['KNOWLEDGE_ASSET', 'unknown']
          ];
          
          // Position by ring
          rings.forEach((ringTypes, ringIndex) => {
            const ringRadius = (ringIndex + 1) * opts.radiusMultiplier!;
            let typeOffset = 0;
            
            ringTypes.forEach(type => {
              if (!nodesByType[type]) return;
              
              const typeNodes = nodesByType[type];
              
              // Golden ratio for more even distribution
              const golden = 1.618033988749895;
              const typeAngleRange = 2 * Math.PI / ringTypes.length;
              const startAngle = typeOffset * typeAngleRange;
              
              typeNodes.forEach((nodeId, i) => {
                const fraction = ((i * golden) % typeNodes.length) / typeNodes.length;
                const angle = startAngle + (fraction * typeAngleRange);
                
                // Add small variations to radius
                const radiusVar = ringRadius * (0.9 + Math.random() * 0.2);
                const x = Math.cos(angle) * radiusVar;
                const y = Math.sin(angle) * radiusVar;
                
                graph.setNodeAttribute(nodeId, 'x', x);
                graph.setNodeAttribute(nodeId, 'y', y);
              });
              
              typeOffset++;
            });
          });
        } else {
          // Simple radial layout without prioritization
          const totalTypes = Object.keys(nodesByType).length;
          let typeIndex = 0;
          
          Object.entries(nodesByType).forEach(([type, typeNodes]) => {
            // Each type gets its own "pie slice"
            const typeAngleStart = (typeIndex / totalTypes) * 2 * Math.PI;
            const typeAngleEnd = ((typeIndex + 1) / totalTypes) * 2 * Math.PI;
            const typeAngleRange = typeAngleEnd - typeAngleStart;
            
            typeNodes.forEach((nodeId, i) => {
              // Calculate position in concentric circles
              const layer = Math.floor(Math.sqrt(i));
              const nodesInLayer = layer * 8;
              const angleOffset = (i - layer * layer) / Math.max(1, nodesInLayer);
              
              const angle = typeAngleStart + angleOffset * typeAngleRange;
              const radius = (layer + 1) * 500;
              
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              graph.setNodeAttribute(nodeId, 'x', x);
              graph.setNodeAttribute(nodeId, 'y', y);
            });
            
            typeIndex++;
          });
        }
        
        console.log("Radial layout completed successfully");
      } catch (err) {
        console.error("Error in radial layout:", err);
        applyFallbackLayout(graph);
      }
    },
    
    // Cluster layout - places nodes in type-specific clusters
    cluster: (graph: Graph) => {
      try {
        console.log("Applying cluster layout");
        const nodes = graph.nodes();
        const opts = engineOptions.cluster!;
        const spacing = opts.spacing!;
        
        // Define cluster centers for each type
        const clusterCenters = opts.clusterCenters!;
        
        // Group nodes by type
        const nodesByType: Record<string, string[]> = {};
        nodes.forEach(nodeId => {
          const type = graph.getNodeAttribute(nodeId, 'entityType') || 'unknown';
          if (!nodesByType[type]) nodesByType[type] = [];
          nodesByType[type].push(nodeId);
        });
        
        // Position nodes in optimized spiral clusters
        Object.entries(nodesByType).forEach(([type, typeNodes]) => {
          const center = clusterCenters[type] || { x: 0, y: 0 };
          const count = typeNodes.length;
          
          // Use golden ratio for more even distribution
          const goldenRatio = 1.618033988749895;
          
          typeNodes.forEach((nodeId, i) => {
            // Calculate radius with spacing - square root creates nicer spiral
            const radius = Math.sqrt(i + 1) * 300 * spacing;
            // Use golden angle for optimal spacing in spiral
            const angle = i * 2 * Math.PI / goldenRatio;
            
            // Add small random variations for more natural look
            const jitter = 40;
            const x = center.x + Math.cos(angle) * radius + (Math.random() * jitter - jitter/2);
            const y = center.y + Math.sin(angle) * radius + (Math.random() * jitter - jitter/2);
            
            graph.setNodeAttribute(nodeId, 'x', x);
            graph.setNodeAttribute(nodeId, 'y', y);
          });
        });
        
        console.log("Cluster layout completed successfully");
      } catch (err) {
        console.error("Error in cluster layout:", err);
        applyFallbackLayout(graph);
      }
    },
    
    // ForceAtlas2 with configurable settings
    forceAtlas2: (graph: Graph) => {
      console.log("Starting ForceAtlas2 layout");
      
      try {
        // Apply ForceAtlas2 algorithm with configurable options
        const opts = engineOptions.forceAtlas2!;
        
        forceAtlas2.assign(graph, {
          iterations: opts.iterations,
          settings: opts.settings
        });
        
        console.log("ForceAtlas2 layout completed");
      } catch (error) {
        console.error("Error applying ForceAtlas2 layout:", error);
        applyFallbackLayout(graph);
      }
    }
  };

  /**
   * Apply a simple fallback layout in case of errors
   */
  function applyFallbackLayout(graph: Graph): void {
    console.log("Applying fallback layout");
    
    const nodes = graph.nodes();
    const count = nodes.length;
    const gridSize = Math.ceil(Math.sqrt(count));
    
    nodes.forEach((nodeId, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Simple grid layout
      graph.setNodeAttribute(nodeId, 'x', col * 200 - (gridSize * 100));
      graph.setNodeAttribute(nodeId, 'y', row * 200 - (gridSize * 100));
    });
    
    console.log("Fallback layout applied");
  }

  return {
    layouts,
    applyLayout: (graph: Graph, layoutType: LayoutType) => {
      try {
        // Check if layout type exists
        if (layouts[layoutType]) {
          layouts[layoutType](graph);
        } else {
          console.warn(`Unknown layout type: ${layoutType}, falling back to cluster`);
          layouts.cluster(graph);
        }
      } catch (error) {
        console.error(`Error applying ${layoutType} layout:`, error);
        applyFallbackLayout(graph);
      }
    },
    getOptions: <T extends keyof LayoutOptions>(layoutType: T): LayoutOptions[T] => {
      return engineOptions[layoutType];
    }
  };
}

// Default layout engine instance
export const defaultLayoutEngine = createLayoutEngine();