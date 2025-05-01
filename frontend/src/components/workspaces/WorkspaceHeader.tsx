import { FC } from 'react';
import { WorkspaceType } from '../../models/workspace/Workspace';

interface WorkspaceHeaderProps {
  title: string;
  description: string;
  workspaceType: WorkspaceType;
}

/**
 * Component for rendering the workspace header with title, description, and type
 */
const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({ title, description, workspaceType }) => {
  // Get the appropriate icon based on workspace type
  const getWorkspaceIcon = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return '👥';
      case WorkspaceType.PROJECT:
        return '📋';
      case WorkspaceType.RESEARCH:
        return '🔬';
      case WorkspaceType.PERSONAL:
        return '👤';
      default:
        return '📁';
    }
  };
  
  // Get the display name of the workspace type
  const getWorkspaceTypeName = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return 'Team Workspace';
      case WorkspaceType.PROJECT:
        return 'Project Hub';
      case WorkspaceType.RESEARCH:
        return 'Research Space';
      case WorkspaceType.PERSONAL:
        return 'Personal Space';
      default:
        return 'Workspace';
    }
  };
  
  return (
    <header className="workspace-header">
      <div className="workspace-header-container">
        <div className="workspace-header-icon">
          {getWorkspaceIcon()}
        </div>
        
        <div className="workspace-header-content">
          <div className="workspace-header-title-row">
            <h1 className="workspace-header-title">{title}</h1>
            <span className="workspace-header-type">{getWorkspaceTypeName()}</span>
          </div>
          
          <p className="workspace-header-description">{description}</p>
        </div>
        
        <div className="workspace-header-actions">
          <button className="workspace-header-button">
            <span className="icon">⚙️</span> Settings
          </button>
          <button className="workspace-header-button primary">
            <span className="icon">✏️</span> Edit
          </button>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;