import { FC, useState } from 'react';
import { WorkspaceMember } from '../../models/workspace/Workspace';

interface MemberListProps {
  members: WorkspaceMember[];
  workspaceId: string;
}

/**
 * Component for displaying and managing workspace members
 */
const MemberList: FC<MemberListProps> = ({ members, workspaceId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Filter members based on search and role filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === '' || 
      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === null || member.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });
  
  // Get available roles from members
  const availableRoles = Array.from(new Set(members.map(member => member.role)));
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get appropriate role badge style
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'role-badge-owner';
      case 'admin':
        return 'role-badge-admin';
      case 'editor':
        return 'role-badge-editor';
      case 'viewer':
        return 'role-badge-viewer';
      default:
        return 'role-badge-default';
    }
  };
  
  return (
    <div className="member-list">
      <div className="member-list-header">
        <div className="member-search">
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="member-search-input"
          />
        </div>
        
        <div className="member-filters">
          <div className="role-filter">
            <span>Role:</span>
            <select 
              value={selectedRole || ''} 
              onChange={(e) => setSelectedRole(e.target.value || null)}
              className="role-select"
            >
              <option value="">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <button className="invite-button">
            <span className="icon">➕</span> Invite Member
          </button>
        </div>
      </div>
      
      <div className="members-container">
        {filteredMembers.length === 0 ? (
          <div className="no-members">
            <p>No members match your filters</p>
          </div>
        ) : (
          <div className="member-grid">
            {filteredMembers.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-avatar">
                  {member.id.substring(0, 2).toUpperCase()}
                </div>
                <div className="member-details">
                  <h4 className="member-name">{member.id}</h4>
                  <div className="member-role">
                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="member-joined">
                    Joined {formatDate(member.joinedAt)}
                  </div>
                </div>
                <div className="member-actions">
                  <button className="member-action-button">
                    <span className="icon">✉️</span>
                  </button>
                  <button className="member-action-button">
                    <span className="icon">⚙️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberList;