/**
 * NodeRenderer.ts
 * Custom renderer for Sigma.js nodes with enhanced styling and features
 */

import { NodeDisplayData } from 'sigma/types';
import { NodeStyle } from '../styles/MapStyles';

/**
 * Create a node renderer function for sigma.js
 * @param nodeStyles Map of node styles by type
 */
export default function createNodeRenderer(nodeStyles: Record<string, NodeStyle>) {
  return (
    context: CanvasRenderingContext2D,
    data: NodeDisplayData,
    settings: Record<string, any>
  ): boolean => {
    try {
      const { x, y, size, color, label } = data;

      // Check for required attributes
      if (x === undefined || y === undefined || size === undefined) {
        return false;
      }

      // Get node style attributes with fallbacks
      const entityType = data.entityType || 'unknown';
      const shape = data.shape || 'circle';
      const pattern = data.pattern || 'solid';
      const borderColor = data.borderColor || color;
      const borderWidth = data.borderWidth || 0;
      
      // Highlight effect
      const highlighted = data.highlighted || false;
      const progress = typeof data.progress === 'number' ? data.progress : undefined;
      const status = data.status || undefined;
      
      // Base styling
      const pixelRatio = settings.pixelRatio || 1;
      const nodeSize = size;
      
      // Save context state
      context.save();
      
      // Move to the node position
      context.translate(x, y);
      
      // Apply highlight effect if needed
      if (highlighted) {
        // Draw highlight halo
        context.shadowColor = 'rgba(0, 123, 255, 0.5)';
        context.shadowBlur = 12 * pixelRatio;
      }
      
      // Draw the node based on its shape
      switch (shape) {
        case 'square':
          drawSquare(context, nodeSize, color, borderColor, borderWidth);
          break;
        
        case 'diamond':
          drawDiamond(context, nodeSize, color, borderColor, borderWidth);
          break;
          
        case 'triangle':
          drawTriangle(context, nodeSize, color, borderColor, borderWidth);
          break;
          
        case 'circle':
        default:
          drawCircle(context, nodeSize, color, borderColor, borderWidth);
      }
      
      // Apply pattern if needed
      if (pattern && pattern !== 'solid') {
        applyPattern(context, pattern, nodeSize, borderColor);
      }
      
      // Draw progress indicator if available (for goals)
      if (progress !== undefined) {
        drawProgressIndicator(context, nodeSize, progress, data.progressColor || '#48BB78');
      }
      
      // Draw status indicator if available (for projects)
      if (status !== undefined) {
        drawStatusIndicator(context, nodeSize, data.statusColor || '#A0AEC0');
      }
      
      // Draw "collapsed" indicator for team nodes
      if (data.collapsed) {
        drawCollapsedIndicator(context, nodeSize);
      }
      
      // Draw label if specified in settings
      if (settings.renderLabels && label) {
        drawLabel(context, label, nodeSize, highlighted, settings.labelThreshold);
      }
      
      // Restore original context state
      context.restore();
      
      // Signal that we've handled this node
      return true;
    } catch (error) {
      console.error("Error in node renderer:", error);
      return false;
    }
  };
}

/**
 * Draw a circular node
 */
function drawCircle(
  context: CanvasRenderingContext2D, 
  size: number, 
  color: string, 
  borderColor: string, 
  borderWidth: number
): void {
  // Draw the main shape
  context.fillStyle = color;
  context.beginPath();
  context.arc(0, 0, size, 0, Math.PI * 2);
  context.fill();
  
  // Draw border if needed
  if (borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.beginPath();
    context.arc(0, 0, size, 0, Math.PI * 2);
    context.stroke();
  }
}

/**
 * Draw a square node
 */
function drawSquare(
  context: CanvasRenderingContext2D, 
  size: number, 
  color: string, 
  borderColor: string, 
  borderWidth: number
): void {
  // Calculate square dimensions
  const sideLength = size * 1.8; // Adjust for better visual sizing
  const offset = sideLength / 2;
  
  // Draw the main shape
  context.fillStyle = color;
  context.fillRect(-offset, -offset, sideLength, sideLength);
  
  // Draw border if needed
  if (borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(-offset, -offset, sideLength, sideLength);
  }
}

/**
 * Draw a diamond node
 */
function drawDiamond(
  context: CanvasRenderingContext2D, 
  size: number, 
  color: string, 
  borderColor: string, 
  borderWidth: number
): void {
  // Calculate diamond dimensions
  const diagonalSize = size * 2; // Adjust for better visual sizing
  
  // Draw the main shape
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, -diagonalSize);
  context.lineTo(diagonalSize, 0);
  context.lineTo(0, diagonalSize);
  context.lineTo(-diagonalSize, 0);
  context.closePath();
  context.fill();
  
  // Draw border if needed
  if (borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
  }
}

/**
 * Draw a triangle node
 */
