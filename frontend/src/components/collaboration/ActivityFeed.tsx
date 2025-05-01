import { FC } from 'react';
import { ActivityItem } from '../../models/workspace/TeamWorkspace';

interface ActivityFeedProps {
  activities: ActivityItem[];
  workspaceId: string;
}

/**
 * Component for displaying an activity feed for collaborative workspaces
 */
const ActivityFeed: FC<ActivityFeedProps> = ({ activities, workspaceId }) => {
  // Helper to format relative time
  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'document-edit':
        return '📝';
      case 'document-create':
        return '📄';
      case 'comment-add':
        return '💬';
      case 'member-add':
        return '👤';
      case 'meeting-create':
        return '📅';
      case 'task-create':
        return '✅';
      case 'task-complete':
        return '✔️';
      default:
        return '📎';
    }
  };
  
  // Get activity message based on type and data
  const getActivityMessage = (activity: ActivityItem): string => {
    const { type, data } = activity;
    
    switch (type) {
      case 'document-edit':
        return `edited document "${data.title}"`;
      case 'document-create':
        return `created document "${data.title}"`;
      case 'comment-add':
        return `commented on "${data.documentId ? 'document' : 'discussion'}"`;
      case 'member-add':
        return `added ${data.memberName} to the workspace`;
      case 'meeting-create':
        return `scheduled meeting "${data.title}"`;
      case 'task-create':
        return `created task "${data.title}"`;
      case 'task-complete':
        return `completed task "${data.title}"`;
      default:
        return `performed action on ${type}`;
    }
  };
  
  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h3>Activity Feed</h3>
        <div className="activity-feed-actions">
          <button className="activity-feed-filter">
            <span className="icon">🔍</span> Filter
          </button>
        </div>
      </div>
      
      <div className="activity-items">
        {activities.length === 0 ? (
          <div className="no-activities">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="user-id">{activity.userId}</span>
                  <span className="activity-message">
                    {getActivityMessage(activity)}
                  </span>
                </div>
                <div className="activity-timestamp">
                  {getRelativeTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 10 && (
        <div className="activity-feed-footer">
          <button className="load-more-button">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;