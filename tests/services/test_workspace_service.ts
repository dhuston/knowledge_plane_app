import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import workspaceService from '../../frontend/src/services/workspace/workspace_service';
import { createWorkspace, WorkspaceType } from '../../frontend/src/models/workspace/Workspace';
import { createTeamWorkspace } from '../../frontend/src/models/workspace/TeamWorkspace';
import { createProjectWorkspace } from '../../frontend/src/models/workspace/ProjectWorkspace';

// Mock the workspaces map
vi.spyOn(workspaceService as any, 'workspaces', 'get').mockImplementation(() => {
  const map = new Map();
  return map;
});

describe('WorkspaceService', () => {
  // Reset the mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    (workspaceService as any).workspaces = new Map();
  });
  
  // Restore the mocks after all tests
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('getWorkspace', () => {
    it('should return a workspace by ID', async () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      await workspaceService.createWorkspace(workspace);
      
      const result = await workspaceService.getWorkspace(workspace.id);
      expect(result).toEqual(workspace);
    });
    
    it('should return null for non-existent workspace ID', async () => {
      const result = await workspaceService.getWorkspace('non-existent-id');
      expect(result).toBeNull();
    });
  });
  
  describe('getAllWorkspaces', () => {
    it('should return all workspaces', async () => {
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
        'project-123'
      );
      
      await workspaceService.createWorkspace(workspace1);
      await workspaceService.createWorkspace(workspace2);
      
      const results = await workspaceService.getAllWorkspaces();
      expect(results).toHaveLength(2);
      expect(results).toContainEqual(workspace1);
      expect(results).toContainEqual(workspace2);
    });
    
    it('should return an empty array when there are no workspaces', async () => {
      const results = await workspaceService.getAllWorkspaces();
      expect(results).toHaveLength(0);
    });
  });
  
  describe('createWorkspace', () => {
    it('should create and return a workspace', async () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      const result = await workspaceService.createWorkspace(workspace);
      expect(result).toEqual(workspace);
      
      const storedWorkspace = await workspaceService.getWorkspace(workspace.id);
      expect(storedWorkspace).toEqual(workspace);
    });
  });
  
  describe('updateWorkspace', () => {
    it('should update an existing workspace', async () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      await workspaceService.createWorkspace(workspace);
      
      const updatedWorkspace = {
        ...workspace,
        name: 'Updated Workspace',
        description: 'Updated Description',
        updatedAt: new Date()
      };
      
      const result = await workspaceService.updateWorkspace(updatedWorkspace);
      expect(result).toEqual(updatedWorkspace);
      
      const storedWorkspace = await workspaceService.getWorkspace(workspace.id);
      expect(storedWorkspace).toEqual(updatedWorkspace);
    });
    
    it('should throw an error when updating a non-existent workspace', async () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      await expect(workspaceService.updateWorkspace(workspace))
        .rejects.toThrow(`Workspace with ID ${workspace.id} not found`);
    });
  });
  
  describe('archiveWorkspace', () => {
    it('should archive an existing workspace', async () => {
      const workspace = createWorkspace(
        'Test Workspace',
        'Test Description',
        WorkspaceType.TEAM,
        'user-123',
        'team-123'
      );
      
      await workspaceService.createWorkspace(workspace);
      
      const result = await workspaceService.archiveWorkspace(workspace.id);
      expect(result.isArchived).toBe(true);
      expect(result.id).toBe(workspace.id);
      
      const storedWorkspace = await workspaceService.getWorkspace(workspace.id);
      expect(storedWorkspace?.isArchived).toBe(true);
    });
    
    it('should throw an error when archiving a non-existent workspace', async () => {
      await expect(workspaceService.archiveWorkspace('non-existent-id'))
        .rejects.toThrow('Workspace with ID non-existent-id not found');
    });
  });
  
  describe('getTeamWorkspaces', () => {
    it('should return only team workspaces', async () => {
      const teamWorkspace = createTeamWorkspace(
        'Team Workspace',
        'Team Description',
        'team-123',
        'user-123'
      );
      
      const projectWorkspace = createProjectWorkspace(
        'Project Workspace',
        'Project Description',
        'project-123',
        'user-123'
      );
      
      await workspaceService.createWorkspace(teamWorkspace);
      await workspaceService.createWorkspace(projectWorkspace);
      
      const results = await workspaceService.getTeamWorkspaces();
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(teamWorkspace);
    });
  });
  
  describe('getProjectWorkspaces', () => {
    it('should return only project workspaces', async () => {
      const teamWorkspace = createTeamWorkspace(
        'Team Workspace',
        'Team Description',
        'team-123',
        'user-123'
      );
      
      const projectWorkspace = createProjectWorkspace(
        'Project Workspace',
        'Project Description',
        'project-123',
        'user-123'
      );
      
      await workspaceService.createWorkspace(teamWorkspace);
      await workspaceService.createWorkspace(projectWorkspace);
      
      const results = await workspaceService.getProjectWorkspaces();
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(projectWorkspace);
    });
  });
  
  describe('getTeamWorkspacesByTeamId', () => {
    it('should return team workspaces for a specific team', async () => {
      const teamWorkspace1 = createTeamWorkspace(
        'Team 1 Workspace',
        'Team 1 Description',
        'team-123',
        'user-123'
      );
      
      const teamWorkspace2 = createTeamWorkspace(
        'Team 2 Workspace',
        'Team 2 Description',
        'team-456',
        'user-123'
      );
      
      await workspaceService.createWorkspace(teamWorkspace1);
      await workspaceService.createWorkspace(teamWorkspace2);
      
      const results = await workspaceService.getTeamWorkspacesByTeamId('team-123');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(teamWorkspace1);
    });
  });
  
  describe('getProjectWorkspacesByProjectId', () => {
    it('should return project workspaces for a specific project', async () => {
      const projectWorkspace1 = createProjectWorkspace(
        'Project 1 Workspace',
        'Project 1 Description',
        'project-123',
        'user-123'
      );
      
      const projectWorkspace2 = createProjectWorkspace(
        'Project 2 Workspace',
        'Project 2 Description',
        'project-456',
        'user-123'
      );
      
      await workspaceService.createWorkspace(projectWorkspace1);
      await workspaceService.createWorkspace(projectWorkspace2);
      
      const results = await workspaceService.getProjectWorkspacesByProjectId('project-123');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(projectWorkspace1);
    });
  });
});