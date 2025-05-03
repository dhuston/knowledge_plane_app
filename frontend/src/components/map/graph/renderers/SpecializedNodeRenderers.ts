/**
 * SpecializedNodeRenderers.ts
 * Specialized renderers for different node types to enhance visualization
 */
import { NodeDisplayData } from 'sigma/types';
import { MapNodeTypeEnum } from '../../../../types/map';
import { createNodeRenderer } from './NodeRenderer';

// Base renderer with common functionality
const baseRenderer = createNodeRenderer();

/**
 * User Node Renderer
 * - Circle shape with profile-like visualization
 * - Shows availability status indicator
 */
export const createUserNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    // Add user-specific visualization
    const x = data.x;
    const y = data.y;
    
    // Draw user status indicator (e.g., online/offline)
    if (data.status) {
      // Draw status dot at the bottom right
      context.beginPath();
      context.arc(
        x + size * 0.7, 
        y + size * 0.7, 
        size * 0.3, 
        0, 
        Math.PI * 2
      );
      
      // Status color
      if (data.status === 'online') {
        context.fillStyle = '#4CAF50'; // Green for online
      } else if (data.status === 'away') {
        context.fillStyle = '#FFC107'; // Yellow for away
      } else {
        context.fillStyle = '#9E9E9E'; // Grey for offline
      }
      
      context.fill();
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 1;
      context.stroke();
    }
    
    return true;
  };
};

/**
 * Team Node Renderer
 * - Diamond shape with member count visualization
 * - Shows team size through visual elements
 */
export const createTeamNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    // Extract team data
    const x = data.x;
    const y = data.y;
    const memberCount = data.memberCount as number;
    
    if (memberCount && !isNaN(memberCount)) {
      // Draw member count indicator circles arranged in a pattern
      const maxCircles = Math.min(8, memberCount); // Show max 8 circles
      const circleSize = size * 0.2;
      const radius = size * 0.7;
      
      for (let i = 0; i < maxCircles; i++) {
        const angle = (i / maxCircles) * Math.PI * 2;
        const circleX = x + Math.cos(angle) * radius;
        const circleY = y + Math.sin(angle) * radius;
        
        context.beginPath();
        context.arc(circleX, circleY, circleSize, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        context.fill();
      }
      
      // If more members than shown, draw a "+X" indicator
      if (memberCount > maxCircles) {
        context.font = `${size * 0.4}px Arial`;
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`+${memberCount - maxCircles}`, x, y);
      }
    }
    
    return true;
  };
};

/**
 * Project Node Renderer
 * - Square shape with timeline/progress visualization
 * - Shows project status and deadline proximity
 */
export const createProjectNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    const x = data.x;
    const y = data.y;
    const status = data.status as string;
    const progress = data.progress as number;
    
    // If we have progress data (0-100%)
    if (typeof progress === 'number' && !isNaN(progress)) {
      // Draw progress bar
      const barHeight = size * 0.3;
      const barWidth = size * 2;
      const barX = x - barWidth / 2;
      const barY = y + size + barHeight;
      
      // Draw background bar
      context.beginPath();
      context.rect(barX, barY, barWidth, barHeight);
      context.fillStyle = 'rgba(0, 0, 0, 0.2)';
      context.fill();
      
      // Draw progress fill
      context.beginPath();
      context.rect(barX, barY, barWidth * (progress / 100), barHeight);
      
      // Color based on progress
      if (progress < 30) {
        context.fillStyle = '#F44336'; // Red for low progress
      } else if (progress < 70) {
        context.fillStyle = '#FFC107'; // Yellow for medium progress
      } else {
        context.fillStyle = '#4CAF50'; // Green for high progress
      }
      
      context.fill();
    }
    
    // If we have status data
    if (status) {
      // Draw a colored border around the node based on status
      const borderSize = size + 3;
      
      context.beginPath();
      context.rect(
        x - borderSize, 
        y - borderSize, 
        borderSize * 2, 
        borderSize * 2
      );
      context.lineWidth = 3;
      
      // Set color based on status
      switch (status.toLowerCase()) {
        case 'active':
          context.strokeStyle = '#4CAF50'; // Green
          break;
        case 'planning':
          context.strokeStyle = '#2196F3'; // Blue
          break;
        case 'completed':
          context.strokeStyle = '#9C27B0'; // Purple
          break;
        case 'blocked':
          context.strokeStyle = '#F44336'; // Red
          break;
        default:
          context.strokeStyle = '#9E9E9E'; // Grey
      }
      
      context.stroke();
    }
    
    return true;
  };
};

/**
 * Goal Node Renderer
 * - Triangle shape with progress visualization
 * - Shows goal progress and priority
 */
