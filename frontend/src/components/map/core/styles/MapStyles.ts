/**
 * MapStyles.ts
 * Centralized styling configuration for map components
 */

import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../../../types/map';

/**
 * Interface for node style definition
 */
export interface NodeStyle {
  /** Base color for the node */
  color: string;
  /** Base size for the node (before zoom adaptation) */
  baseSize: number;
  /** Border color for the node */
  borderColor: string;
  /** Border width for the node (optional) */
  borderWidth?: number;
  /** Shape for the node rendering (optional) */
  shape?: 'circle' | 'square' | 'diamond' | 'triangle';
  /** Fill pattern for the node (optional) */
  pattern?: 'solid' | 'dots' | 'lines' | 'grid';
}

/**
 * Interface for edge style definition
 */
export interface EdgeStyle {
  /** Color for the edge */
  color: string;
  /** Size/thickness for the edge */
  size: number;
  /** Type of edge rendering */
  type: 'line' | 'arrow' | 'dashed';
  /** Whether edge should be animated */
  animated?: boolean;
}

/**
 * Node style definitions by node type
 */
export const nodeStyles: Record<string, NodeStyle> = {
  [MapNodeTypeEnum.USER]: {
    color: '#4299E1', // blue.400
    baseSize: 10,
    borderColor: '#2B6CB0', // blue.600
    shape: 'circle'
  },
  [MapNodeTypeEnum.TEAM]: {
    color: '#38A169', // green.500
    baseSize: 14,
    borderColor: '#276749', // green.700
    shape: 'square' 
  },
  [MapNodeTypeEnum.PROJECT]: {
    color: '#805AD5', // purple.500
    baseSize: 12,
    borderColor: '#553C9A', // purple.700
    shape: 'diamond'
  },
  [MapNodeTypeEnum.GOAL]: {
    color: '#DD6B20', // orange.500
    baseSize: 12,
    borderColor: '#9C4221', // orange.700
    shape: 'triangle'
  },
  [MapNodeTypeEnum.DEPARTMENT]: {
    color: '#2C7A7B', // teal.600
    baseSize: 16,
    borderColor: '#285E61', // teal.800
    borderWidth: 2,
    shape: 'square'
  },
  [MapNodeTypeEnum.KNOWLEDGE_ASSET]: {
    color: '#B794F4', // purple.300
    baseSize: 8,
    borderColor: '#6B46C1', // purple.600
    shape: 'diamond'
  },
  [MapNodeTypeEnum.TEAM_CLUSTER]: {
    color: '#68D391', // green.300
    baseSize: 18,
    borderColor: '#38A169', // green.500
    borderWidth: 2,
    shape: 'circle',
    pattern: 'dots'
  },
  [MapNodeTypeEnum.UNKNOWN]: {
    color: '#A0AEC0', // gray.400
    baseSize: 10,
    borderColor: '#718096', // gray.500
    shape: 'circle'
  }
};

/**
 * Edge style definitions by edge type
 */
export const edgeStyles: Record<string, EdgeStyle> = {
  [MapEdgeTypeEnum.REPORTS_TO]: {
    color: '#2D3748', // gray.700
    size: 2,
    type: 'arrow',
    animated: false
  },
  [MapEdgeTypeEnum.MEMBER_OF]: {
    color: '#4299E1', // blue.400
    size: 1.5,
    type: 'line',
    animated: false
  },
  [MapEdgeTypeEnum.LEADS]: {
    color: '#38A169', // green.500
    size: 2,
    type: 'arrow',
    animated: false
  },
  [MapEdgeTypeEnum.OWNS]: {
    color: '#805AD5', // purple.500
    size: 2,
    type: 'arrow',
    animated: false
  },
  [MapEdgeTypeEnum.PARTICIPATES_IN]: {
    color: '#805AD5', // purple.500
    size: 1,
    type: 'line',
    animated: false
  },
  [MapEdgeTypeEnum.ALIGNED_TO]: {
    color: '#DD6B20', // orange.500
    size: 1.5,
    type: 'arrow',
    animated: false
  },
  [MapEdgeTypeEnum.PARENT_OF]: {
    color: '#2C7A7B', // teal.600
    size: 2,
    type: 'arrow',
    animated: false
  },
  [MapEdgeTypeEnum.RELATED_TO]: {
    color: '#A0AEC0', // gray.400
    size: 1,
    type: 'line',
    animated: false
  }
};

/**
 * Get edge style based on node types at each end
 * This is used when an explicit edge type is not available
 */
export const getEdgeStyleByNodeTypes = (
  sourceType: MapNodeTypeEnum,
  targetType: MapNodeTypeEnum
): EdgeStyle => {
  // Define common relationships based on source and target types
  if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.TEAM) {
    return edgeStyles[MapEdgeTypeEnum.MEMBER_OF];
  }
  
  if (sourceType === MapNodeTypeEnum.TEAM && targetType === MapNodeTypeEnum.PROJECT) {
    return edgeStyles[MapEdgeTypeEnum.OWNS];
  }
  
  if (sourceType === MapNodeTypeEnum.PROJECT && targetType === MapNodeTypeEnum.GOAL) {
    return edgeStyles[MapEdgeTypeEnum.ALIGNED_TO];
  }
  
  if (sourceType === MapNodeTypeEnum.TEAM && targetType === MapNodeTypeEnum.DEPARTMENT) {
    return edgeStyles[MapEdgeTypeEnum.REPORTS_TO];
  }
  
  if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.PROJECT) {
    return edgeStyles[MapEdgeTypeEnum.PARTICIPATES_IN];
  }
  
  // Default relationship style
  return {
    color: '#CBD5E0', // gray.300
    size: 1,
    type: 'line'
  };
};

/**
 * Calculate adaptive node size based on zoom level
 * Makes nodes appear more stable at different zoom levels
 */
export const getAdaptiveNodeSize = (baseSize: number, zoomLevel: number): number => {
  // Compensate for zoom level - make nodes bigger when zoomed out
  // and smaller when zoomed in for more natural appearance
  const zoomFactor = 1 / Math.sqrt(zoomLevel);
  return baseSize * Math.min(Math.max(zoomFactor, 0.5), 2);
};

/**
 * Color scale for progress visualization
 */
export const getProgressColor = (progress: number): string => {
  // Scale from red (0%) to yellow (50%) to green (100%)
  if (progress < 0.3) {
    return '#F56565'; // red.400
  } else if (progress < 0.7) {
    return '#ECC94B'; // yellow.400
  } else {
    return '#48BB78'; // green.400
  }
};

/**
 * Color for status indicators (projects, tasks)
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'completed' || statusLower === 'done') {
    return '#48BB78'; // green.400
  } else if (statusLower === 'in_progress' || statusLower === 'active') {
    return '#4299E1'; // blue.400
  } else if (statusLower === 'planning') {
    return '#A0AEC0'; // gray.400
  } else if (statusLower === 'blocked' || statusLower === 'at_risk') {
    return '#F56565'; // red.400
  } else if (statusLower === 'on_hold') {
    return '#ECC94B'; // yellow.400
  } else {
    return '#A0AEC0'; // gray.400 (default)
  }
};

/**
 * Default export for style utilities
 */
export default {
  nodeStyles,
  edgeStyles,
  getEdgeStyleByNodeTypes,
  getAdaptiveNodeSize,
  getProgressColor,
  getStatusColor
};