/**
 * EdgeRenderer.ts
 * Custom edge renderer for Sigma graph visualization
 */
import { EdgeDisplayData } from 'sigma/types';
import type { MapEdgeTypeEnum } from '../../../../types/map';

interface EdgeStyle {
  color: string;
  size: number;
  type: 'line' | 'arrow' | 'dashed';
  animated?: boolean;
}

// Default edge styles by type
const defaultEdgeStyles: Record<MapEdgeTypeEnum, EdgeStyle> = {
  REPORTS_TO: {
    color: '#F15F8D',
    size: 2,
    type: 'arrow'
  },
  MEMBER_OF: {
    color: '#4A90E2',
    size: 2,
    type: 'line'
  },
  LEADS: {
    color: '#FF5252',
    size: 2.5,
    type: 'arrow'
  },
  OWNS: {
    color: '#9013FE',
    size: 2,
    type: 'arrow'
  },
  PARTICIPATES_IN: {
    color: '#4A90E2',
    size: 1.5,
    type: 'line'
  },
  ALIGNED_TO: {
    color: '#7ED321',
    size: 1.5,
    type: 'line'
  },
  PARENT_OF: {
    color: '#F5A623',
    size: 2,
    type: 'arrow'
  },
  RELATED_TO: {
    color: '#AAAAAA',
    size: 1,
    type: 'line'
  },
};

/**
 * Factory function to create a custom edge renderer
 * @param customStyles Optional custom styles to override defaults
 */
export const createEdgeRenderer = (customStyles?: Partial<Record<MapEdgeTypeEnum, Partial<EdgeStyle>>>) => {
  // Merge custom styles with defaults
  const edgeStyles = { ...defaultEdgeStyles };
  if (customStyles) {
    Object.entries(customStyles).forEach(([edgeType, style]) => {
      const type = edgeType as MapEdgeTypeEnum;
      if (edgeStyles[type]) {
        edgeStyles[type] = { ...edgeStyles[type], ...style };
      }
    });
  }
  
  // Animation variables for animated edges
  let animationFrame = 0;
  let lastTime = 0;
  
  // Update animation frame on each render cycle
  const updateAnimation = () => {
    const now = Date.now();
    if (now - lastTime > 50) { // Update every 50ms
      animationFrame = (animationFrame + 1) % 30; // 30 frames for animation cycle
      lastTime = now;
    }
  };
  
  // The actual renderer function
  return (context: CanvasRenderingContext2D, data: EdgeDisplayData, sourceData: any, targetData: any, size: number) => {
    const color = data.color;
    const edgeType = data.type || 'line';
    const animated = data.animated === true;
    
    // Get positions
    const x1 = sourceData.x;
    const y1 = sourceData.y;
    const x2 = targetData.x;
    const y2 = targetData.y;
    
    // Edge vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const edgeLength = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize vector
    const normX = dx / edgeLength;
    const normY = dy / edgeLength;
    
    // Source and target node radiuses
    const sourceSize = sourceData.size;
    const targetSize = targetData.size;
    
    // Adjusted positions to avoid overlapping with nodes
    const startX = x1 + normX * sourceSize;
    const startY = y1 + normY * sourceSize;
    const endX = x2 - normX * targetSize;
    const endY = y2 - normY * targetSize;
    
    // Begin drawing
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = 'round';
    
    // Update animation if needed
    if (animated) {
      updateAnimation();
    }
    
    // Draw based on edge type
    switch (edgeType) {
      case 'arrow':
        // Draw line
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        
        // Apply animation if needed
        if (animated) {
          context.setLineDash([5, 5]);
          context.lineDashOffset = -animationFrame / 2;
        }
        
        context.stroke();
        
        // Draw arrow head
        const arrowSize = size * 3;
        const arrowX = endX - normX * arrowSize;
        const arrowY = endY - normY * arrowSize;
        
        context.beginPath();
        context.moveTo(endX, endY);
        context.lineTo(
          arrowX + normY * arrowSize / 2,
          arrowY - normX * arrowSize / 2
        );
        context.lineTo(
          arrowX - normY * arrowSize / 2,
          arrowY + normX * arrowSize / 2
        );
        context.closePath();
        context.fillStyle = color;
        context.fill();
        break;
      
      case 'dashed':
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.setLineDash([5, 3]);
        
        // Apply animation if needed
        if (animated) {
          context.lineDashOffset = -animationFrame / 2;
        }
        
        context.stroke();
        context.setLineDash([]);
        break;
      
      case 'line':
      default:
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        
        // Apply animation if needed
        if (animated) {
          const pattern = [size * 2, size * 3];
          context.setLineDash(pattern);
          context.lineDashOffset = -animationFrame;
        }
        
        context.stroke();
        
        // Reset dash if we've set it
        if (animated) {
          context.setLineDash([]);
        }
        break;
    }
    
    return true; // Inform sigma that the edge has been drawn
  };
};

export default createEdgeRenderer;