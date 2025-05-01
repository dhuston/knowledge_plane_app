/**
 * Team workspace model definitions extending the base workspace model
 */

import { Workspace, WorkspaceType, createWorkspace } from './Workspace';

export interface ActivityItemData {
  [key: string]: any;
}

export interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  timestamp: Date;
  data: ActivityItemData;
}

export interface Resource {
  id: string;
  type: string;
  name: string;
  url?: string;
  fileId?: string;
  createdAt: Date;
  createdBy: string;
}

export interface MetricConfiguration {
  id: string;
  type: string;
  name: string;
  isVisible: boolean;
  settings: Record<string, any>;
}

export interface NotificationSettings {
  emailDigest: 'daily' | 'weekly' | 'never';
  pushNotifications: boolean;
  mentionAlerts: boolean;
  activityAlerts: boolean;
}

/**
 * Team workspace interface extending the base workspace
 */
export interface TeamWorkspace extends Workspace {
  teamId: string;
  activityFeed: ActivityItem[];
  resources: Resource[];
  metrics: MetricConfiguration[];
  notifications: NotificationSettings;
}

/**
 * Creates a new team workspace with default values
 * @param name Workspace name
 * @param description Workspace description
 * @param teamId Team ID this workspace belongs to
 * @param createdBy User ID of creator
 * @returns A new team workspace instance
 */
export function createTeamWorkspace(
  name: string,
  description: string,
  teamId: string,
  createdBy: string
): TeamWorkspace {
  const baseWorkspace = createWorkspace(
    name,
    description, 
    WorkspaceType.TEAM,
    createdBy,
    teamId
  );
  
  return {
    ...baseWorkspace,
    teamId,
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
}

/**
 * Adds an activity item to the team workspace activity feed
 * @param workspace Team workspace to modify
 * @param type Activity type
 * @param userId User ID who performed the activity
 * @param data Additional activity data
 * @returns Updated team workspace
 */
export function addActivityItem(
  workspace: TeamWorkspace,
  type: string,
  userId: string,
  data: ActivityItemData
): TeamWorkspace {
  const activityItem: ActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    userId,
    timestamp: new Date(),
    data
  };
  
  return {
    ...workspace,
    activityFeed: [activityItem, ...workspace.activityFeed],
    updatedAt: new Date()
  };
}

/**
 * Adds a resource to the team workspace
 * @param workspace Team workspace to modify
 * @param type Resource type
 * @param name Resource name
 * @param url Optional resource URL
 * @param fileId Optional file ID
 * @param createdBy User ID who created the resource
 * @returns Updated team workspace
 */
export function addResource(
  workspace: TeamWorkspace,
  type: string,
  name: string,
  url: string | undefined,
  fileId: string | undefined,
  createdBy: string
): TeamWorkspace {
  const resource: Resource = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    name,
    url,
    fileId,
    createdAt: new Date(),
    createdBy
  };
  
  return {
    ...workspace,
    resources: [...workspace.resources, resource],
    updatedAt: new Date()
  };
}

/**
 * Adds or updates a metric configuration in the team workspace
 * @param workspace Team workspace to modify
 * @param type Metric type
 * @param name Metric name
 * @param isVisible Whether the metric is visible
 * @param settings Metric settings
 * @returns Updated team workspace
 */
export function updateMetricConfiguration(
  workspace: TeamWorkspace,
  metricId: string | undefined,
  type: string,
  name: string,
  isVisible: boolean,
  settings: Record<string, any>
): TeamWorkspace {
  const id = metricId || `metric-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const metric: MetricConfiguration = {
    id,
    type,
    name,
    isVisible,
    settings
  };
  
  let updatedMetrics;
  if (metricId) {
    // Update existing metric
    updatedMetrics = workspace.metrics.map(m => 
      m.id === metricId ? metric : m
    );
  } else {
    // Add new metric
    updatedMetrics = [...workspace.metrics, metric];
  }
  
  return {
    ...workspace,
    metrics: updatedMetrics,
    updatedAt: new Date()
  };
}

/**
 * Updates the notification settings for the team workspace
 * @param workspace Team workspace to modify
 * @param settings Notification settings to apply
 * @returns Updated team workspace
 */
export function updateNotificationSettings(
  workspace: TeamWorkspace,
  settings: Partial<NotificationSettings>
): TeamWorkspace {
  return {
    ...workspace,
    notifications: {
      ...workspace.notifications,
      ...settings
    },
    updatedAt: new Date()
  };
}