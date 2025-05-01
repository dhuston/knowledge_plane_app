/**
 * Document workspace model definitions extending the base workspace model
 * For collaborative document editing and management
 */

import { Workspace, WorkspaceType, createWorkspace } from './Workspace';

export interface DocumentVersion {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  changeDescription: string;
  versionNumber: number;
}

export interface Comment {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  position?: {
    startOffset: number;
    endOffset: number;
  };
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number; // 1 for main sections, 2 for subsections, etc.
  content: string;
  order: number;
}

export interface Contributor {
  userId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  addedAt: Date;
  addedBy: string;
}

export interface EditHistory {
  timestamp: Date;
  userId: string;
  changeType: 'insert' | 'delete' | 'format' | 'structure';
  position?: {
    startOffset: number;
    endOffset: number;
  };
}

/**
 * Document workspace interface extending the base workspace
 */
export interface DocumentWorkspace extends Workspace {
  currentContent: string;
  documentType: 'text' | 'markdown' | 'richtext' | 'spreadsheet' | 'presentation';
  versions: DocumentVersion[];
  comments: Comment[];
  sections: DocumentSection[];
  contributors: Contributor[];
  editHistory: EditHistory[];
  lastModifiedBy: string;
  autoSaveEnabled: boolean;
  trackChangesEnabled: boolean;
  tags: string[];
  isTemplate: boolean;
}

/**
 * Creates a new document workspace with default values
 * @param name Workspace name (document title)
 * @param description Document description
 * @param documentType Type of document
 * @param initialContent Initial document content
 * @param createdBy User ID of creator
 * @returns A new document workspace instance
 */
export function createDocumentWorkspace(
  name: string,
  description: string,
  documentType: DocumentWorkspace['documentType'],
  initialContent: string,
  createdBy: string
): DocumentWorkspace {
  const baseWorkspace = createWorkspace(
    name,
    description,
    WorkspaceType.DOCUMENT,
    createdBy,
    createdBy // Owner is same as creator for documents
  );
  
  const initialVersion: DocumentVersion = {
    id: `dv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    content: initialContent,
    createdBy,
    createdAt: new Date(),
    changeDescription: 'Initial version',
    versionNumber: 1
  };
  
  return {
    ...baseWorkspace,
    currentContent: initialContent,
    documentType,
    versions: [initialVersion],
    comments: [],
    sections: [],
    contributors: [{
      userId: createdBy,
      role: 'owner',
      addedAt: new Date(),
      addedBy: createdBy
    }],
    editHistory: [],
    lastModifiedBy: createdBy,
    autoSaveEnabled: true,
    trackChangesEnabled: false,
    tags: [],
    isTemplate: false
  };
}

/**
 * Updates the document content
 * @param workspace Document workspace to modify
 * @param newContent Updated document content
 * @param userId User ID making the change
 * @param saveAsVersion Whether to create a new version
 * @param changeDescription Description of changes (required if saving as version)
 * @returns Updated document workspace
 */
export function updateDocumentContent(
  workspace: DocumentWorkspace,
  newContent: string,
  userId: string,
  saveAsVersion: boolean = false,
  changeDescription: string = ''
): DocumentWorkspace {
  let updatedWorkspace: DocumentWorkspace = {
    ...workspace,
    currentContent: newContent,
    lastModifiedBy: userId,
    updatedAt: new Date()
  };
  
  // Track edit in history
  updatedWorkspace = {
    ...updatedWorkspace,
    editHistory: [
      ...updatedWorkspace.editHistory,
      {
        timestamp: new Date(),
        userId,
        changeType: 'insert'
      }
    ]
  };
  
  // Create a new version if requested
  if (saveAsVersion) {
    if (!changeDescription) {
      throw new Error('Change description is required when saving as version');
    }
    
    const newVersion: DocumentVersion = {
      id: `dv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: newContent,
      createdBy: userId,
      createdAt: new Date(),
      changeDescription,
      versionNumber: workspace.versions.length + 1
    };
    
    updatedWorkspace = {
      ...updatedWorkspace,
      versions: [...updatedWorkspace.versions, newVersion]
    };
  }
  
  return updatedWorkspace;
}

/**
 * Adds a comment to the document
 * @param workspace Document workspace to modify
 * @param content Comment content
 * @param createdBy User ID creating the comment
 * @param position Optional position in the document
 * @returns Updated document workspace
 */
export function addComment(
  workspace: DocumentWorkspace,
  content: string,
  createdBy: string,
  position?: { startOffset: number; endOffset: number }
): DocumentWorkspace {
  const comment: Comment = {
    id: `com-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    content,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    position,
    resolved: false,
    replies: []
  };
  
  return {
    ...workspace,
    comments: [...workspace.comments, comment],
    updatedAt: new Date()
  };
}

/**
 * Resolves a comment in the document
 * @param workspace Document workspace to modify
 * @param commentId ID of the comment to resolve
 * @param userId User ID resolving the comment
 * @returns Updated document workspace
 */
export function resolveComment(
  workspace: DocumentWorkspace,
  commentId: string,
  userId: string
): DocumentWorkspace {
  const updatedComments = workspace.comments.map(comment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date()
      };
    }
    return comment;
  });
  
  return {
    ...workspace,
    comments: updatedComments,
    updatedAt: new Date()
  };
}

/**
 * Adds a contributor to the document workspace
 * @param workspace Document workspace to modify
 * @param userId User ID to add as contributor
 * @param role Role to assign to the contributor
 * @param addedBy User ID adding the contributor
 * @returns Updated document workspace
 */
export function addContributor(
  workspace: DocumentWorkspace,
  userId: string,
  role: Contributor['role'],
  addedBy: string
): DocumentWorkspace {
  // Check if user is already a contributor
  const existingContributor = workspace.contributors.find(c => c.userId === userId);
  if (existingContributor) {
    // Update role if the user is already a contributor
    const updatedContributors = workspace.contributors.map(c => {
      if (c.userId === userId) {
        return {
          ...c,
          role
        };
      }
      return c;
    });
    
    return {
      ...workspace,
      contributors: updatedContributors,
      updatedAt: new Date()
    };
  }
  
  // Add as new contributor
  const contributor: Contributor = {
    userId,
    role,
    addedAt: new Date(),
    addedBy
  };
  
  return {
    ...workspace,
    contributors: [...workspace.contributors, contributor],
    updatedAt: new Date()
  };
}