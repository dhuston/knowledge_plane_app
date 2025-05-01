import React, { FC, useState, useEffect, useMemo } from 'react';
import { PresenceUser } from '../../models/collaboration/PresenceUser';

interface PresenceIndicatorProps {
  users: PresenceUser[];
  compact?: boolean;
  maxDisplayed?: number;
  showStatusColors?: boolean;
}

/**
 * Component for showing real-time user presence in collaborative workspaces
 */
const PresenceIndicator: FC<PresenceIndicatorProps> = ({
  users,
  compact = false,
  maxDisplayed = 5,
  showStatusColors = true
}) => {
  const [visibleUsers, setVisibleUsers] = useState<PresenceUser[]>([]);
  const [overflowCount, setOverflowCount] = useState(0);
  
  // Sort users by status (online first) and update visible users
  // Use memoization to prevent unnecessary recalculations
  const sortedUsers = useMemo(() => {
    const statusPriority = {
      'online': 0,
      'busy': 1,
      'away': 2,
      'offline': 3
    };
    
    return [...users].sort((a, b) => 
      statusPriority[a.status] - statusPriority[b.status]
    );
  }, [users]);
  
  // Update visible users and overflow count when sorted users or max displayed changes
  useEffect(() => {
    setVisibleUsers(sortedUsers.slice(0, maxDisplayed));
    setOverflowCount(Math.max(0, sortedUsers.length - maxDisplayed));
  }, [sortedUsers, maxDisplayed]);
  
  // Get status color for user - memoized to avoid recreating on each render
  const statusColorMap = useMemo(() => ({
    'online': 'presence-status-online',
    'busy': 'presence-status-busy',
    'away': 'presence-status-away',
    'offline': 'presence-status-offline'
  }), []);
  
  const getStatusColor = (status: PresenceUser['status']): string => {
    if (!showStatusColors) return '';
    return statusColorMap[status] || '';
  };
  
  // Format a readable timestamp for last active time - memoized by timestamp
  const formatLastActive = (timestamp?: Date): string => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  // Memoize the count of online users to avoid recalculation
  const onlineCount = useMemo(() => users.filter(u => u.status === 'online').length, [users]);

  // Create user avatar component to reduce repetition
  const UserAvatar = ({ user }: { user: PresenceUser }) => (
    user.avatar ? (
      <img 
        src={user.avatar} 
        alt={user.name} 
        className="presence-avatar" 
        loading="lazy" // Add lazy loading for better performance
      />
    ) : (
      <div className="presence-avatar presence-avatar-default">
        {user.name.substring(0, 1).toUpperCase()}
      </div>
    )
  );
  
  return (
    <div 
      className={`presence-indicator ${compact ? 'presence-indicator-compact' : ''}`}
      aria-label={`User presence: ${onlineCount} online, ${users.length} total`}
    >
      <div className="presence-users" role="list">
        {visibleUsers.map(user => (
          <div 
            key={user.id} 
            className={`presence-user ${getStatusColor(user.status)}`} 
            title={`${user.name} (${user.status}) - Last active: ${formatLastActive(user.lastActive)}`}
            role="listitem"
            aria-label={`${user.name}: ${user.status}`}
          >
            <UserAvatar user={user} />
            
            {!compact && (
              <div className="presence-user-info">
                <span className="presence-user-name">{user.name}</span>
                <span className="presence-status-text">{user.status}</span>
              </div>
            )}
          </div>
        ))}
        
        {overflowCount > 0 && (
          <div 
            className="presence-overflow" 
            title={`${overflowCount} more users`}
            role="listitem"
            aria-label={`${overflowCount} more users`}
          >
            +{overflowCount}
          </div>
        )}
      </div>
      
      {!compact && users.length > 0 && (
        <div className="presence-summary">
          {onlineCount} online
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;