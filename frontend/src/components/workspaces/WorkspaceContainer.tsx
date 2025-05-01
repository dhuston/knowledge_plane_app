import { FC, ReactNode, useState } from 'react';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceNavigation from './WorkspaceNavigation';
import WorkspaceContent from './WorkspaceContent';
import { Workspace } from '../../models/workspace/Workspace';

interface WorkspaceContainerProps {
  workspace: Workspace;
  children?: ReactNode;
}

/**
 * Container component for workspaces that provides the layout structure
 * and common functionality for all workspace types
 */
const WorkspaceContainer: FC<WorkspaceContainerProps> = ({ workspace, children }) => {
  const [activeSection, setActiveSection] = useState('overview');
  
  return (
    <div className="workspace-container">
      <WorkspaceHeader 
        title={workspace.name} 
        description={workspace.description} 
        workspaceType={workspace.type} 
      />
      
      <div className="workspace-layout">
        <WorkspaceNavigation 
          workspaceType={workspace.type}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <WorkspaceContent 
          workspaceId={workspace.id}
          workspaceType={workspace.type}
          activeSection={activeSection}
        >
          {children}
        </WorkspaceContent>
      </div>
    </div>
  );
};

export default WorkspaceContainer;