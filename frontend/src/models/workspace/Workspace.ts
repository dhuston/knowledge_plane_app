/**
 * Workspace model definitions for the collaborative workspace feature
 * This module provides the foundational types and functions for all workspace types
 */

import { WorkspaceIds } from '../../utils/uuid';
import { MemberRole, WidgetConfig } from './types';

/**
 * Enumeration of available workspace types
 */
export enum WorkspaceType {
  TEAM = 'team',
  PROJECT = 'project',
  RESEARCH = 'research',
  PERSONAL = 'personal',
  DOCUMENT = 'document',
  MEETING = 'meeting'
}

/**
 * Interface representing a workspace member
 */
export interface WorkspaceMember {
  readonly id: string;
  readonly role: MemberRole;
  readonly joinedAt: Date;
  readonly displayName?: string;
}

/**
 * Interface for workspace security and notification settings
 */
export interface WorkspaceSettings {
  readonly isPublic: boolean;
  readonly allowGuests: boolean;
  readonly notificationsEnabled: boolean;
  readonly requireApprovalToJoin?: boolean;
  readonly allowExternalSharing?: boolean;
}

/**
 * Interface for workspace widget configuration and positioning
 */
export interface WorkspaceWidget {
  readonly id: string;
  readonly type: string;
  readonly config: WidgetConfig;
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

/**
 * Interface for workspace appearance and layout customization
 */
export interface WorkspaceCustomization {
  readonly theme: string;
  readonly layout: string;
  readonly widgets: ReadonlyArray<WorkspaceWidget>;
  readonly colorScheme?: string;
  readonly fontSettings?: {
    readonly size: 'small' | 'medium' | 'large';
    readonly family: string;
  };
}

/**
 * Base workspace interface that serves as the foundation for all workspace types
 */
export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: WorkspaceType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string; // userId
  readonly ownerId: string; // userId or teamId
  readonly members: ReadonlyArray<WorkspaceMember>;
  readonly settings: WorkspaceSettings;
  readonly customization: WorkspaceCustomization;
  readonly isArchived: boolean;
  readonly tags?: ReadonlyArray<string>;
  readonly metadata?: Record<string, string>;
}

/**
 * Type guard to check if a workspace is of a specific type
 * @param workspace The workspace to check
 * @param type The workspace type to check against
 * @returns Boolean indicating if the workspace is of the specified type
 */
export function isWorkspaceType(workspace: Workspace, type: WorkspaceType): boolean {
  return workspace.type === type;
}

/**
 * Creates a new workspace with default values
 * @param name Workspace name
 * @param description Workspace description
 * @param type Workspace type
 * @param createdBy User ID of creator
 * @param ownerId User or team ID of the owner
 * @returns A new workspace instance with default settings
 * @throws Error if required parameters are invalid
 */
export function createWorkspace(
  name: string,
  description: string,
  type: WorkspaceType,
  createdBy: string,
  ownerId: string
): Workspace {
  // Input validation
  if (!name || name.trim().length === 0) {
    throw new Error('Workspace name is required');
  }
  
  if (!createdBy) {
    throw new Error('Creator ID is required');
  }
  
  if (!ownerId) {
    throw new Error('Owner ID is required');
  }

  const now = new Date();
  
  // Create immutable default settings
  const defaultSettings: WorkspaceSettings = Object.freeze({
    isPublic: false,
    allowGuests: false,
    notificationsEnabled: true,
    requireApprovalToJoin: true,
    allowExternalSharing: false
  });
  
  // Create immutable default customization
  const defaultCustomization: WorkspaceCustomization = Object.freeze({
    theme: 'light',
    layout: 'default',
    widgets: Object.freeze([]),
    colorScheme: 'default'
  });
  
  // Create the workspace with a proper UUID
  return Object.freeze({
    id: WorkspaceIds.workspace(),
    name,
    description,
    type,
    createdAt: now,
    updatedAt: now,
    createdBy,
    ownerId,
    members: Object.freeze([]),
    settings: defaultSettings,
    customization: defaultCustomization,
    isArchived: false,
    tags: Object.freeze([])
  });
}

/**
 * Adds a member to a workspace
 * @param workspace The workspace to modify
 * @param userId User ID to add
 * @param role Role to assign to the user
 * @param displayName Optional display name for the member
 * @returns The modified workspace
 * @throws Error if user is already a member or role is invalid
 */
