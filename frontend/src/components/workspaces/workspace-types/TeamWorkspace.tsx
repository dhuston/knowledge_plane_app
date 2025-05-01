import { FC } from 'react';
import { TeamWorkspace as TeamWorkspaceModel } from '../../../models/workspace/TeamWorkspace';
import WorkspaceContainer from '../WorkspaceContainer';
import ActivityFeed from '../../collaboration/ActivityFeed';
import MemberList from '../../collaboration/MemberList';

interface TeamWorkspaceProps {
  workspace: TeamWorkspaceModel;
}

/**
 * Team workspace component implementing team-specific functionality
 */
const TeamWorkspace: FC<TeamWorkspaceProps> = ({ workspace }) => {
  // Render different content based on active section
  // This component will be placed inside WorkspaceContent
  const renderSectionContent = (activeSection: string) => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="team-workspace-overview">
            <div className="team-workspace-stats">
              <div className="stats-card">
                <h3>Team Members</h3>
                <div className="stats-value">{workspace.members.length}</div>
              </div>
              <div className="stats-card">
                <h3>Resources</h3>
                <div className="stats-value">{workspace.resources.length}</div>
              </div>
              <div className="stats-card">
                <h3>Recent Activity</h3>
                <div className="stats-value">{workspace.activityFeed.length}</div>
              </div>
            </div>
            <div className="team-workspace-metrics">
              <h3>Team Metrics</h3>
              <div className="metrics-container">
                {workspace.metrics.map(metric => (
                  <div key={metric.id} className="metric-card">
                    <h4>{metric.name}</h4>
                    <div className="metric-visualization">
                      {/* Placeholder for metric visualization */}
                      <div className="metric-placeholder">
                        {metric.type} visualization
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.metrics.length === 0 && (
                  <p className="no-metrics">No metrics configured</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'activity':
        return (
          <ActivityFeed
            activities={workspace.activityFeed}
            workspaceId={workspace.id}
          />
        );
        
      case 'members':
        return (
          <MemberList
            members={workspace.members}
            workspaceId={workspace.id}
          />
        );
        
      case 'resources':
        return (
          <div className="team-workspace-resources">
            <div className="resources-list">
              {workspace.resources.map(resource => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-icon">
                    {resource.type === 'link' ? '🔗' : '📄'}
                  </div>
                  <div className="resource-content">
                    <h4>{resource.name}</h4>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.url}
                      </a>
                    )}
                    <div className="resource-meta">
                      Added on {resource.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="resource-actions">
                    <button className="resource-action-button">
                      <span className="icon">✏️</span>
                    </button>
                    <button className="resource-action-button">
                      <span className="icon">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
              {workspace.resources.length === 0 && (
                <p className="no-resources">No resources added</p>
              )}
            </div>
            <button className="add-resource-button">
              <span className="icon">➕</span> Add Resource
            </button>
          </div>
        );
        
      case 'goals':
        return (
          <div className="team-workspace-goals">
            <p>Team goals content</p>
          </div>
        );
        
      case 'calendar':
        return (
          <div className="team-workspace-calendar">
            <p>Team calendar content</p>
          </div>
        );
        
      case 'metrics':
        return (
          <div className="team-workspace-detailed-metrics">
            <p>Detailed team metrics content</p>
          </div>
        );
        
      default:
        return (
          <div className="team-workspace-default">
            <p>Select a section from the navigation</p>
          </div>
        );
    }
  };

  return (
    <WorkspaceContainer workspace={workspace}>
      {({ activeSection }) => renderSectionContent(activeSection)}
    </WorkspaceContainer>
  );
};

export default TeamWorkspace;