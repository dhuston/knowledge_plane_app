/**
 * graphUtils.ts
 * Utility functions for graph data processing
 */
import type { MapNode, MapEdge, MapNodeTypeEnum } from '../../../../types/map';

export interface ProcessedNode {
  id: string;
  attributes: {
    x: number;
    y: number;
    size: number;
    color: string;
    label: string;
    type: MapNodeTypeEnum;
    shape?: string;
    pattern?: string;
    borderColor?: string;
    borderWidth?: number;
    highlighted?: boolean;
    progress?: number;
    status?: string;
    hidden?: boolean;
    originalApiData?: MapNode;
    [key: string]: any;
  };
}

export interface ProcessedEdge {
  source: string;
  target: string;
  attributes: {
    size: number;
    color: string;
    type?: 'line' | 'arrow' | 'dashed';
    animated?: boolean;
    hidden?: boolean;
    edgeType?: string;
    [key: string]: any;
  };
}

export interface ProcessedGraphData {
  nodes: ProcessedNode[];
  edges: ProcessedEdge[];
}

interface ProcessingOptions {
  zoomLevel?: number;
  selectedNode?: string | null;
  clusterTeams?: boolean;
}

const defaultProcessingOptions: ProcessingOptions = {
  zoomLevel: 1,
  selectedNode: null,
  clusterTeams: false,
};

/**
 * Process raw map data into a format suitable for Sigma rendering
 * 
 * @param nodes Raw node data from API
 * @param edges Raw edge data from API
 * @param options Processing options
 * @returns Processed graph data ready for Sigma rendering
 */
export function processGraphData(
  nodes: MapNode[],
  edges: MapEdge[],
  options: ProcessingOptions = {}
): ProcessedGraphData {
  // Merge options with defaults
  const { zoomLevel, selectedNode, clusterTeams } = {
    ...defaultProcessingOptions,
    ...options,
  };
  
  // Track node types for edge styling
  const nodeTypeMap = new Map<string, MapNodeTypeEnum>();
  
  // Process nodes
  const processedNodes = nodes.map(node => {
    // Store node type for edge processing
    nodeTypeMap.set(node.id, node.type);
    
    // Get node positioning with improved initial layout
    let x, y;
    
    if (node.position?.x !== undefined && node.position?.y !== undefined) {
      // Use provided position if available
      x = node.position.x;
      y = node.position.y;
    } else {
      // Create more structured initial layout based on node type
      // This helps the force-directed algorithm start from a better position
      const angle = Math.random() * Math.PI * 2; // Random angle
      const radius = 100 + Math.random() * 300;  // Varied distance from center
      
      // Position nodes in rough circular clusters by node type
      // Add slight rotation based on node type to separate different entity types
      switch (node.type) {
        case MapNodeTypeEnum.USER:
          x = Math.cos(angle) * radius * 1.2;
          y = Math.sin(angle) * radius * 1.2;
          break;
        case MapNodeTypeEnum.TEAM:
          x = Math.cos(angle + Math.PI/3) * radius * 1.5;
          y = Math.sin(angle + Math.PI/3) * radius * 1.5;
          break;
        case MapNodeTypeEnum.PROJECT:
          x = Math.cos(angle + Math.PI/1.5) * radius * 1.3;
          y = Math.sin(angle + Math.PI/1.5) * radius * 1.3;
          break;
        case MapNodeTypeEnum.GOAL:
          x = Math.cos(angle + Math.PI) * radius * 1.8;
          y = Math.sin(angle + Math.PI) * radius * 1.8;
          break;
        case MapNodeTypeEnum.DEPARTMENT:
          x = Math.cos(angle + Math.PI/6) * radius * 2;
          y = Math.sin(angle + Math.PI/6) * radius * 2;
          break;
        default:
          // Fallback to a more uniform circular layout
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
      }
    }
    
    // Get basic node attributes
    const attributes = {
      x,
      y,
      size: getNodeSize(node, zoomLevel),
      color: getNodeColor(node),
      label: node.label,
      type: node.type,
      borderColor: getBorderColor(node),
      borderWidth: getBorderWidth(node),
      highlighted: node.id === selectedNode,
      shape: getNodeShape(node),
      pattern: getNodePattern(node),
      originalApiData: node,
    };
    
    // Add special attributes based on node type
    if (node.type === MapNodeTypeEnum.GOAL && typeof node.data?.progress === 'number') {
      attributes.progress = node.data.progress;
    }
    
    if (node.type === MapNodeTypeEnum.PROJECT && node.data?.status) {
      attributes.status = node.data.status;
    }
    
    return {
      id: node.id,
      attributes,
    };
  });
  
  // Process edges
  const processedEdges = edges.map((edge, index) => {
    // Get source and target types
    const sourceType = nodeTypeMap.get(edge.source);
    const targetType = nodeTypeMap.get(edge.target);
    
    // Get edge styling
    const { color, size, type, animated } = getEdgeStyling(edge, sourceType, targetType);
    
    return {
      source: edge.source,
      target: edge.target,
      attributes: {
        size,
        color,
        type,
        animated,
        hidden: false,
        edgeType: edge.type,
      }
    };
  });
  
  return {
    nodes: processedNodes,
    edges: processedEdges,
  };
}

