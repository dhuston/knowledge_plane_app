/**
 * AnalyticsRenderer.ts
 * Custom renderer for visualizing analytics data on the knowledge map
 */

import { NodeMetrics } from '../../analytics/AnalyticsEngine';
import { MapNodeTypeEnum } from '../../../types/map';
import { getProgressColor } from '../styles/MapStyles';

/**
 * Configuration options for analytics visualization
 */
export interface AnalyticsRendererOptions {
  highlightTopNodes: boolean;
  showClusters: boolean;
  metricColorMode: 'degree' | 'betweenness' | 'closeness' | 'clustering';
  highlightThreshold: number;  // Threshold for highlighting (0-1)
  clusterColorMap: Record<string, string>;
}

/**
 * Default options for the analytics renderer
 */
export const DEFAULT_ANALYTICS_OPTIONS: AnalyticsRendererOptions = {
  highlightTopNodes: true,
  showClusters: true,
  metricColorMode: 'betweenness',
  highlightThreshold: 0.7,
  clusterColorMap: {}
};

/**
 * Colors for visualizing different metrics
 */
const METRICS_COLORS = {
  low: '#9DB4FF',     // Light blue
  medium: '#2E5BFF',  // Medium blue
  high: '#0031DA'     // Dark blue
};

/**
 * Higher-order function that returns a Sigma node renderer with analytics visualization
 * @param nodeMetrics Map of node IDs to metric data
 * @param clusters Map of cluster IDs to node arrays
 * @param options Visualization options
 * @returns Sigma node renderer function
 */
export const createAnalyticsRenderer = (
  nodeMetrics: Record<string, NodeMetrics>,
  clusters: Record<string, string[]>,
  options: AnalyticsRendererOptions = DEFAULT_ANALYTICS_OPTIONS
) => {
  // Default cluster colors if not provided
  const CLUSTER_COLORS = [
    '#FF5733', // Red-orange
    '#33FF57', // Green
    '#3357FF', // Blue
    '#F033FF', // Purple
    '#FF33F0', // Pink
    '#33FFF0', // Cyan
    '#F0FF33', // Yellow
  ];
  
  // Generate default cluster colors if not provided
  const clusterColorMap = { ...options.clusterColorMap };
  Object.keys(clusters).forEach((clusterId, index) => {
    if (!clusterColorMap[clusterId]) {
      clusterColorMap[clusterId] = CLUSTER_COLORS[index % CLUSTER_COLORS.length];
    }
  });
  
  // Return actual renderer function
  return (context: CanvasRenderingContext2D, data: any, settings: any): boolean => {
    const nodeId = data.key || data.id;
    const size = settings.nodeSize(data);
    const x = data.x;
    const y = data.y;
    
    const metrics = nodeMetrics[nodeId];
    if (!metrics) {
      return false; // Let default renderer handle this node
    }
    
    // Save context state
    context.save();
    
    // Draw metrics visualization
    const baseColor = data.color || '#999';
    let color = baseColor;
    let highlightNode = false;
    let borderColor = data.borderColor || '#000';
    let borderWidth = data.borderWidth || 1;
    
    // Determine if this node should be highlighted based on metrics
    if (options.highlightTopNodes) {
      const metricValue = options.metricColorMode === 'degree' 
        ? metrics.degreeCentrality 
        : options.metricColorMode === 'betweenness'
          ? metrics.betweennessCentrality
          : options.metricColorMode === 'closeness'
            ? metrics.closenessCentrality
            : metrics.clusteringCoefficient;
      
      // Apply different visual treatment based on metric value
      if (metricValue > options.highlightThreshold) {
        highlightNode = true;
        borderWidth = 3;
        borderColor = METRICS_COLORS.high;
      } else if (metricValue > options.highlightThreshold / 2) {
        borderWidth = 2;
        borderColor = METRICS_COLORS.medium;
      } else {
        borderColor = METRICS_COLORS.low;
      }
    }
    
    // Apply cluster coloring if clusters are enabled
    if (options.showClusters) {
      // Find which cluster this node belongs to
      const nodeCluster = Object.entries(clusters)
        .find(([_, nodeIds]) => nodeIds.includes(nodeId))?.[0];
      
      if (nodeCluster && clusterColorMap[nodeCluster]) {
        // Modify color based on cluster
        if (highlightNode) {
          // For highlighted nodes, use a more intense cluster color
          color = clusterColorMap[nodeCluster];
        } else {
          // For normal nodes, blend with base color
          const clusterColor = clusterColorMap[nodeCluster];
          // Simple color blending - could be improved with proper color math
          color = blendColors(baseColor, clusterColor, 0.7); 
        }
      }
    }
    
    // Draw base node shape
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    
    // Draw border (thicker for important nodes)
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
    
    // Draw visual indicator for metric value
    const selectedMetric = getMetricValueForVisualization(metrics, options.metricColorMode);
    if (selectedMetric > 0.1) {  // Only draw for nodes with significant metric values
      const indicatorSize = size * 0.7 * Math.max(0.2, selectedMetric); // Scale with metric value
      
      // Draw indicator as a semi-transparent circle
      context.beginPath();
      context.arc(x, y, indicatorSize, 0, Math.PI * 2);
      
      const gradientFill = context.createRadialGradient(x, y, 0, x, y, size);
      gradientFill.addColorStop(0, `${borderColor}33`); // 20% opacity
      gradientFill.addColorStop(1, `${borderColor}00`); // 0% opacity
      
      context.fillStyle = gradientFill;
      context.fill();
    }
    
    // Draw centrality indicator (for top nodes)
    if (highlightNode) {
      // Draw a ring around highly central nodes
      context.beginPath();
      context.arc(x, y, size + 4, 0, Math.PI * 2);
      context.strokeStyle = METRICS_COLORS.high;
      context.lineWidth = 1;
      context.setLineDash([2, 2]);
      context.stroke();
      context.setLineDash([]);
    }
    
    // Restore context
    context.restore();
    
    return true; // Skip default rendering
  };
};

