/**
 * MapStyles.ts
 * Shared styling logic for map visualizations.
 * This file centralizes styling constants used across different map implementations.
 */

import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../../types/map';
import { palette } from '../../../theme/foundations/colors';

// Node style configuration with visual properties for each node type
export interface NodeStyleProps {
  color: string;      // Main fill color
  baseSize: number;   // Base size in pixels
  borderColor?: string;  // Border color
  borderWidth?: number;  // Border width
  shape?: string;     // Shape: 'circle', 'square', 'diamond', etc.
  icon?: string;      // Optional icon identifier
  pattern?: string;   // Optional pattern: 'solid', 'dashed', 'grid', etc.
}

// Edge style configuration
export interface EdgeStyleProps {
  color: string;      // Line color
  size: number;       // Line thickness
  type: string;       // 'line' or 'arrow'
  animated?: boolean; // Whether the edge should be animated
}

// Entity colors derived from design system and entity.* in colors.ts
export const entityColors = {
  user: palette.entity.user,
  team: palette.entity.team,
  project: palette.entity.project,
  goal: palette.entity.knowledge,
  knowledge_asset: palette.entity.knowledge,
  department: palette.entity.department,
  team_cluster: palette.primary[400],
};

// Status colors for visual indicators
export const statusColors = {
  risk: '#FC8181',     // Red
  blocked: '#FC8181',  // Red
  delay: '#F6AD55',    // Orange
  paused: '#F6AD55',   // Orange
  planning: '#63B3ED', // Blue
  complete: '#68D391', // Green
  'on track': '#68D391', // Green
  default: '#CBD5E0',  // Default gray
};

// Progress indicator colors
export const progressColors = {
  low: '#FC8181',      // Red (0-25%)
  medium: '#F6AD55',   // Orange (25-50%)
  good: '#F6E05E',     // Yellow (50-75%)
  excellent: '#68D391' // Green (75-100%)
};

// Node styles with visual properties for each node type
export const nodeStyles: Record<MapNodeTypeEnum, NodeStyleProps> = {
  [MapNodeTypeEnum.USER]: {
    color: entityColors.user,
    baseSize: 10,
    borderColor: '#2c5282',
    shape: 'circle',       // Users are circles
    pattern: 'solid'
  },
  [MapNodeTypeEnum.TEAM]: {
    color: entityColors.team,
    baseSize: 15,
    borderColor: '#2b6cb0',
    shape: 'diamond',      // Teams are diamonds
    pattern: 'solid'
  },
  [MapNodeTypeEnum.PROJECT]: {
    color: entityColors.project,
    baseSize: 12,
    borderColor: '#c05621',
    shape: 'square',       // Projects are squares
    pattern: 'grid'        // Grid pattern for projects
  },
  [MapNodeTypeEnum.GOAL]: {
    color: entityColors.goal,
    baseSize: 14,
    borderColor: '#2f855a',
    borderWidth: 2,
    shape: 'pentagon',     // Goals are pentagons
    pattern: 'solid'
  },
  [MapNodeTypeEnum.KNOWLEDGE_ASSET]: {
    color: entityColors.knowledge_asset,
    baseSize: 11,
    borderColor: '#6b46c1',
    shape: 'triangle',     // Knowledge assets are triangles
    pattern: 'solid'
  },
  [MapNodeTypeEnum.DEPARTMENT]: {
    color: entityColors.department,
    baseSize: 18,
    borderColor: '#2a4365',
    borderWidth: 2,
    shape: 'hexagon',      // Departments are hexagons
    pattern: 'solid'
  },
  [MapNodeTypeEnum.TEAM_CLUSTER]: {
    color: entityColors.team_cluster,
    baseSize: 16,
    borderColor: '#6b46c1',
    borderWidth: 2,
    shape: 'cloud',        // Team clusters have cloud-like shape
    pattern: 'dashed'      // Dashed pattern for clusters
  }
};

