import { describe, it, expect } from 'vitest';
import { 
  WorkspaceType,
  createWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceSettings,
  updateWorkspaceCustomization,
  setWorkspaceArchiveStatus
} from '../../frontend/src/models/workspace/Workspace';
import {
  createTeamWorkspace,
  addActivityItem,
  addResource,
  updateMetricConfiguration,
  updateNotificationSettings
} from '../../frontend/src/models/workspace/TeamWorkspace';

describe('Workspace Utilities', () => {
  describe('createWorkspace', () => {
    it('should create a workspace with the provided properties', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      expect(workspace).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.description).toBe('Test Description');
      expect(workspace.type).toBe(WorkspaceType.TEAM);
      expect(workspace.createdBy).toBe('user-123');
      expect(workspace.ownerId).toBe('team-123');
      expect(workspace.members).toEqual([]);
    });
    
    it('should generate a unique ID for each workspace', () => {
      const workspace1 = createWorkspace(
        'Workspace 1',
        'Description 1',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const workspace2 = createWorkspace(
        'Workspace 2',
        'Description 2',
        WorkspaceType.PROJECT,
        'user-123',
        'team-123'
      );
      
      expect(workspace1.id).not.toBe(workspace2.id);
    });
  });
  
  describe('addWorkspaceMember', () => {
    it('should add a member to the workspace', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const updatedWorkspace = addWorkspaceMember(workspace, 'user-456', 'editor');
      
      expect(updatedWorkspace.members.length).toBe(1);
      expect(updatedWorkspace.members[0].id).toBe('user-456');
      expect(updatedWorkspace.members[0].role).toBe('editor');
      expect(updatedWorkspace.members[0].joinedAt).toBeDefined();
    });
    
    it('should not modify the original workspace object', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      addWorkspaceMember(workspace, 'user-456', 'editor');
      
      expect(workspace.members.length).toBe(0);
    });
  });
  
  describe('removeWorkspaceMember', () => {
    it('should remove a member from the workspace', () => {
      let workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      workspace = addWorkspaceMember(workspace, 'user-456', 'editor');
      workspace = addWorkspaceMember(workspace, 'user-789', 'viewer');
      
      const updatedWorkspace = removeWorkspaceMember(workspace, 'user-456');
      
      expect(updatedWorkspace.members.length).toBe(1);
      expect(updatedWorkspace.members[0].id).toBe('user-789');
    });
    
    it('should do nothing if the member is not found', () => {
      let workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      workspace = addWorkspaceMember(workspace, 'user-456', 'editor');
      
      const updatedWorkspace = removeWorkspaceMember(workspace, 'user-999');
      
      expect(updatedWorkspace.members.length).toBe(1);
      expect(updatedWorkspace.members[0].id).toBe('user-456');
    });
  });
  
  describe('updateWorkspaceSettings', () => {
    it('should update workspace settings', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const updatedWorkspace = updateWorkspaceSettings(workspace, {
        isPublic: true,
        allowGuests: true
      });
      
      expect(updatedWorkspace.settings.isPublic).toBeTruthy();
      expect(updatedWorkspace.settings.allowGuests).toBeTruthy();
    });
    
    it('should only update the provided settings', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const updatedWorkspace = updateWorkspaceSettings(workspace, {
        isPublic: true
      });
      
      expect(updatedWorkspace.settings.isPublic).toBeTruthy();
      expect(updatedWorkspace.settings.allowGuests).toBeFalsy();
      expect(updatedWorkspace.settings.notificationsEnabled).toBeTruthy();
    });
  });
  
  describe('updateWorkspaceCustomization', () => {
    it('should update workspace customization', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const updatedWorkspace = updateWorkspaceCustomization(workspace, {
        theme: 'dark',
        layout: 'compact'
      });
      
      expect(updatedWorkspace.customization.theme).toBe('dark');
      expect(updatedWorkspace.customization.layout).toBe('compact');
    });
    
    it('should only update the provided customization properties', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const updatedWorkspace = updateWorkspaceCustomization(workspace, {
        theme: 'dark'
      });
      
      expect(updatedWorkspace.customization.theme).toBe('dark');
      expect(updatedWorkspace.customization.layout).toBe('default');
    });
  });
  
  describe('setWorkspaceArchiveStatus', () => {
    it('should archive a workspace', () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const archivedWorkspace = setWorkspaceArchiveStatus(workspace, true);
      
      expect(archivedWorkspace.isArchived).toBeTruthy();
    });
    
    it('should unarchive a workspace', () => {
      let workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      workspace = setWorkspaceArchiveStatus(workspace, true);
      const unarchivedWorkspace = setWorkspaceArchiveStatus(workspace, false);
      
      expect(unarchivedWorkspace.isArchived).toBeFalsy();
    });
  });
  
  describe('createTeamWorkspace', () => {
    it('should create a team workspace with the provided properties', () => {
      const teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      expect(teamWorkspace).toBeDefined();
      expect(teamWorkspace.name).toBe('Engineering Team');
      expect(teamWorkspace.description).toBe('Workspace for the engineering team');
      expect(teamWorkspace.type).toBe(WorkspaceType.TEAM);
      expect(teamWorkspace.createdBy).toBe('user-123');
      expect(teamWorkspace.ownerId).toBe('team-123');
      expect(teamWorkspace.teamId).toBe('team-123');
      expect(teamWorkspace.activityFeed).toEqual([]);
      expect(teamWorkspace.resources).toEqual([]);
      expect(teamWorkspace.metrics).toEqual([]);
    });
  });
  
  describe('addActivityItem', () => {
    it('should add an activity item to the team workspace', () => {
      const teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      const updatedWorkspace = addActivityItem(
        teamWorkspace,
        'document-edit',
        'user-456',
        {
          documentId: 'doc-123',
          title: 'Updated design document'
        }
      );
      
      expect(updatedWorkspace.activityFeed.length).toBe(1);
      expect(updatedWorkspace.activityFeed[0].type).toBe('document-edit');
      expect(updatedWorkspace.activityFeed[0].userId).toBe('user-456');
      expect(updatedWorkspace.activityFeed[0].data.documentId).toBe('doc-123');
    });
    
    it('should add the activity item to the beginning of the feed', () => {
      let teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      teamWorkspace = addActivityItem(
        teamWorkspace,
        'document-edit',
        'user-456',
        {
          documentId: 'doc-123',
          title: 'Updated design document'
        }
      );
      
      const updatedWorkspace = addActivityItem(
        teamWorkspace,
        'comment-add',
        'user-789',
        {
          documentId: 'doc-123',
          commentId: 'comment-123'
        }
      );
      
      expect(updatedWorkspace.activityFeed.length).toBe(2);
      expect(updatedWorkspace.activityFeed[0].type).toBe('comment-add');
      expect(updatedWorkspace.activityFeed[1].type).toBe('document-edit');
    });
  });
  
  describe('addResource', () => {
    it('should add a resource to the team workspace', () => {
      const teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      const updatedWorkspace = addResource(
        teamWorkspace,
        'link',
        'API Documentation',
        'https://api-docs.example.com',
        undefined,
        'user-456'
      );
      
      expect(updatedWorkspace.resources.length).toBe(1);
      expect(updatedWorkspace.resources[0].type).toBe('link');
      expect(updatedWorkspace.resources[0].name).toBe('API Documentation');
      expect(updatedWorkspace.resources[0].url).toBe('https://api-docs.example.com');
      expect(updatedWorkspace.resources[0].createdBy).toBe('user-456');
    });
  });
  
  describe('updateMetricConfiguration', () => {
    it('should add a new metric configuration', () => {
      const teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      const updatedWorkspace = updateMetricConfiguration(
        teamWorkspace,
        undefined,
        'sprint-velocity',
        'Sprint Velocity',
        true,
        {
          timeRange: 'last-3-sprints',
          visualization: 'line-chart'
        }
      );
      
      expect(updatedWorkspace.metrics.length).toBe(1);
      expect(updatedWorkspace.metrics[0].type).toBe('sprint-velocity');
      expect(updatedWorkspace.metrics[0].name).toBe('Sprint Velocity');
      expect(updatedWorkspace.metrics[0].isVisible).toBeTruthy();
      expect(updatedWorkspace.metrics[0].settings.timeRange).toBe('last-3-sprints');
    });
    
    it('should update an existing metric configuration', () => {
      let teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      teamWorkspace = updateMetricConfiguration(
        teamWorkspace,
        undefined,
        'sprint-velocity',
        'Sprint Velocity',
        true,
        {
          timeRange: 'last-3-sprints',
          visualization: 'line-chart'
        }
      );
      
      const metricId = teamWorkspace.metrics[0].id;
      
      const updatedWorkspace = updateMetricConfiguration(
        teamWorkspace,
        metricId,
        'sprint-velocity',
        'Team Velocity',
        false,
        {
          timeRange: 'last-6-sprints',
          visualization: 'bar-chart'
        }
      );
      
      expect(updatedWorkspace.metrics.length).toBe(1);
      expect(updatedWorkspace.metrics[0].id).toBe(metricId);
      expect(updatedWorkspace.metrics[0].name).toBe('Team Velocity');
      expect(updatedWorkspace.metrics[0].isVisible).toBeFalsy();
      expect(updatedWorkspace.metrics[0].settings.timeRange).toBe('last-6-sprints');
      expect(updatedWorkspace.metrics[0].settings.visualization).toBe('bar-chart');
    });
  });
  
  describe('updateNotificationSettings', () => {
    it('should update the notification settings', () => {
      const teamWorkspace = createTeamWorkspace(
        'Engineering Team',
        'Workspace for the engineering team',
        'team-123',
        'user-123'
      );
      
      const updatedWorkspace = updateNotificationSettings(
        teamWorkspace,
        {
          emailDigest: 'weekly',
          pushNotifications: false
        }
      );
      
      expect(updatedWorkspace.notifications.emailDigest).toBe('weekly');
      expect(updatedWorkspace.notifications.pushNotifications).toBeFalsy();
      expect(updatedWorkspace.notifications.mentionAlerts).toBeTruthy();
      expect(updatedWorkspace.notifications.activityAlerts).toBeTruthy();
    });
  });
});