function drawTriangle(
  context: CanvasRenderingContext2D, 
  size: number, 
  color: string, 
  borderColor: string, 
  borderWidth: number
): void {
  // Calculate triangle dimensions
  const height = size * 2;
  const width = height * 1.1547; // Equilateral triangle width = height * √3/2
  
  // Draw the main shape
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, -height);
  context.lineTo(width / 2, height / 2);
  context.lineTo(-width / 2, height / 2);
  context.closePath();
  context.fill();
  
  // Draw border if needed
  if (borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
  }
}

/**
 * Apply a pattern fill to a node
 */
function applyPattern(
  context: CanvasRenderingContext2D,
  pattern: string,
  size: number,
  color: string
): void {
  const patternSize = size * 0.8;
  context.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white
  
  switch (pattern) {
    case 'dots':
      // Draw dot pattern
      const dotSize = size * 0.15;
      const dotSpacing = size * 0.4;
      
      for (let x = -patternSize; x <= patternSize; x += dotSpacing) {
        for (let y = -patternSize; y <= patternSize; y += dotSpacing) {
          // Check if dot is inside the shape (approximation)
          if (x*x + y*y <= patternSize*patternSize) {
            context.beginPath();
            context.arc(x, y, dotSize, 0, Math.PI * 2);
            context.fill();
          }
        }
      }
      break;
      
    case 'lines':
      // Draw line pattern
      const lineSpacing = size * 0.4;
      context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      context.lineWidth = size * 0.1;
      
      for (let y = -patternSize; y <= patternSize; y += lineSpacing) {
        context.beginPath();
        context.moveTo(-patternSize, y);
        context.lineTo(patternSize, y);
        context.stroke();
      }
      break;
      
    case 'grid':
      // Draw grid pattern
      const gridSpacing = size * 0.4;
      context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      context.lineWidth = size * 0.08;
      
      // Draw horizontal lines
      for (let y = -patternSize; y <= patternSize; y += gridSpacing) {
        context.beginPath();
        context.moveTo(-patternSize, y);
        context.lineTo(patternSize, y);
        context.stroke();
      }
      
      // Draw vertical lines
      for (let x = -patternSize; x <= patternSize; x += gridSpacing) {
        context.beginPath();
        context.moveTo(x, -patternSize);
        context.lineTo(x, patternSize);
        context.stroke();
      }
      break;
      
    // Default: no pattern
  }
}

/**
 * Draw a progress indicator for goal nodes
 */
function drawProgressIndicator(
  context: CanvasRenderingContext2D,
  size: number,
  progress: number,
  color: string
): void {
  const progressSize = size * 1.4;
  const lineWidth = size * 0.2;
  
  // Ensure progress is between 0-1
  const safeProgress = Math.max(0, Math.min(1, progress));
  
  // Draw progress arc
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.arc(
    0, 
    0, 
    progressSize, 
    -Math.PI / 2, // Start at the top
    -Math.PI / 2 + safeProgress * 2 * Math.PI, // End based on progress
    false // Counter-clockwise
  );
  context.stroke();
}

/**
 * Draw a status indicator for project nodes
 */
function drawStatusIndicator(
  context: CanvasRenderingContext2D,
  size: number,
  color: string
): void {
  const indicatorSize = size * 0.4;
  
  // Draw status dot in the corner
  context.fillStyle = color;
  context.beginPath();
  context.arc(
    size * 0.8,  // Position in the top right
    -size * 0.8, 
    indicatorSize, 
    0, 
    Math.PI * 2
  );
  context.fill();
}

/**
 * Draw a collapsed indicator for team nodes
 */
function drawCollapsedIndicator(
  context: CanvasRenderingContext2D,
  size: number
): void {
  // Draw "+" symbol
  const lineSize = size * 0.7;
  const lineWidth = size * 0.18;
  
  context.strokeStyle = 'white';
  context.lineWidth = lineWidth;
  
  // Horizontal line
  context.beginPath();
  context.moveTo(-lineSize / 2, 0);
  context.lineTo(lineSize / 2, 0);
  context.stroke();
  
  // Vertical line
  context.beginPath();
  context.moveTo(0, -lineSize / 2);
  context.lineTo(0, lineSize / 2);
  context.stroke();
}

/**
 * Draw a node label
 */
function drawLabel(
  context: CanvasRenderingContext2D,
  label: string,
  size: number,
  highlighted: boolean,
  labelThreshold?: number
): void {
  // Skip if below threshold
  if (labelThreshold !== undefined && size < labelThreshold) {
    return;
  }
  
  // Adjust text styling
  const fontSize = highlighted ? Math.max(size * 1.5, 14) : Math.max(size, 12);
  context.font = `${highlighted ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
  context.textAlign = 'center';
  
  // Add text background for better readability
  const textWidth = context.measureText(label).width;
  const padding = fontSize * 0.3;
  
  // Draw background
  context.fillStyle = highlighted ? 'rgba(0, 123, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)';
  context.fillRect(
    -textWidth / 2 - padding,
    size + padding,
    textWidth + padding * 2,
    fontSize + padding,
  );
  
  // Draw text
  context.fillStyle = highlighted ? '#0056b3' : '#333333';
  context.fillText(label, 0, size + fontSize);
}