export function addWorkspaceMember(
  workspace: Workspace,
  userId: string,
  role: MemberRole,
  displayName?: string
): Workspace {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Check if user is already a member
  if (workspace.members.some(member => member.id === userId)) {
    throw new Error(`User ${userId} is already a member of this workspace`);
  }
  
  // Create new member
  const newMember: WorkspaceMember = Object.freeze({
    id: userId,
    role,
    joinedAt: new Date(),
    displayName
  });
  
  // Create immutable updated members array
  const updatedMembers = Object.freeze([
    ...workspace.members,
    newMember
  ]);
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    members: updatedMembers,
    updatedAt: new Date()
  });
}

/**
 * Removes a member from a workspace
 * @param workspace The workspace to modify
 * @param userId User ID to remove
 * @returns The modified workspace
 * @throws Error if user is not a member or is the owner
 */
export function removeWorkspaceMember(
  workspace: Workspace,
  userId: string
): Workspace {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Check if user is the owner
  if (workspace.ownerId === userId) {
    throw new Error('Cannot remove workspace owner');
  }
  
  // Check if user is a member
  const memberExists = workspace.members.some(member => member.id === userId);
  if (!memberExists) {
    throw new Error(`User ${userId} is not a member of this workspace`);
  }
  
  // Create immutable updated members array
  const updatedMembers = Object.freeze(
    workspace.members.filter(member => member.id !== userId)
  );
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    members: updatedMembers,
    updatedAt: new Date()
  });
}

/**
 * Updates a member's role in a workspace
 * @param workspace The workspace to modify
 * @param userId User ID to update
 * @param role New role to assign
 * @returns The modified workspace
 * @throws Error if user is not a member or is the owner
 */
export function updateMemberRole(
  workspace: Workspace,
  userId: string,
  role: MemberRole
): Workspace {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Check if user is the owner
  if (workspace.ownerId === userId) {
    throw new Error('Cannot change workspace owner role');
  }
  
  // Check if user is a member
  const memberExists = workspace.members.some(member => member.id === userId);
  if (!memberExists) {
    throw new Error(`User ${userId} is not a member of this workspace`);
  }
  
  // Create immutable updated members array
  const updatedMembers = Object.freeze(
    workspace.members.map(member => 
      member.id === userId ? Object.freeze({ ...member, role }) : member
    )
  );
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    members: updatedMembers,
    updatedAt: new Date()
  });
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
  // Create immutable updated settings
  const updatedSettings = Object.freeze({
    ...workspace.settings,
    ...settings
  });
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    settings: updatedSettings,
    updatedAt: new Date()
  });
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
  // Handle widgets separately to maintain immutability
  const updatedWidgets = customization.widgets 
    ? Object.freeze([...customization.widgets])
    : workspace.customization.widgets;
  
  // Create immutable updated customization
  const updatedCustomization = Object.freeze({
    ...workspace.customization,
    ...customization,
    widgets: updatedWidgets
  });
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    customization: updatedCustomization,
    updatedAt: new Date()
  });
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
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    isArchived,
    updatedAt: new Date()
  });
}

/**
 * Updates workspace tags
 * @param workspace The workspace to modify
 * @param tags New tags for the workspace
 * @returns The modified workspace
 */
export function updateWorkspaceTags(
  workspace: Workspace,
  tags: string[]
): Workspace {
  // Create immutable updated tags
  const updatedTags = Object.freeze([...tags]);
  
  // Return immutable updated workspace
  return Object.freeze({
    ...workspace,
    tags: updatedTags,
    updatedAt: new Date()
  });
}

/**
 * Checks if a user can edit a workspace
 * @param workspace The workspace to check
 * @param userId User ID to check permissions for
 * @returns Boolean indicating if the user can edit the workspace
 */
export function canEditWorkspace(workspace: Workspace, userId: string): boolean {
  if (workspace.ownerId === userId) {
    return true;
  }
  
  const member = workspace.members.find(m => m.id === userId);
  return !!member && ['owner', 'admin', 'editor'].includes(member.role);
}

/**
 * Checks if a user can view a workspace
 * @param workspace The workspace to check
 * @param userId User ID to check permissions for
 * @returns Boolean indicating if the user can view the workspace
 */
export function canViewWorkspace(workspace: Workspace, userId: string): boolean {
  // Public workspaces can be viewed by anyone
  if (workspace.settings.isPublic) {
    return true;
  }
  
  // Otherwise, user must be owner or member
  if (workspace.ownerId === userId) {
    return true;
  }
  
  return workspace.members.some(m => m.id === userId);
}