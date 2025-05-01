/**
 * Workspace model definitions for the collaborative workspace feature
 */

export enum WorkspaceType {
  TEAM = 'team',
  PROJECT = 'project',
  RESEARCH = 'research',
  PERSONAL = 'personal'
}

export interface WorkspaceMember {
  id: string;
  role: string;
  joinedAt: Date;
}

export interface WorkspaceSettings {
  isPublic: boolean;
  allowGuests: boolean;
  notificationsEnabled: boolean;
}

export interface WorkspaceWidget {
  id: string;
  type: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WorkspaceCustomization {
  theme: string;
  layout: string;
  widgets: WorkspaceWidget[];
}

/**
 * Base workspace interface that serves as the foundation for all workspace types
 */
export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
  ownerId: string; // userId or teamId
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  customization: WorkspaceCustomization;
  isArchived: boolean;
}

/**
 * Creates a new workspace with default values
 * @param name Workspace name
 * @param description Workspace description
 * @param type Workspace type
 * @param createdBy User ID of creator
 * @param ownerId User or team ID of the owner
 * @returns A new workspace instance with default settings
 */
export function createWorkspace(
  name: string,
  description: string,
  type: WorkspaceType,
  createdBy: string,
  ownerId: string
): Workspace {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    description,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    ownerId,
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
}

/**
 * Adds a member to a workspace
 * @param workspace The workspace to modify
 * @param userId User ID to add
 * @param role Role to assign to the user
 * @returns The modified workspace
 */
export function addWorkspaceMember(
  workspace: Workspace,
  userId: string,
  role: string
): Workspace {
  const updatedWorkspace = { 
    ...workspace,
    members: [
      ...workspace.members,
      {
        id: userId,
        role,
        joinedAt: new Date()
      }
    ],
    updatedAt: new Date()
  };
  
  return updatedWorkspace;
}

/**
 * Removes a member from a workspace
 * @param workspace The workspace to modify
 * @param userId User ID to remove
 * @returns The modified workspace
 */
export function removeWorkspaceMember(
  workspace: Workspace,
  userId: string
): Workspace {
  const updatedWorkspace = {
    ...workspace,
    members: workspace.members.filter(member => member.id !== userId),
    updatedAt: new Date()
  };
  
  return updatedWorkspace;
}

/**
 * Updates workspace settings
 * @param workspace The workspace to modify
 * @param settings New settings to apply
 * @returns The modified workspace
 */
export function updateWorkspaceSettings(
  workspace: Workspace,
  settings: Partial<WorkspaceSettings>
): Workspace {
  const updatedWorkspace = {
    ...workspace,
    settings: {
      ...workspace.settings,
      ...settings
    },
    updatedAt: new Date()
  };
  
  return updatedWorkspace;
}

/**
 * Updates workspace customization
 * @param workspace The workspace to modify
 * @param customization New customization to apply
 * @returns The modified workspace
 */
export function updateWorkspaceCustomization(
  workspace: Workspace,
  customization: Partial<WorkspaceCustomization>
): Workspace {
  const updatedWorkspace = {
    ...workspace,
    customization: {
      ...workspace.customization,
      ...customization
    },
    updatedAt: new Date()
  };
  
  return updatedWorkspace;
}

/**
 * Archives or unarchives a workspace
 * @param workspace The workspace to modify
 * @param isArchived Whether the workspace should be archived
 * @returns The modified workspace
 */
export function setWorkspaceArchiveStatus(
  workspace: Workspace,
  isArchived: boolean
): Workspace {
  const updatedWorkspace = {
    ...workspace,
    isArchived,
    updatedAt: new Date()
  };
  
  return updatedWorkspace;
}