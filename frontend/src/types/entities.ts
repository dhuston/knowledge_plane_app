/**
 * entities.ts
 * Common entity type definitions used across the application
 */

import { MapNodeTypeEnum } from './map';

// Base entity interface
export interface EntityBase {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

// User entity
export interface UserEntity extends EntityBase {
  email: string;
  title?: string;
  department?: string;
  avatar_url?: string;
  team_id?: string;
  manager_id?: string;
  skills?: string[];
}

// Team entity
export interface TeamEntity extends EntityBase {
  lead_id?: string;
  department_id?: string;
  members: string[];
}

// Project entity
export interface ProjectEntity extends EntityBase {
  start_date?: string;
  end_date?: string;
  team_ids: string[];
  goal_ids: string[];
  status: string;
}

// Goal entity
export interface GoalEntity extends EntityBase {
  due_date?: string;
  priority: string;
  status: string;
  progress: number;
  project_ids: string[];
}

// Department entity
export interface DepartmentEntity extends EntityBase {
  head_id?: string;
  parent_department_id?: string;
}

// Knowledge asset entity
export interface KnowledgeAssetEntity extends EntityBase {
  asset_type: string;
  tags: string[];
  owner_id: string;
  url?: string;
}

// Union type for all entity types
export type EntityDataType = 
  | UserEntity 
  | TeamEntity 
  | ProjectEntity 
  | GoalEntity 
  | DepartmentEntity 
  | KnowledgeAssetEntity;

// Type guard to check if an entity is a specific type
export function isUserEntity(entity: EntityDataType): entity is UserEntity {
  return 'email' in entity;
}

export function isTeamEntity(entity: EntityDataType): entity is TeamEntity {
  return 'members' in entity;
}

export function isProjectEntity(entity: EntityDataType): entity is ProjectEntity {
  return 'team_ids' in entity && 'goal_ids' in entity;
}

export function isGoalEntity(entity: EntityDataType): entity is GoalEntity {
  return 'progress' in entity && 'priority' in entity;
}

export function isDepartmentEntity(entity: EntityDataType): entity is DepartmentEntity {
  return 'head_id' in entity || 'parent_department_id' in entity;
}

export function isKnowledgeAssetEntity(entity: EntityDataType): entity is KnowledgeAssetEntity {
  return 'asset_type' in entity && 'tags' in entity;
}

// Relationship type
export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  source_type?: MapNodeTypeEnum;
  target_type?: MapNodeTypeEnum;
}

// Activity type
export interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
  entity_id?: string;
  entity_type?: MapNodeTypeEnum;
}