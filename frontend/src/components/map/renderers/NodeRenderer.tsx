/**
 * NodeRenderer.tsx
 * Custom node rendering function for Sigma 
 * Handles different node shapes and styles based on entity type
 * Implements level-of-detail (LOD) rendering for performance
 */

import { MapNodeTypeEnum } from '../../../types/map';
import { NodeStyleProps, getProgressColor, getStatusColor } from '../styles/MapStyles';

// Define LOD levels based on camera ratio
const LOD_LEVELS = {
  HIGH: 0.6, // When zoomed in (ratio < 0.6)
  MEDIUM: 1.4, // Medium zoom (0.6 <= ratio < 1.4)
  LOW: Infinity // Zoomed out (ratio >= 1.4)
};

/**
 * Higher-order function that returns a Sigma node renderer
 * @param nodeStyles Styles configuration for different node types
 * @returns Sigma node renderer function
 */
export const createNodeRenderer = (nodeStyles: Record<MapNodeTypeEnum, NodeStyleProps>) => {
  // Return the actual renderer function used by Sigma
  return (context: CanvasRenderingContext2D, data: any, settings: any): boolean => {
    const size = settings.nodeSize(data);
    const x = data.x;
    const y = data.y;
    const color = data.color || '#999';
    const borderColor = data.borderColor || color;
    const borderWidth = data.borderWidth || 1;
    
    // Get the node's entity type
    const entityType = data.entityType as MapNodeTypeEnum;
    
    // Determine shape from nodeStyles based on entity type
    const entityShape = entityType && nodeStyles[entityType] ? nodeStyles[entityType].shape : 'circle';
    const effectiveShape = entityShape || 'circle';
    
    // Get camera ratio for level-of-detail rendering
    const cameraRatio = settings.cameraRatio || 1;
    
    // Determine LOD level based on camera ratio
    let lodLevel;
    if (cameraRatio < LOD_LEVELS.HIGH) lodLevel = 'HIGH';
    else if (cameraRatio < LOD_LEVELS.MEDIUM) lodLevel = 'MEDIUM';
    else lodLevel = 'LOW';
    
    // Save context state
    context.save();
    
    // LOD optimization: For low detail (zoomed out), use simple shapes
    if (lodLevel === 'LOW') {
      // Use simple circles for all nodes when zoomed out
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, size/2, 0, Math.PI * 2);
      context.closePath();
      context.fill();
      
      // Skip borders and additional details
      context.restore();
      return true;
    }
    
    // Draw shape based on node type with appropriate detail level
    switch(effectiveShape) {
      case 'square':
        // Draw square
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        // Draw with pattern if specified (only at high detail)
        if (lodLevel === 'HIGH' && data.pattern === 'grid') {
          // Create grid pattern
          const patternSize = Math.max(5, size / 4);
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = patternSize;
          patternCanvas.height = patternSize;
          const patternContext = patternCanvas.getContext('2d');
          
          if (patternContext) {
            patternContext.fillStyle = color;
            patternContext.fillRect(0, 0, patternSize, patternSize);
            patternContext.strokeStyle = borderColor;
            patternContext.lineWidth = 0.5;
            patternContext.beginPath();
            patternContext.moveTo(0, 0);
            patternContext.lineTo(patternSize, patternSize);
            patternContext.stroke();
          }
          
          const pattern = context.createPattern(patternCanvas, 'repeat');
          context.fillStyle = pattern || color;
        }
        
        // Draw square
        context.beginPath();
        context.rect(x - size/2, y - size/2, size, size);
        context.fill();
        if (lodLevel !== 'LOW') context.stroke(); // Only draw border at medium and high detail
        break;
        
      case 'diamond':
        // Draw diamond shape
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        context.beginPath();
        context.moveTo(x, y - size/2); // Top point
        context.lineTo(x + size/2, y); // Right point
        context.lineTo(x, y + size/2); // Bottom point
        context.lineTo(x - size/2, y); // Left point
        context.closePath();
        context.fill();
        if (lodLevel !== 'LOW') context.stroke();
        break;
        
      case 'triangle':
        // Draw triangle
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        context.beginPath();
        context.moveTo(x, y - size/2); // Top point
        context.lineTo(x + size/2, y + size/2); // Bottom right
        context.lineTo(x - size/2, y + size/2); // Bottom left
        context.closePath();
        context.fill();
        if (lodLevel !== 'LOW') context.stroke();
        break;
        
      case 'pentagon':
        // Draw pentagon for goals
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        // Draw base pentagon
        context.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x1 = x + size/2 * Math.cos(angle);
          const y1 = y + size/2 * Math.sin(angle);
          if (i === 0) context.moveTo(x1, y1);
          else context.lineTo(x1, y1);
        }
        context.closePath();
        context.fill();
        if (lodLevel !== 'LOW') context.stroke();
        
        // If has progress, draw progress indicator (only at medium/high detail)
        if (lodLevel !== 'LOW' && data.progress !== undefined) {
          const progress = Number(data.progress);
          if (!isNaN(progress)) {
            const progressColor = getProgressColor(progress);
            
            // Draw progress arc
            context.beginPath();
            context.strokeStyle = progressColor;
            context.lineWidth = borderWidth * 1.5;
            context.arc(x, y, size/2 + borderWidth, -Math.PI/2, 
                       -Math.PI/2 + (Math.PI * 2 * progress / 100), false);
            context.stroke();
          }
        }
        break;
        
      case 'hexagon':
        // Draw hexagon for departments
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        context.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const x1 = x + size/2 * Math.cos(angle);
          const y1 = y + size/2 * Math.sin(angle);
          if (i === 0) context.moveTo(x1, y1);
          else context.lineTo(x1, y1);
        }
        context.closePath();
        context.fill();
        if (lodLevel !== 'LOW') context.stroke();
        break;
        
      case 'cloud':
        // Draw cloud-like shape for team clusters
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        // Draw with dashed pattern if specified (only at high detail)
        if (lodLevel === 'HIGH' && data.pattern === 'dashed') {
          context.setLineDash([2, 2]);
        }
        
        // Use simpler cloud shape at medium detail
        if (lodLevel === 'MEDIUM') {
          context.beginPath();
          context.arc(x, y, size/2, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        } else {
          // Full cloud shape at high detail
          const cloudRadius = size / 2;
          context.beginPath();
          context.arc(x - cloudRadius/3, y - cloudRadius/3, cloudRadius/2, 0, Math.PI * 2);
          context.arc(x + cloudRadius/3, y - cloudRadius/3, cloudRadius/2, 0, Math.PI * 2);
          context.arc(x - cloudRadius/2, y + cloudRadius/4, cloudRadius/2, 0, Math.PI * 2);
          context.arc(x + cloudRadius/2, y + cloudRadius/4, cloudRadius/2, 0, Math.PI * 2);
          context.fill();
          if (lodLevel !== 'LOW') context.stroke();
        }
        
        // Reset dash pattern
        context.setLineDash([]);
        break;
        
      case 'circle':
      default:
        // Default to standard circle drawing
        context.fillStyle = color;
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        
        context.beginPath();
        context.arc(x, y, size/2, 0, Math.PI * 2);
        context.closePath();
        context.fill();
        if (lodLevel !== 'LOW') context.stroke();
        
        // For user nodes, add a small indicator in the center (only at high detail)
        if (lodLevel === 'HIGH' && entityType === MapNodeTypeEnum.USER) {
          context.fillStyle = borderColor;
          context.beginPath();
          context.arc(x, y, size/6, 0, Math.PI * 2);
          context.fill();
        }
        
        break;
    }
    
    // For project nodes, add status indicator (only at medium/high detail)
    if (lodLevel !== 'LOW' && data.status) {
      const status = String(data.status).toLowerCase();
      const statusColor = getStatusColor(status);
      
      // Draw status indicator as a small dot in the corner
      context.fillStyle = statusColor;
      context.beginPath();
      context.arc(x + size/2 - borderWidth, y - size/2 + borderWidth, size/5, 0, Math.PI * 2);
      context.fill();
    }
    
    // Add label for high-detail rendering
    if (lodLevel === 'HIGH' && settings.renderLabels && data.label) {
      context.font = '8px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillStyle = '#333';
      context.fillText(data.label, x, y + size/2 + 2, size * 3);
    }
    
    // Restore context state
    context.restore();
    
    // Skip default rendering
    return true;
  };
};

export default createNodeRenderer;