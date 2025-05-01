import { FC } from 'react';
import { WorkspaceType } from '../../models/workspace/Workspace';

interface WorkspaceNavigationProps {
  workspaceType: WorkspaceType;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

/**
 * Component for rendering the workspace navigation sidebar
 */
const WorkspaceNavigation: FC<WorkspaceNavigationProps> = ({
  workspaceType,
  activeSection,
  onSectionChange
}) => {
  // Common navigation sections for all workspace types
  const commonSections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'resources', label: 'Resources', icon: '📚' }
  ];
  
  // Additional sections based on workspace type
  const getTypeSections = () => {
    switch (workspaceType) {
      case WorkspaceType.TEAM:
        return [
          { id: 'goals', label: 'Goals', icon: '🎯' },
          { id: 'calendar', label: 'Calendar', icon: '📅' },
          { id: 'metrics', label: 'Metrics', icon: '📉' }
        ];
      case WorkspaceType.PROJECT:
        return [
          { id: 'tasks', label: 'Tasks', icon: '✅' },
          { id: 'timeline', label: 'Timeline', icon: '⏱️' },
          { id: 'documents', label: 'Documents', icon: '📄' },
          { id: 'discussions', label: 'Discussions', icon: '💬' }
        ];
      case WorkspaceType.RESEARCH:
        return [
          { id: 'methodology', label: 'Methodology', icon: '🧪' },
          { id: 'data', label: 'Data', icon: '📊' },
          { id: 'publications', label: 'Publications', icon: '📝' },
          { id: 'citations', label: 'Citations', icon: '📚' }
        ];
      default:
        return [];
    }
  };
  
  const allSections = [...commonSections, ...getTypeSections()];
  
  return (
    <nav className="workspace-navigation">
      <ul className="workspace-nav-list">
        {allSections.map((section) => (
          <li key={section.id} className="workspace-nav-item">
            <button
              className={`workspace-nav-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
              aria-selected={activeSection === section.id}
            >
              <span className="workspace-nav-icon">{section.icon}</span>
              <span className="workspace-nav-label">{section.label}</span>
            </button>
          </li>
        ))}
      </ul>
      
      <div className="workspace-nav-footer">
        <button className="workspace-nav-settings">
          <span className="workspace-nav-icon">⚙️</span>
          <span className="workspace-nav-label">Settings</span>
        </button>
      </div>
    </nav>
  );
};

export default WorkspaceNavigation;