/**
 * Calculate node size based on node type and data
 */
function getNodeSize(node: MapNode, zoomLevel: number = 1): number {
  let baseSize = 10; // Default size
  
  // Adjust size based on node type
  switch (node.type) {
    case MapNodeTypeEnum.TEAM:
      baseSize = 14;
      break;
    case MapNodeTypeEnum.PROJECT:
      baseSize = 12;
      break;
    case MapNodeTypeEnum.GOAL:
      baseSize = 12;
      break;
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      baseSize = 10;
      break;
    case MapNodeTypeEnum.DEPARTMENT:
      baseSize = 16;
      break;
    case MapNodeTypeEnum.TEAM_CLUSTER:
      baseSize = 18;
      break;
    default:
      baseSize = 10;
  }
  
  // Adjust size for team nodes based on member count
  if (node.type === MapNodeTypeEnum.TEAM && node.data?.memberCount) {
    const memberCount = Number(node.data.memberCount);
    if (!isNaN(memberCount)) {
      // Scale size slightly based on member count
      baseSize = baseSize + Math.min(Math.log2(memberCount) * 1.5, 6);
    }
  }
  
  // Apply zoom level adjustment
  return baseSize * zoomLevel;
}

/**
 * Get node color based on node type
 */
function getNodeColor(node: MapNode): string {
  switch (node.type) {
    case MapNodeTypeEnum.USER:
      return '#4A90E2';
    case MapNodeTypeEnum.TEAM:
      return '#5CC9F5';
    case MapNodeTypeEnum.PROJECT:
      return '#F5A623';
    case MapNodeTypeEnum.GOAL:
      return '#7ED321';
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return '#9013FE';
    case MapNodeTypeEnum.DEPARTMENT:
      return '#00A2A6';
    case MapNodeTypeEnum.TEAM_CLUSTER:
      return '#5CC9F5';
    default:
      return '#999999';
  }
}

/**
 * Get border color for node
 */
function getBorderColor(node: MapNode): string {
  switch (node.type) {
    case MapNodeTypeEnum.USER:
      return '#2060B0';
    case MapNodeTypeEnum.TEAM:
      return '#3A99D5';
    case MapNodeTypeEnum.PROJECT:
      return '#D58C23';
    case MapNodeTypeEnum.GOAL:
      return '#5E9D21';
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return '#7013DE';
    case MapNodeTypeEnum.DEPARTMENT:
      return '#007A7E';
    case MapNodeTypeEnum.TEAM_CLUSTER:
      return '#3A99D5';
    default:
      return '#777777';
  }
}

/**
 * Get border width for node
 */
function getBorderWidth(node: MapNode): number {
  return 1.5;
}

