import { FC, ReactNode } from 'react';
import { WorkspaceType } from '../../models/workspace/Workspace';

interface WorkspaceContentProps {
  workspaceId: string;
  workspaceType: WorkspaceType;
  activeSection: string;
  children?: ReactNode;
}

/**
 * Component for rendering the main content area of a workspace based on active section
 */
const WorkspaceContent: FC<WorkspaceContentProps> = ({
  workspaceId,
  workspaceType,
  activeSection,
  children
}) => {
  // Get section title based on active section
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview':
        return 'Workspace Overview';
      case 'activity':
        return 'Recent Activity';
      case 'members':
        return 'Workspace Members';
      case 'resources':
        return 'Workspace Resources';
      case 'goals':
        return 'Team Goals';
      case 'calendar':
        return 'Team Calendar';
      case 'metrics':
        return 'Team Metrics';
      case 'tasks':
        return 'Project Tasks';
      case 'timeline':
        return 'Project Timeline';
      case 'documents':
        return 'Documents';
      case 'discussions':
        return 'Discussions';
      case 'methodology':
        return 'Research Methodology';
      case 'data':
        return 'Research Data';
      case 'publications':
        return 'Publications';
      case 'citations':
        return 'Citations';
      default:
        return 'Workspace Content';
    }
  };
  
  // Get content component based on active section
  // For now, this is just placeholder content
  const getSectionContent = () => {
    // This would be replaced with actual component rendering based on section
    return (
      <div className="workspace-section-placeholder">
        <p>Content for {activeSection} section</p>
        <p>Workspace ID: {workspaceId}</p>
        <p>Workspace Type: {workspaceType}</p>
      </div>
    );
  };
  
  return (
    <div className="workspace-content">
      <div className="workspace-content-header">
        <h2 className="workspace-content-title">{getSectionTitle()}</h2>
        <div className="workspace-content-actions">
          <button className="workspace-action-button">
            <span className="icon">🔍</span> Search
          </button>
          <button className="workspace-action-button primary">
            <span className="icon">➕</span> New
          </button>
        </div>
      </div>
      
      <div className="workspace-content-body">
        {children || getSectionContent()}
      </div>
    </div>
  );
};

export default WorkspaceContent;