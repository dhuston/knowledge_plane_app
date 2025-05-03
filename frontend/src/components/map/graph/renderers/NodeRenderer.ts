/**
 * NodeRenderer.ts
 * Custom node renderer for Sigma graph visualization
 */
import { NodeDisplayData } from 'sigma/types';
import { getAdaptiveNodeSize, getProgressColor, getStatusColor } from '../../styles/MapStyles';
import type { MapNodeTypeEnum } from '../../../../types/map';

interface NodeStyle {
  color: string;
  baseSize: number;
  borderColor?: string;
  borderWidth?: number;
  shape?: 'circle' | 'diamond' | 'square' | 'triangle';
  pattern?: 'solid' | 'dots' | 'stripes' | 'rings';
}

// Default node styles by type
const defaultNodeStyles: Record<MapNodeTypeEnum, NodeStyle> = {
  user: {
    color: '#4A90E2',
    baseSize: 10,
    borderColor: '#2060B0',
    shape: 'circle'
  },
  team: {
    color: '#5CC9F5',
    baseSize: 14,
    borderColor: '#3A99D5',
    shape: 'diamond'
  },
  project: {
    color: '#F5A623',
    baseSize: 12,
    borderColor: '#D58C23',
    shape: 'square'
  },
  goal: {
    color: '#7ED321',
    baseSize: 12,
    borderColor: '#5E9D21',
    shape: 'triangle'
  },
  knowledge_asset: {
    color: '#9013FE',
    baseSize: 10,
    borderColor: '#7013DE',
    shape: 'circle',
    pattern: 'dots'
  },
  department: {
    color: '#00A2A6',
    baseSize: 16,
    borderColor: '#007A7E',
    shape: 'diamond'
  },
  team_cluster: {
    color: '#5CC9F5',
    baseSize: 18,
    borderColor: '#3A99D5',
    shape: 'circle',
    pattern: 'rings'
  }
};

/**
 * Factory function to create a custom node renderer
 * @param customStyles Optional custom styles to override defaults
 */
export const createNodeRenderer = (customStyles?: Partial<Record<MapNodeTypeEnum, Partial<NodeStyle>>>) => {
  // Merge custom styles with defaults
  const nodeStyles = { ...defaultNodeStyles };
  if (customStyles) {
    Object.entries(customStyles).forEach(([nodeType, style]) => {
      const type = nodeType as MapNodeTypeEnum;
      if (nodeStyles[type]) {
        nodeStyles[type] = { ...nodeStyles[type], ...style };
      }
    });
  }
  
  // The actual renderer function
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    const x = data.x;
    const y = data.y;
    const color = data.color;
    
    // Apply visual enhancements based on node attributes
    const highlighted = data.highlighted || false;
    const borderColor = data.borderColor || color;
    const borderWidth = data.borderWidth || 1;
    const shape = data.shape || 'circle';
    const pattern = data.pattern || 'solid';
    
    // Scale size based on highlighted state
    const displaySize = highlighted ? size * 1.2 : size;
    
    // Draw node based on shape
    context.fillStyle = color;
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    
    // Begin drawing
    context.beginPath();
    
    switch (shape) {
      case 'diamond':
        context.moveTo(x, y - displaySize);
        context.lineTo(x + displaySize, y);
        context.lineTo(x, y + displaySize);
        context.lineTo(x - displaySize, y);
        break;
      case 'square':
        context.rect(
          x - displaySize,
          y - displaySize,
          displaySize * 2,
          displaySize * 2
        );
        break;
      case 'triangle':
        context.moveTo(x, y - displaySize);
        context.lineTo(x + displaySize, y + displaySize);
        context.lineTo(x - displaySize, y + displaySize);
        break;
      case 'circle':
      default:
        context.arc(x, y, displaySize, 0, Math.PI * 2);
        break;
    }
    
    context.closePath();
    context.fill();
    context.stroke();
    
    // Draw patterns if specified
    if (pattern !== 'solid') {
      context.save();
      context.clip(); // Clip to the node shape
      
      const patternColor = highlighted
        ? borderColor
        : adjustColorBrightness(color, -0.2); // Slightly darker color for pattern
      
      context.strokeStyle = patternColor;
      context.fillStyle = patternColor;
      
      switch (pattern) {
        case 'dots':
          drawDotPattern(context, x, y, displaySize);
          break;
        case 'stripes':
          drawStripePattern(context, x, y, displaySize);
          break;
        case 'rings':
          drawRingPattern(context, x, y, displaySize);
          break;
      }
      
      context.restore();
    }
    
    // Draw progress indicator for goals
    if (data.progress !== undefined) {
      const progress = data.progress as number;
      drawProgressIndicator(context, x, y, displaySize, progress);
    }
    
    // Draw status indicator for projects
    if (data.status !== undefined) {
      const status = data.status as string;
      drawStatusIndicator(context, x, y, displaySize, status);
    }
    
    // Custom label rendering can be added here if needed
    
    return true; // Inform sigma that the node has been draw
  };
};

// Helper function to draw dot pattern
function drawDotPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const dotSize = size / 7;
  const spacing = size / 3;
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue; // Skip center
      
      ctx.beginPath();
      ctx.arc(x + i * spacing, y + j * spacing, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Helper function to draw stripe pattern
function drawStripePattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const stripeWidth = size / 6;
  const totalStripes = 4;
  
  ctx.lineWidth = stripeWidth;
  
  for (let i = -totalStripes / 2; i <= totalStripes / 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - size, y + i * stripeWidth * 2);
    ctx.lineTo(x + size, y + i * stripeWidth * 2);
    ctx.stroke();
  }
}

// Helper function to draw ring pattern
function drawRingPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.lineWidth = size / 5;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

// Helper function to draw progress indicator
function drawProgressIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, progress: number) {
  const radius = size * 1.3;
  const lineWidth = size / 3;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * (progress / 100));
  
  // Draw background circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  // Draw progress arc
  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  ctx.strokeStyle = getProgressColor(progress);
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// Helper function to draw status indicator
function drawStatusIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, status: string) {
  const indicatorSize = size / 2;
  
  ctx.beginPath();
  ctx.arc(x + size, y - size, indicatorSize, 0, Math.PI * 2);
  ctx.fillStyle = getStatusColor(status);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number) {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r + (255 * percent))));
  g = Math.min(255, Math.max(0, Math.round(g + (255 * percent))));
  b = Math.min(255, Math.max(0, Math.round(b + (255 * percent))));
  
  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default createNodeRenderer;