/**
 * Get node shape based on node type
 */
function getNodeShape(node: MapNode): string {
  switch (node.type) {
    case MapNodeTypeEnum.USER:
      return 'circle';
    case MapNodeTypeEnum.TEAM:
      return 'diamond';
    case MapNodeTypeEnum.PROJECT:
      return 'square';
    case MapNodeTypeEnum.GOAL:
      return 'triangle';
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return 'circle';
    case MapNodeTypeEnum.DEPARTMENT:
      return 'diamond';
    case MapNodeTypeEnum.TEAM_CLUSTER:
      return 'circle';
    default:
      return 'circle';
  }
}

/**
 * Get node pattern based on node type
 */
function getNodePattern(node: MapNode): string {
  switch (node.type) {
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return 'dots';
    case MapNodeTypeEnum.TEAM_CLUSTER:
      return 'rings';
    default:
      return 'solid';
  }
}

/**
 * Get edge styling based on edge type and connecting nodes
 */
function getEdgeStyling(
  edge: MapEdge,
  sourceType?: MapNodeTypeEnum,
  targetType?: MapNodeTypeEnum
): { color: string; size: number; type: 'line' | 'arrow' | 'dashed'; animated: boolean } {
  // Default styling
  const defaultStyle = {
    color: '#AAAAAA',
    size: 1,
    type: 'line' as const,
    animated: false
  };
  
  // If edge has a defined type, use that
  if (edge.type) {
    switch (edge.type) {
      case 'REPORTS_TO':
        return {
          color: '#F15F8D',
          size: 2,
          type: 'arrow',
          animated: false
        };
      case 'MEMBER_OF':
        return {
          color: '#4A90E2',
          size: 2,
          type: 'line',
          animated: false
        };
      case 'LEADS':
        return {
          color: '#FF5252',
          size: 2.5,
          type: 'arrow',
          animated: false
        };
      case 'OWNS':
        return {
          color: '#9013FE',
          size: 2,
          type: 'arrow',
          animated: false
        };
      case 'PARTICIPATES_IN':
        return {
          color: '#4A90E2',
          size: 1.5,
          type: 'line',
          animated: false
        };
      case 'ALIGNED_TO':
        return {
          color: '#7ED321',
          size: 1.5,
          type: 'line',
          animated: false
        };
      case 'PARENT_OF':
        return {
          color: '#F5A623',
          size: 2,
          type: 'arrow',
          animated: false
        };
      case 'RELATED_TO':
        return {
          color: '#AAAAAA',
          size: 1,
          type: 'line',
          animated: false
        };
      default:
        return defaultStyle;
    }
  }
  
  // If no explicit type, infer from node types
  if (sourceType && targetType) {
    // User -> User (reports to)
    if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.USER) {
      return {
        color: '#F15F8D',
        size: 2,
        type: 'arrow',
        animated: false
      };
    }
    
    // User -> Team (member of)
    if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.TEAM) {
      return {
        color: '#4A90E2',
        size: 2,
        type: 'line',
        animated: false
      };
    }
    
    // User -> Project (participates in)
    if (sourceType === MapNodeTypeEnum.USER && targetType === MapNodeTypeEnum.PROJECT) {
      return {
        color: '#4A90E2',
        size: 1.5,
        type: 'line',
        animated: false
      };
    }
    
    // Team -> Project (owns)
    if (sourceType === MapNodeTypeEnum.TEAM && targetType === MapNodeTypeEnum.PROJECT) {
      return {
        color: '#9013FE',
        size: 2,
        type: 'arrow',
        animated: false
      };
    }
    
    // Project -> Goal (aligned to)
    if (sourceType === MapNodeTypeEnum.PROJECT && targetType === MapNodeTypeEnum.GOAL) {
      return {
        color: '#7ED321',
        size: 1.5,
        type: 'line',
        animated: false
      };
    }
  }
  
  return defaultStyle;
}

export default processGraphData;