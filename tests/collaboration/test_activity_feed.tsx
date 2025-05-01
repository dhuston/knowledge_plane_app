import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../../frontend/src/components/collaboration/ActivityFeed';
import { ActivityItem } from '../../frontend/src/models/workspace/TeamWorkspace';

describe('ActivityFeed Component', () => {
  const mockActivities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'document-edit',
      userId: 'user-123',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      data: {
        documentId: 'doc-123',
        title: 'Project Plan'
      }
    },
    {
      id: 'act-2',
      type: 'comment-add',
      userId: 'user-456',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      data: {
        documentId: 'doc-123',
        commentId: 'comment-123'
      }
    },
    {
      id: 'act-3',
      type: 'member-add',
      userId: 'user-123',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      data: {
        memberName: 'Alice Smith',
        memberId: 'user-789'
      }
    }
  ];
  
  it('should render the activity feed with items', () => {
    render(<ActivityFeed activities={mockActivities} workspaceId="ws-123" />);
    
    // Check that the header is rendered
    expect(screen.getByText('Activity Feed')).toBeDefined();
    
    // Check that all activities are rendered
    expect(screen.getByText('user-123')).toBeDefined();
    expect(screen.getByText('edited document "Project Plan"')).toBeDefined();
    expect(screen.getByText('user-456')).toBeDefined();
    expect(screen.getByText('commented on "document"')).toBeDefined();
    expect(screen.getByText('added Alice Smith to the workspace')).toBeDefined();
  });
  
  it('should render an empty state when there are no activities', () => {
    render(<ActivityFeed activities={[]} workspaceId="ws-123" />);
    
    expect(screen.getByText('No recent activity')).toBeDefined();
  });
  
  it('should display relative time correctly', () => {
    render(<ActivityFeed activities={mockActivities} workspaceId="ws-123" />);
    
    // Check for the rendered relative times
    expect(screen.getByText('2 hours ago')).toBeDefined();
    expect(screen.getByText('25 minutes ago')).toBeDefined();
    expect(screen.getByText('3 days ago')).toBeDefined();
  });
  
  it('should not render the load more button when there are few activities', () => {
    render(<ActivityFeed activities={mockActivities} workspaceId="ws-123" />);
    
    const loadMoreButton = screen.queryByText('Load More');
    expect(loadMoreButton).toBeNull();
  });
  
  it('should render the load more button when there are many activities', () => {
    // Create an array of 15 activities
    const manyActivities: ActivityItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: `act-${i}`,
      type: 'document-edit',
      userId: `user-${i}`,
      timestamp: new Date(),
      data: {
        documentId: `doc-${i}`,
        title: `Document ${i}`
      }
    }));
    
    render(<ActivityFeed activities={manyActivities} workspaceId="ws-123" />);
    
    const loadMoreButton = screen.queryByText('Load More');
    expect(loadMoreButton).toBeDefined();
  });
});