export const createGoalNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    const x = data.x;
    const y = data.y;
    const progress = data.progress as number;
    const priority = data.priority as string; 
    
    // Draw progress circle around the node
    if (typeof progress === 'number' && !isNaN(progress)) {
      const radius = size * 1.3;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * progress / 100);
      const lineWidth = size / 4;
      
      // Draw background circle
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      context.lineWidth = lineWidth;
      context.stroke();
      
      // Draw progress arc
      context.beginPath();
      context.arc(x, y, radius, startAngle, endAngle);
      
      // Color based on progress
      if (progress < 30) {
        context.strokeStyle = '#F44336'; // Red for low progress
      } else if (progress < 70) {
        context.strokeStyle = '#FFC107'; // Yellow for medium progress
      } else {
        context.strokeStyle = '#4CAF50'; // Green for high progress
      }
      
      context.lineWidth = lineWidth;
      context.stroke();
    }
    
    // Draw priority indicator
    if (priority) {
      let priorityColor;
      let prioritySize = size * 0.4;
      
      switch (priority.toLowerCase()) {
        case 'high':
          priorityColor = '#F44336'; // Red
          prioritySize = size * 0.5;
          break;
        case 'medium':
          priorityColor = '#FF9800'; // Orange
          prioritySize = size * 0.4;
          break;
        case 'low':
          priorityColor = '#4CAF50'; // Green
          prioritySize = size * 0.3;
          break;
        default:
          priorityColor = '#9E9E9E'; // Grey
      }
      
      // Draw priority indicator at top of node
      context.beginPath();
      context.moveTo(x, y - size - prioritySize);
      context.lineTo(x + prioritySize, y - size);
      context.lineTo(x - prioritySize, y - size);
      context.closePath();
      
      context.fillStyle = priorityColor;
      context.fill();
    }
    
    return true;
  };
};

/**
 * Knowledge Asset Node Renderer
 * - Circle with document-like visualization
 * - Shows asset type and creation date
 */
export const createKnowledgeAssetNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    const x = data.x;
    const y = data.y;
    const assetType = data.assetType as string;
    
    // Draw asset type indicator
    if (assetType) {
      let iconChar = '?';
      let iconColor = '#9C27B0'; // Purple default
      
      // Set icon based on asset type
      switch (assetType.toLowerCase()) {
        case 'document':
          iconChar = 'D';
          iconColor = '#2196F3'; // Blue
          break;
        case 'presentation':
          iconChar = 'P';
          iconColor = '#FF9800'; // Orange
          break;
        case 'spreadsheet':
          iconChar = 'S';
          iconColor = '#4CAF50'; // Green
          break;
        case 'image':
          iconChar = 'I';
          iconColor = '#F44336'; // Red
          break;
        case 'video':
          iconChar = 'V';
          iconColor = '#9C27B0'; // Purple
          break;
        case 'research':
          iconChar = 'R';
          iconColor = '#009688'; // Teal
          break;
      }
      
      // Draw icon background
      context.beginPath();
      context.arc(x, y, size * 0.6, 0, Math.PI * 2);
      context.fillStyle = iconColor;
      context.fill();
      
      // Draw icon text
      context.font = `bold ${size * 0.7}px Arial`;
      context.fillStyle = '#FFFFFF';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(iconChar, x, y);
    }
    
    return true;
  };
};

/**
 * Department Node Renderer
 * - Large diamond with organizational structure visualization
 */
export const createDepartmentNodeRenderer = () => {
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Call base renderer first
    baseRenderer(context, data, size);
    
    const x = data.x;
    const y = data.y;
    const teamCount = data.teamCount as number;
    
    // Draw team count if available
    if (teamCount && !isNaN(teamCount)) {
      context.font = `bold ${size * 0.5}px Arial`;
      context.fillStyle = '#FFFFFF';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(teamCount.toString(), x, y);
      
      // Draw hierarchical lines to represent organizational structure
      // These are decorative and don't represent actual connections
      const lineLength = size * 1.5;
      
      context.beginPath();
      context.moveTo(x, y - lineLength / 2);
      context.lineTo(x, y + lineLength / 2);
      context.moveTo(x - lineLength / 2, y);
      context.lineTo(x + lineLength / 2, y);
      
      context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      context.lineWidth = 1;
      context.stroke();
    }
    
    return true;
  };
};

/**
 * Factory function to create specialized renderers by node type
 */
export const createSpecializedNodeRenderer = () => {
  // Create individual specialized renderers
  const userRenderer = createUserNodeRenderer();
  const teamRenderer = createTeamNodeRenderer();
  const projectRenderer = createProjectNodeRenderer();
  const goalRenderer = createGoalNodeRenderer();
  const knowledgeAssetRenderer = createKnowledgeAssetNodeRenderer();
  const departmentRenderer = createDepartmentNodeRenderer();
  
  // Return a renderer that delegates based on node type
  return (context: CanvasRenderingContext2D, data: NodeDisplayData, size: number) => {
    // Get node type from data
    const nodeType = data.type as MapNodeTypeEnum;
    
    // Select the appropriate renderer based on node type
    switch (nodeType) {
      case MapNodeTypeEnum.USER:
        return userRenderer(context, data, size);
      case MapNodeTypeEnum.TEAM:
        return teamRenderer(context, data, size);
      case MapNodeTypeEnum.PROJECT:
        return projectRenderer(context, data, size);
      case MapNodeTypeEnum.GOAL:
        return goalRenderer(context, data, size);
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return knowledgeAssetRenderer(context, data, size);
      case MapNodeTypeEnum.DEPARTMENT:
        return departmentRenderer(context, data, size);
      default:
        // Fall back to base renderer for unknown types
        return baseRenderer(context, data, size);
    }
  };
};