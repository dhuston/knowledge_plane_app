import { Workspace } from '../../models/workspace/Workspace';
import { TeamWorkspace } from '../../models/workspace/TeamWorkspace';
import { ProjectWorkspace } from '../../models/workspace/ProjectWorkspace';

/**
 * Service for handling workspace operations
 * In a real application, this would connect to backend APIs
 */
class WorkspaceService {
  private workspaces: Map<string, Workspace> = new Map();
  
  /**
   * Get a workspace by ID
   * @param id Workspace ID to retrieve
   * @returns The workspace or null if not found
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.workspaces.get(id) || null;
  }
  
  /**
   * Get all workspaces
   * @returns Array of all workspaces
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return Array.from(this.workspaces.values());
  }
  
  /**
   * Create a new workspace
   * @param workspace Workspace to create
   * @returns The created workspace
   */
  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }
  
  /**
   * Update an existing workspace
   * @param workspace Updated workspace data
   * @returns The updated workspace
   */
  async updateWorkspace(workspace: Workspace): Promise<Workspace> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!this.workspaces.has(workspace.id)) {
      throw new Error(`Workspace with ID ${workspace.id} not found`);
    }
    
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }
  
  /**
   * Archive a workspace
   * @param id ID of the workspace to archive
   * @returns The archived workspace
   */
  async archiveWorkspace(id: string): Promise<Workspace> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace with ID ${id} not found`);
    }
    
    const archivedWorkspace = {
      ...workspace,
      isArchived: true,
      updatedAt: new Date()
    };
    
    this.workspaces.set(id, archivedWorkspace);
    return archivedWorkspace;
  }
  
  /**
   * Get team workspaces
   * @returns Array of team workspaces
   */
  async getTeamWorkspaces(): Promise<TeamWorkspace[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return Array.from(this.workspaces.values())
      .filter((workspace): workspace is TeamWorkspace => 
        workspace.type === 'team' && 'teamId' in workspace
      );
  }
  
  /**
   * Get project workspaces
   * @returns Array of project workspaces
   */
  async getProjectWorkspaces(): Promise<ProjectWorkspace[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return Array.from(this.workspaces.values())
      .filter((workspace): workspace is ProjectWorkspace => 
        workspace.type === 'project' && 'projectId' in workspace
      );
  }
  
  /**
   * Get team workspaces for a specific team
   * @param teamId Team ID to filter by
   * @returns Array of team workspaces for the team
   */
  async getTeamWorkspacesByTeamId(teamId: string): Promise<TeamWorkspace[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return Array.from(this.workspaces.values())
      .filter((workspace): workspace is TeamWorkspace => 
        workspace.type === 'team' && 
        'teamId' in workspace && 
        workspace.teamId === teamId
      );
  }
  
  /**
   * Get project workspaces for a specific project
   * @param projectId Project ID to filter by
   * @returns Array of project workspaces for the project
   */
  async getProjectWorkspacesByProjectId(projectId: string): Promise<ProjectWorkspace[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return Array.from(this.workspaces.values())
      .filter((workspace): workspace is ProjectWorkspace => 
        workspace.type === 'project' && 
        'projectId' in workspace && 
        workspace.projectId === projectId
      );
  }
}

export default new WorkspaceService();