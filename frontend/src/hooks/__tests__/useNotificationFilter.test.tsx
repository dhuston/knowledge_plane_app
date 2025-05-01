import { renderHook } from '@testing-library/react-hooks';
import useNotificationFilter from '../useNotificationFilter';
import useNotifications from '../useNotifications';

// Mock useNotifications
jest.mock('../useNotifications');
const mockUseNotifications = useNotifications as jest.Mock;

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'activity',
    severity: 'info',
    title: 'Activity Notification',
    message: 'Activity test message',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'project',
    entity_id: 'project-1',
  },
  {
    id: '2',
    type: 'insight',
    severity: 'warning',
    title: 'Insight Notification',
    message: 'Insight test message',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'team',
    entity_id: 'team-1',
  },
  {
    id: '3',
    type: 'reminder',
    severity: 'critical',
    title: 'Reminder Notification',
    message: 'Reminder test message',
    created_at: new Date().toISOString(),
    read_at: new Date().toISOString(), // Read notification
    dismissed_at: null,
    entity_type: 'project',
    entity_id: 'project-2',
  },
  {
    id: '4',
    type: 'system',
    severity: 'info',
    title: 'System Notification',
    message: 'System test message',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: new Date().toISOString(), // Dismissed notification
    entity_type: 'user',
    entity_id: 'user-1',
  },
];

// Mock nodes
const mockNodes = [
  { id: 'project-1', type: 'project', label: 'Project 1' },
  { id: 'team-1', type: 'team', label: 'Team 1' },
  { id: 'project-2', type: 'project', label: 'Project 2' },
  { id: 'user-1', type: 'user', label: 'User 1' },
  { id: 'project-3', type: 'project', label: 'Project 3' }, // No notifications
];

describe('useNotificationFilter', () => {
  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2
    });
  });

  test('should filter nodes with unread notifications by default', () => {
    const { result } = renderHook(() => useNotificationFilter());
    
    const filteredNodes = result.current.filterNodesWithNotifications(mockNodes);
    expect(filteredNodes).toHaveLength(2); // project-1 and team-1
    expect(filteredNodes[0].id).toBe('project-1');
    expect(filteredNodes[1].id).toBe('team-1');
  });

  test('should include read notifications when includeRead is true', () => {
    const { result } = renderHook(() => useNotificationFilter({ includeRead: true }));
    
    const filteredNodes = result.current.filterNodesWithNotifications(mockNodes);
    expect(filteredNodes).toHaveLength(3); // project-1, team-1, project-2
    
    // Check if project-2 (read notification) is included
    const hasProject2 = filteredNodes.some(node => node.id === 'project-2');
    expect(hasProject2).toBeTruthy();
  });

  test('should include dismissed notifications when includeDismissed is true', () => {
    const { result } = renderHook(() => useNotificationFilter({ includeDismissed: true }));
    
    const filteredNodes = result.current.filterNodesWithNotifications(mockNodes);
    expect(filteredNodes).toHaveLength(3); // project-1, team-1, user-1
    
    // Check if user-1 (dismissed notification) is included
    const hasUser1 = filteredNodes.some(node => node.id === 'user-1');
    expect(hasUser1).toBeTruthy();
  });

  test('should filter by notification type', () => {
    const { result } = renderHook(() => useNotificationFilter({ notificationType: 'insight' }));
    
    const filteredNodes = result.current.filterNodesWithNotifications(mockNodes);
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].id).toBe('team-1');
  });

  test('should filter by notification severity', () => {
    const { result } = renderHook(() => useNotificationFilter({ severity: 'warning' }));
    
    const filteredNodes = result.current.filterNodesWithNotifications(mockNodes);
    expect(filteredNodes).toHaveLength(1);
    expect(filteredNodes[0].id).toBe('team-1');
  });

  test('should check if specific node has notifications', () => {
    const { result } = renderHook(() => useNotificationFilter());
    
    expect(result.current.hasNotifications('project', 'project-1')).toBeTruthy();
    expect(result.current.hasNotifications('project', 'project-3')).toBeFalsy();
  });

  test('should get notification count for a node', () => {
    const { result } = renderHook(() => useNotificationFilter());
    
    expect(result.current.getNotificationCount('project', 'project-1')).toBe(1);
    expect(result.current.getNotificationCount('project', 'project-3')).toBe(0);
  });

  test('should get all notifications for a specific node', () => {
    const { result } = renderHook(() => useNotificationFilter());
    
    const notifications = result.current.getNotificationsForNode('project', 'project-1');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe('1');
  });
});