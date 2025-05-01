import { describe, it, expect, beforeEach } from 'vitest';
import { 
  Workspace,
  WorkspaceType,
  WorkspaceMember,
  WorkspaceSettings,
  WorkspaceCustomization
} from '../../frontend/src/models/workspace/Workspace';

describe('Workspace Model', () => {
  let testWorkspace: Workspace;
  
  beforeEach(() => {
    testWorkspace = {
      id: 'ws-123',
      name: 'Test Workspace',
      description: 'Test workspace description',
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
      isArchived: false
    };
  });
  
  it('should create a valid workspace with required properties', () => {
    expect(testWorkspace).toBeDefined();
    expect(testWorkspace.id).toBe('ws-123');
    expect(testWorkspace.name).toBe('Test Workspace');
    expect(testWorkspace.type).toBe(WorkspaceType.TEAM);
  });
  
  it('should validate workspace types', () => {
    expect(() => {
      testWorkspace.type = WorkspaceType.TEAM;
    }).not.toThrow();
    
    expect(() => {
      testWorkspace.type = WorkspaceType.PROJECT;
    }).not.toThrow();
    
    expect(() => {
      testWorkspace.type = WorkspaceType.RESEARCH;
    }).not.toThrow();
  });
  
  it('should manage workspace members', () => {
    const member: WorkspaceMember = {
      id: 'user-456',
      role: 'editor',
      joinedAt: new Date()
    };
    
    testWorkspace.members.push(member);
    expect(testWorkspace.members.length).toBe(1);
    expect(testWorkspace.members[0].id).toBe('user-456');
  });
  
  it('should update workspace settings', () => {
    testWorkspace.settings.isPublic = true;
    testWorkspace.settings.allowGuests = true;
    
    expect(testWorkspace.settings.isPublic).toBeTruthy();
    expect(testWorkspace.settings.allowGuests).toBeTruthy();
  });
  
  it('should update workspace customization', () => {
    testWorkspace.customization.theme = 'dark';
    testWorkspace.customization.layout = 'compact';
    
    expect(testWorkspace.customization.theme).toBe('dark');
    expect(testWorkspace.customization.layout).toBe('compact');
  });
  
  it('should archive and unarchive workspace', () => {
    expect(testWorkspace.isArchived).toBeFalsy();
    
    testWorkspace.isArchived = true;
    expect(testWorkspace.isArchived).toBeTruthy();
    
    testWorkspace.isArchived = false;
    expect(testWorkspace.isArchived).toBeFalsy();
  });
});