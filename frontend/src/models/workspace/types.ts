/**
 * Common type definitions for workspace models
 * Centralizing types improves maintainability and ensures consistency
 */

/**
 * Role types for workspace members with proper type safety
 */
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';

/**
 * Status types for tasks with proper type safety
 */
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

/**
 * Priority levels for tasks with proper type safety
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Meeting status types with proper type safety
 */
export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

/**
 * Document types with proper type safety
 */
export type DocumentType = 'text' | 'markdown' | 'richtext' | 'spreadsheet' | 'presentation';

/**
 * Research evidence types with proper type safety
 */
export type EvidenceType = 'qualitative' | 'quantitative' | 'anecdotal' | 'experimental';

/**
 * Research evidence strength levels with proper type safety
 */
export type EvidenceStrength = 'weak' | 'moderate' | 'strong';

/**
 * Research hypothesis status with proper type safety
 */
export type HypothesisStatus = 'proposed' | 'testing' | 'validated' | 'invalidated';

/**
 * Project status types with proper type safety
 */
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed';

/**
 * Widget configuration type with improved type safety
 */
export interface WidgetConfig {
  title?: string;
  refreshInterval?: number;
  visible?: boolean;
  expanded?: boolean;
  dataSource?: string;
  filter?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Error types for workspace operations
 */
export enum WorkspaceErrorType {
  NOT_FOUND = 'not_found',
  PERMISSION_DENIED = 'permission_denied',
  VALIDATION_FAILED = 'validation_failed',
  CONFLICT = 'conflict',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

/**
 * Error object for workspace operations
 */
export interface WorkspaceError {
  type: WorkspaceErrorType;
  message: string;
  field?: string;
  data?: Record<string, unknown>;
}

/**
 * Result type for workspace operations that can fail
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: WorkspaceError };