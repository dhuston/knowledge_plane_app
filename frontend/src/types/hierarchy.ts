/**
 * hierarchy.ts
 * Type definitions for the Organizational Hierarchy Navigator
 */

import { EntityBase, UserEntity, TeamEntity, DepartmentEntity } from './entities';

// Organizational unit type enum
export enum OrganizationalUnitTypeEnum {
  ORGANIZATION = 'organization',
  DIVISION = 'division',
  DEPARTMENT = 'department',
  TEAM = 'team',
  USER = 'user'
}

// Base organizational unit interface
export interface OrganizationalUnit {
  id: string;
  type: OrganizationalUnitTypeEnum;
  name: string;
  description?: string;
  parentId?: string;
  leaderId?: string;
  memberCount: number;
  level: number;
  path: string[]; // Array of parent IDs for quick traversal
  metadata?: Record<string, unknown>;
}

// Extended interfaces for specific unit types
export interface OrganizationEntity extends OrganizationalUnit {
  type: OrganizationalUnitTypeEnum.ORGANIZATION;
  departmentIds: string[];
  executiveId?: string;
  metadata?: {
    code?: string;
    location?: string;
    size?: number;
  };
}

export interface DivisionEntity extends OrganizationalUnit {
  type: OrganizationalUnitTypeEnum.DIVISION;
  departmentIds: string[];
  metadata?: {
    code?: string;
    function?: string;
    location?: string;
  };
}

export interface OrganizationalDepartmentEntity extends DepartmentEntity implements OrganizationalUnit {
  type: OrganizationalUnitTypeEnum.DEPARTMENT;
  level: number;
  path: string[];
  memberCount: number;
  teamIds: string[];
  metadata?: {
    code?: string;
    location?: string;
    function?: string;
  };
}

export interface OrganizationalTeamEntity extends TeamEntity implements OrganizationalUnit {
  type: OrganizationalUnitTypeEnum.TEAM;
  level: number;
  path: string[];
  memberCount: number;
  leaderId?: string;
  parentId?: string; // Department ID
}

export interface OrganizationalUserEntity extends UserEntity implements OrganizationalUnit {
  type: OrganizationalUnitTypeEnum.USER;
  level: number;
  path: string[];
  memberCount: number; // Always 1 for users
  parentId?: string; // Team ID
}

// Union type for all organizational unit types
export type OrganizationalUnitEntity =
  | OrganizationEntity
  | DivisionEntity
  | OrganizationalDepartmentEntity
  | OrganizationalTeamEntity
  | OrganizationalUserEntity;

// Type guard functions
export function isOrganizationEntity(entity: OrganizationalUnitEntity): entity is OrganizationEntity {
  return entity.type === OrganizationalUnitTypeEnum.ORGANIZATION;
}

export function isDivisionEntity(entity: OrganizationalUnitEntity): entity is DivisionEntity {
  return entity.type === OrganizationalUnitTypeEnum.DIVISION;
}

export function isOrgDepartmentEntity(entity: OrganizationalUnitEntity): entity is OrganizationalDepartmentEntity {
  return entity.type === OrganizationalUnitTypeEnum.DEPARTMENT;
}

export function isOrgTeamEntity(entity: OrganizationalUnitEntity): entity is OrganizationalTeamEntity {
  return entity.type === OrganizationalUnitTypeEnum.TEAM;
}

export function isOrgUserEntity(entity: OrganizationalUnitEntity): entity is OrganizationalUserEntity {
  return entity.type === OrganizationalUnitTypeEnum.USER;
}

// Connection strength type
export enum ConnectionStrengthEnum {
  STRONG = 'strong',
  MEDIUM = 'medium',
  WEAK = 'weak',
}

// Connection strength definition
export interface ConnectionStrength {
  strength: ConnectionStrengthEnum;
  value: number;  // 0-100
  basis?: string; // Description of why this connection has this strength
}

// Hierarchy navigation state
export interface HierarchyNavigationState {
  selectedUnitId: string | null;
  expandedUnitIds: string[];
  path: string[];
  searchTerm: string;
  filterType: OrganizationalUnitTypeEnum | null;
}