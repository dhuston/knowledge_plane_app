import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TeamWorkspace, 
  ActivityItem,
  Resource,
  MetricConfiguration,
  NotificationSettings
} from '../../frontend/src/models/workspace/TeamWorkspace';
import { WorkspaceType } from '../../frontend/src/models/workspace/Workspace';

describe('Team Workspace Model', () => {
  let testTeamWorkspace: TeamWorkspace;
  
  beforeEach(() => {
    testTeamWorkspace = {
      id: 'ws-123',
      name: 'Engineering Team Workspace',
      description: 'Workspace for the engineering team',
      type: WorkspaceType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-123',
      ownerId: 'team-123',
      members: [],
      settings: {
        isPublic: false,
        allowGuests: false,
        notificationsEnabled: true
      },
      customization: {
        theme: 'light',
        layout: 'default',
        widgets: []
      },
      isArchived: false,
      teamId: 'team-123',
      activityFeed: [],
      resources: [],
      metrics: [],
      notifications: {
        emailDigest: 'daily',
        pushNotifications: true,
        mentionAlerts: true,
        activityAlerts: true
      }
    };
  });
  
  it('should create a valid team workspace with required properties', () => {
    expect(testTeamWorkspace).toBeDefined();
    expect(testTeamWorkspace.id).toBe('ws-123');
    expect(testTeamWorkspace.name).toBe('Engineering Team Workspace');
    expect(testTeamWorkspace.type).toBe(WorkspaceType.TEAM);
    expect(testTeamWorkspace.teamId).toBe('team-123');
  });
  
  it('should manage activity feed items', () => {
    const activityItem: ActivityItem = {
      id: 'act-123',
      type: 'document-edit',
      userId: 'user-456',
      timestamp: new Date(),
      data: {
        documentId: 'doc-123',
        title: 'Updated design document'
      }
    };
    
    testTeamWorkspace.activityFeed.push(activityItem);
    expect(testTeamWorkspace.activityFeed.length).toBe(1);
    expect(testTeamWorkspace.activityFeed[0].type).toBe('document-edit');
  });
  
  it('should manage team resources', () => {
    const resource: Resource = {
      id: 'res-123',
      type: 'link',
      name: 'API Documentation',
      url: 'https://api-docs.example.com',
      createdAt: new Date(),
      createdBy: 'user-123'
    };
    
    testTeamWorkspace.resources.push(resource);
    expect(testTeamWorkspace.resources.length).toBe(1);
    expect(testTeamWorkspace.resources[0].name).toBe('API Documentation');
  });
  
  it('should manage team metrics', () => {
    const metric: MetricConfiguration = {
      id: 'metric-123',
      type: 'sprint-velocity',
      name: 'Sprint Velocity',
      isVisible: true,
      settings: {
        timeRange: 'last-3-sprints',
        visualization: 'line-chart'
      }
    };
    
    testTeamWorkspace.metrics.push(metric);
    expect(testTeamWorkspace.metrics.length).toBe(1);
    expect(testTeamWorkspace.metrics[0].type).toBe('sprint-velocity');
  });
  
  it('should update notification settings', () => {
    testTeamWorkspace.notifications.emailDigest = 'weekly';
    testTeamWorkspace.notifications.pushNotifications = false;
    
    expect(testTeamWorkspace.notifications.emailDigest).toBe('weekly');
    expect(testTeamWorkspace.notifications.pushNotifications).toBeFalsy();
  });
});