// Edge styles for different relationship types
export const edgeStyles: Record<MapEdgeTypeEnum, EdgeStyleProps> = {
  [MapEdgeTypeEnum.REPORTS_TO]: {
    color: '#F687B3', // Pink
    size: 2,
    type: 'arrow',
  },
  [MapEdgeTypeEnum.MEMBER_OF]: {
    color: '#BEE3F8', // Light blue
    size: 1,
    type: 'line',
  },
  [MapEdgeTypeEnum.LEADS]: {
    color: '#FC8181', // Red
    size: 2,
    type: 'arrow',
  },
  [MapEdgeTypeEnum.OWNS]: {
    color: '#B794F4', // Purple
    size: 2,
    type: 'arrow',
  },
  [MapEdgeTypeEnum.PARTICIPATES_IN]: {
    color: '#90CDF4', // Blue
    size: 1,
    type: 'line',
  },
  [MapEdgeTypeEnum.ALIGNED_TO]: {
    color: '#68D391', // Green
    size: 2,
    type: 'arrow',
  },
  [MapEdgeTypeEnum.PARENT_OF]: {
    color: '#ED8936', // Orange
    size: 3,
    type: 'arrow',
  },
  [MapEdgeTypeEnum.RELATED_TO]: {
    color: '#CBD5E0', // Gray
    size: 1,
    type: 'line',
  },
};

/**
 * Get color based on progress value
 * @param progress Progress value (0-100)
 * @returns Color string 
 */
export function getProgressColor(progress: number): string {
  if (progress < 25) return progressColors.low;
  if (progress < 50) return progressColors.medium;
  if (progress < 75) return progressColors.good;
  return progressColors.excellent;
}

/**
 * Get color based on status text
 * @param status Status string
 * @returns Color string for the status
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('risk') || statusLower.includes('block')) {
    return statusColors.risk;
  } else if (statusLower.includes('delay') || statusLower.includes('paus')) {
    return statusColors.delay;
  } else if (statusLower.includes('plan')) {
    return statusColors.planning;
  } else if (statusLower.includes('complete') || statusLower.includes('track')) {
    return statusColors.complete;
  }
  
  return statusColors.default;
}

/**
 * Helper to get edge style based on relationship between node types
 * @param sourceType Source node type
 * @param targetType Target node type
 * @returns Edge style properties
 */
export function getEdgeStyleByNodeTypes(
  sourceType: MapNodeTypeEnum,
  targetType: MapNodeTypeEnum
): EdgeStyleProps {
  if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.TEAM) {
    return edgeStyles[MapEdgeTypeEnum.MEMBER_OF];
  } else if (sourceType === MapNodeTypeEnum.PROJECT && targetType === MapNodeTypeEnum.GOAL) {
    return edgeStyles[MapEdgeTypeEnum.ALIGNED_TO];
  } else if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.USER) {
    return edgeStyles[MapEdgeTypeEnum.REPORTS_TO];
  }
  
  // Default style if no defined relationship
  return {
    color: '#ccc',
    size: 1,
    type: 'line'
  };
}

/**
 * Calculate node size based on zoom level and base size
 * @param baseSize Base size of the node
 * @param zoomLevel Current zoom level
 * @returns Adjusted node size
 */
export function getAdaptiveNodeSize(baseSize: number, zoomLevel: number): number {
  // Ensure minimum size at low zoom levels
  const minSize = 5;
  
  // Calculate adaptive size (smaller at zoomed out, larger when zoomed in)
  // But within reasonable bounds
  if (zoomLevel < 0.5) {
    return Math.max(baseSize * 0.7, minSize);
  } else if (zoomLevel > 1.5) {
    return baseSize * 1.2;
  }
  
  return baseSize; 
}

// Default export with all map styling elements
export default {
  nodeStyles,
  edgeStyles,
  entityColors,
  statusColors,
  progressColors,
  getProgressColor,
  getStatusColor,
  getEdgeStyleByNodeTypes,
  getAdaptiveNodeSize
};