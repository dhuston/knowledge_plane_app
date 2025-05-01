import React, { FC } from 'react';
import { WorkspaceType } from '../../models/workspace/Workspace';
import { BsPeople, BsKanban, BsBook, BsPerson, BsFileText, BsCalendar } from 'react-icons/bs';

interface WorkspaceHeaderProps {
  title: string;
  description: string;
  workspaceType: WorkspaceType;
}

const WorkspaceHeader: FC<WorkspaceHeaderProps> = ({ 
  title, 
  description, 
  workspaceType 
}) => {
  // Get the appropriate icon for the workspace type
  const getWorkspaceIcon = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return <BsPeople className="workspace-icon" />;
      case WorkspaceType.PROJECT:
        return <BsKanban className="workspace-icon" />;
      case WorkspaceType.RESEARCH:
        return <BsBook className="workspace-icon" />;
      case WorkspaceType.PERSONAL:
        return <BsPerson className="workspace-icon" />;
      case WorkspaceType.DOCUMENT:
        return <BsFileText className="workspace-icon" />;
      case WorkspaceType.MEETING:
        return <BsCalendar className="workspace-icon" />;
      default:
        return <BsPeople className="workspace-icon" />;
    }
  };

  // Get color class based on workspace type
  const getColorClass = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return 'workspace-header-team';
      case WorkspaceType.PROJECT:
        return 'workspace-header-project';
      case WorkspaceType.RESEARCH:
        return 'workspace-header-research';
      case WorkspaceType.PERSONAL:
        return 'workspace-header-personal';
      case WorkspaceType.DOCUMENT:
        return 'workspace-header-document';
      case WorkspaceType.MEETING:
        return 'workspace-header-meeting';
      default:
        return 'workspace-header-team';
    }
  };

  // Get type label
  const getTypeLabel = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return 'Team Workspace';
      case WorkspaceType.PROJECT:
        return 'Project Workspace';
      case WorkspaceType.RESEARCH:
        return 'Research Workspace';
      case WorkspaceType.PERSONAL:
        return 'Personal Workspace';
      case WorkspaceType.DOCUMENT:
        return 'Document Collaboration';
      case WorkspaceType.MEETING:
        return 'Meeting Workspace';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className={`workspace-header ${getColorClass()}`}>
      <div className="workspace-header-content">
        <div className="workspace-header-icon">
          {getWorkspaceIcon()}
        </div>
        <div className="workspace-header-text">
          <h1 className="workspace-title">{title}</h1>
          <p className="workspace-description">{description}</p>
        </div>
        <div className="workspace-type-badge">
          {getTypeLabel()}
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;