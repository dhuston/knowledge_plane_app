/**
 * Project workspace model definitions extending the base workspace model
 */

import { Workspace, WorkspaceType, createWorkspace } from './Workspace';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participants: string[];
  tags: string[];
  commentCount: number;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  versionHistory: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileUrl: string;
  createdBy: string;
  createdAt: Date;
  changeDescription: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  startDate: Date;
  targetDate: Date;
  metrics: GoalMetric[];
}

export interface GoalMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed';

/**
 * Project workspace interface extending the base workspace
 */
export interface ProjectWorkspace extends Workspace {
  projectId: string;
  timeline: TimelineItem[];
  tasks: Task[];
  discussions: Discussion[];
  documents: Document[];
  goals: Goal[];
  status: ProjectStatus;
}

/**
 * Creates a new project workspace with default values
 * @param name Workspace name
 * @param description Workspace description
 * @param projectId Project ID this workspace belongs to
 * @param createdBy User ID of creator
 * @returns A new project workspace instance
 */
export function createProjectWorkspace(
  name: string,
  description: string,
  projectId: string,
  createdBy: string
): ProjectWorkspace {
  const baseWorkspace = createWorkspace(
    name,
    description,
    WorkspaceType.PROJECT,
    createdBy,
    projectId
  );
  
  return {
    ...baseWorkspace,
    projectId,
    timeline: [],
    tasks: [],
    discussions: [],
    documents: [],
    goals: [],
    status: 'planning'
  };
}

/**
 * Adds a timeline item to the project workspace
 * @param workspace Project workspace to modify
 * @param title Timeline item title
 * @param description Timeline item description
 * @param startDate Start date
 * @param endDate End date (optional)
 * @param status Status of the timeline item
 * @returns Updated project workspace
 */
export function addTimelineItem(
  workspace: ProjectWorkspace,
  title: string,
  description: string,
  startDate: Date,
  endDate: Date | null,
  status: TimelineItem['status']
): ProjectWorkspace {
  const timelineItem: TimelineItem = {
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    startDate,
    endDate,
    status
  };
  
  return {
    ...workspace,
    timeline: [...workspace.timeline, timelineItem],
    updatedAt: new Date()
  };
}

/**
 * Adds a task to the project workspace
 * @param workspace Project workspace to modify
 * @param title Task title
 * @param description Task description
 * @param assignees Array of user IDs assigned to the task
 * @param priority Task priority
 * @param dueDate Task due date (optional)
 * @returns Updated project workspace
 */
export function addTask(
  workspace: ProjectWorkspace,
  title: string,
  description: string,
  assignees: string[],
  priority: Task['priority'],
  dueDate: Date | null
): ProjectWorkspace {
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    assignees,
    status: 'todo',
    priority,
    dueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };
  
  return {
    ...workspace,
    tasks: [...workspace.tasks, task],
    updatedAt: new Date()
  };
}

/**
 * Updates the status of a task in the project workspace
 * @param workspace Project workspace to modify
 * @param taskId Task ID to update
 * @param status New status for the task
 * @returns Updated project workspace
 */
export function updateTaskStatus(
  workspace: ProjectWorkspace,
  taskId: string,
  status: Task['status']
): ProjectWorkspace {
  const now = new Date();
  const updatedTasks = workspace.tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        status,
        updatedAt: now,
        completedAt: status === 'done' ? now : task.completedAt
      };
    }
    return task;
  });
  
  return {
    ...workspace,
    tasks: updatedTasks,
    updatedAt: now
  };
}

/**
 * Adds a discussion to the project workspace
 * @param workspace Project workspace to modify
 * @param title Discussion title
 * @param content Discussion content
 * @param createdBy User ID who created the discussion
 * @param tags Array of tags for the discussion
 * @returns Updated project workspace
 */
export function addDiscussion(
  workspace: ProjectWorkspace,
  title: string,
  content: string,
  createdBy: string,
  tags: string[] = []
): ProjectWorkspace {
  const discussion: Discussion = {
    id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    content,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [createdBy],
    tags,
    commentCount: 0
  };
  
  return {
    ...workspace,
    discussions: [...workspace.discussions, discussion],
    updatedAt: new Date()
  };
}

/**
 * Updates the project status
 * @param workspace Project workspace to modify
 * @param status New project status
 * @returns Updated project workspace
 */
export function updateProjectStatus(
  workspace: ProjectWorkspace,
  status: ProjectStatus
): ProjectWorkspace {
  return {
    ...workspace,
    status,
    updatedAt: new Date()
  };
}