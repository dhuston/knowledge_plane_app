import { Workspace, WorkspaceType, createWorkspace } from '../models/workspace/Workspace';
import { createTeamWorkspace, TeamWorkspace } from '../models/workspace/TeamWorkspace';
import { createProjectWorkspace, ProjectWorkspace } from '../models/workspace/ProjectWorkspace';
import { createResearchWorkspace, ResearchWorkspace } from '../models/workspace/ResearchWorkspace';
import { createDocumentWorkspace, DocumentWorkspace } from '../models/workspace/DocumentWorkspace';
import { createMeetingWorkspace, MeetingWorkspace } from '../models/workspace/MeetingWorkspace';

/**
 * Service class for managing workspaces
 * In a real application, this would make API calls to a backend server
 */
class WorkspaceService {
  // In-memory workspace storage simulating a database
  private workspaces = new Map<string, Workspace>();
  
  /**
   * Creates a new workspace based on the specified type
   * @param name Workspace name
   * @param description Workspace description
   * @param type Workspace type
   * @param createdBy User ID of creator
   * @param ownerId Owner ID (user or team)
   * @returns The created workspace
   */
  async createWorkspace(
    name: string,
    description: string,
    type: WorkspaceType,
    createdBy: string,
    ownerId: string,
    additionalParams: Record<string, any> = {}
  ): Promise<Workspace> {
    let workspace: Workspace;
    
    switch (type) {
      case WorkspaceType.TEAM:
        workspace = createTeamWorkspace(
          name,
          description,
          ownerId, // teamId
          createdBy
        );
        break;
      
      case WorkspaceType.PROJECT:
        workspace = createProjectWorkspace(
          name,
          description,
          ownerId, // projectId
          createdBy
        );
        break;
      
      case WorkspaceType.RESEARCH:
        workspace = createResearchWorkspace(
          name,
          description,
          additionalParams.primaryResearchArea || 'General Research',
          createdBy,
          ownerId
        );
        break;
      
      case WorkspaceType.DOCUMENT:
        workspace = createDocumentWorkspace(
          name,
          description,
          additionalParams.documentType || 'richtext',
          additionalParams.initialContent || '',
          createdBy
        );
        break;
      
      case WorkspaceType.MEETING:
        workspace = createMeetingWorkspace(
          name,
          description,
          additionalParams.meetingType || 'regular',
          additionalParams.startTime || null,
          additionalParams.endTime || null,
          additionalParams.location || 'Virtual',
          additionalParams.virtualMeetingUrl,
          createdBy
        );
        break;
        
      default:
        workspace = createWorkspace(
          name, 
          description, 
          type, 
          createdBy, 
          ownerId
        );
        break;
    }
    
    // Store the workspace in our "database"
    this.workspaces.set(workspace.id, workspace);
    
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(workspace);
      }, 200);
    });
  }
  
  /**
   * Gets a workspace by ID
   * @param id Workspace ID
   * @returns The workspace if found, null otherwise
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        const workspace = this.workspaces.get(id) || null;
        resolve(workspace);
      }, 100);
    });
  }
  
  /**
   * Gets all workspaces for a user
   * @param userId User ID
   * @returns Array of workspaces
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        const userWorkspaces = Array.from(this.workspaces.values()).filter(workspace => 
          workspace.createdBy === userId || 
          workspace.ownerId === userId ||
          workspace.members.some(member => member.id === userId)
        );
        
        resolve(userWorkspaces);
      }, 200);
    });
  }
  
  /**
   * Updates a workspace
   * @param workspace Updated workspace object
   * @returns The updated workspace
   */
  async updateWorkspace(workspace: Workspace): Promise<Workspace> {
    // Ensure the workspace exists
    if (!this.workspaces.has(workspace.id)) {
      throw new Error(`Workspace with ID ${workspace.id} not found`);
    }
    
    // Update the workspace in our "database"
    this.workspaces.set(workspace.id, {
      ...workspace,
      updatedAt: new Date()
    });
    
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.workspaces.get(workspace.id)!);
      }, 150);
    });
  }
  
  /**
   * Deletes a workspace
   * @param id Workspace ID
   * @returns True if deleted, false otherwise
   */
  async deleteWorkspace(id: string): Promise<boolean> {
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        const result = this.workspaces.delete(id);
        resolve(result);
      }, 150);
    });
  }
  
  /**
   * Archives a workspace
   * @param id Workspace ID
   * @returns The archived workspace
   */
  async archiveWorkspace(id: string): Promise<Workspace> {
    const workspace = this.workspaces.get(id);
    
    if (!workspace) {
      throw new Error(`Workspace with ID ${id} not found`);
    }
    
    const updatedWorkspace: Workspace = {
      ...workspace,
      isArchived: true,
      updatedAt: new Date()
    };
    
    this.workspaces.set(id, updatedWorkspace);
    
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(updatedWorkspace);
      }, 150);
    });
  }
  
  /**
   * Gets workspaces associated with a map entity
   * @param entityType Entity type (user, team, project, etc.)
   * @param entityId Entity ID
   * @returns Array of workspaces associated with the entity
   */
  async getWorkspacesByMapEntity(entityType: string, entityId: string): Promise<Workspace[]> {
    // Simulate async call
    return new Promise(resolve => {
      setTimeout(() => {
        const entityWorkspaces = Array.from(this.workspaces.values()).filter(workspace => {
          // Check if this workspace is associated with the entity
          if (workspace.ownerId === entityId) {
            return true;
          }
          
          // For team workspaces, check if the entity is a member
          if (workspace.type === WorkspaceType.TEAM) {
            const teamWorkspace = workspace as TeamWorkspace;
            if (teamWorkspace.teamId === entityId) {
              return true;
            }
          }
          
          // For project workspaces, check if the entity is related
          if (workspace.type === WorkspaceType.PROJECT) {
            const projectWorkspace = workspace as ProjectWorkspace;
            if (projectWorkspace.projectId === entityId) {
              return true;
            }
          }
          
          return false;
        });
        
        resolve(entityWorkspaces);
      }, 200);
    });
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();