/**
 * Helper function to get the right metric value based on selected mode
 */
function getMetricValueForVisualization(
  metrics: NodeMetrics, 
  mode: 'degree' | 'betweenness' | 'closeness' | 'clustering'
): number {
  switch (mode) {
    case 'degree':
      return metrics.degreeCentrality;
    case 'betweenness':
      return metrics.betweennessCentrality;
    case 'closeness':
      return metrics.closenessCentrality;
    case 'clustering':
      return metrics.clusteringCoefficient;
    default:
      return metrics.betweennessCentrality;
  }
}

/**
 * Helper function to blend two hexadecimal colors
 * @param color1 First color in hex format (#RRGGBB)
 * @param color2 Second color in hex format (#RRGGBB)
 * @param ratio Blend ratio (0-1), where 0 is full color1, 1 is full color2
 * @returns Blended color in hex format
 */
function blendColors(color1: string, color2: string, ratio: number): string {
  // Parse hex colors
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
  // Blend colors
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Higher-order function that returns an edge renderer with analytics visualization
 * @param nodeMetrics Map of node IDs to metric data
 * @param clusters Map of cluster IDs to node arrays
 * @returns Sigma edge renderer function
 */
export const createAnalyticsEdgeRenderer = (
  nodeMetrics: Record<string, NodeMetrics>,
  clusters: Record<string, string[]>
) => {
  // Return the actual renderer function used by Sigma
  return (context: CanvasRenderingContext2D, data: any, settings: any): boolean => {
    // Extract key information from the data 
    const edge = data.key || data.id;
    const sourceNode = data.source;
    const targetNode = data.target;
    
    // Default rendering if no metrics available
    if (!nodeMetrics[sourceNode] || !nodeMetrics[targetNode]) {
      return false; // Let default renderer handle this edge
    }
    
    const sourceMetrics = nodeMetrics[sourceNode];
    const targetMetrics = nodeMetrics[targetNode];
    
    // Check if nodes are in the same cluster
    let sameCluster = false;
    Object.values(clusters).forEach(nodeIds => {
      if (nodeIds.includes(sourceNode) && nodeIds.includes(targetNode)) {
        sameCluster = true;
      }
    });
    
    // Adjust edge appearance based on metrics and clusters
    const color = data.color || '#ccc';
    let edgeWidth = data.size || 1;
    let edgeAlpha = 1;
    
    // Make edges between important nodes thicker
    const sourceImportance = Math.max(
      sourceMetrics.betweennessCentrality,
      sourceMetrics.degreeCentrality
    );
    const targetImportance = Math.max(
      targetMetrics.betweennessCentrality,
      targetMetrics.degreeCentrality
    );
    
    const avgImportance = (sourceImportance + targetImportance) / 2;
    
    // Emphasize important connections
    if (avgImportance > 0.7) {
      edgeWidth = 3;
    } else if (avgImportance > 0.4) {
      edgeWidth = 2;
    }
    
    // Emphasize edges within the same cluster
    if (sameCluster) {
      edgeAlpha = 0.9;
    } else {
      edgeAlpha = 0.5; // Make inter-cluster edges more transparent
    }
    
    // Apply the custom rendering
    context.save();
    
    // Draw the edge with calculated styles
    context.beginPath();
    
    // Handle potential differences in data structure
    try {
      // Get start and end coordinates safely
      let sourceX, sourceY, targetX, targetY;
      
      // Try to get coordinates directly from the data object
      if (typeof data.source === 'object' && data.source !== null) {
        // For Sigma v2, coordinates might be in data.source.x or in source-attributes like x
        sourceX = data.source.x ?? data.source_x ?? 0;
        sourceY = data.source.y ?? data.source_y ?? 0;
      } else {
        // Fallback to defaults
        sourceX = 0;
        sourceY = 0;
      }
      
      if (typeof data.target === 'object' && data.target !== null) {
        // Same approach for target
        targetX = data.target.x ?? data.target_x ?? 0;
        targetY = data.target.y ?? data.target_y ?? 0;
      } else {
        // Fallback to defaults
        targetX = 0;
        targetY = 0;
      }
      
      // If we couldn't get coordinates, return false to use default renderer
      if (
        (sourceX === 0 && sourceY === 0) || 
        (targetX === 0 && targetY === 0)
      ) {
        return false;
      }
      
      // Draw the path
      context.moveTo(sourceX, sourceY);
      context.lineTo(targetX, targetY);
      context.strokeStyle = `${color}${Math.round(edgeAlpha * 255).toString(16).padStart(2, '0')}`;
      context.lineWidth = edgeWidth;
      context.stroke();
    } catch (err) {
      // Fallback to default rendering on error
      console.error("Error rendering edge:", err);
      return false; // Let default renderer handle it
    }
    
    context.restore();
    
    return true; // Skip default rendering
  };
};

export default {
  createAnalyticsRenderer,
  createAnalyticsEdgeRenderer
};