/**
 * Model definition for user presence information in collaborative features
 * Provides type-safe definitions and utility functions for presence data
 */

import { WorkspaceIds } from '../../utils/uuid';

/**
 * Possible statuses for a user's presence
 */
export type PresenceStatus = 'online' | 'away' | 'offline' | 'busy';

/**
 * User presence information in collaborative features
 */
export interface PresenceUser {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string;
  readonly status: PresenceStatus;
  readonly lastActive?: Date;
  readonly currentLocation?: {
    readonly workspace?: string;
    readonly section?: string;
    readonly documentId?: string;
    readonly cursorPosition?: number;
    readonly selection?: {
      readonly start: number;
      readonly end: number;
    };
  };
  readonly metadata?: Record<string, string>;
}

/**
 * Creates a new presence user entry
 * @param id User ID
 * @param name User name
 * @param avatar Optional avatar URL
 * @returns A new presence user object with default status
 */
export function createPresenceUser(
  id: string,
  name: string,
  avatar?: string
): PresenceUser {
  if (!id || !name) {
    throw new Error('User ID and name are required');
  }
  
  return Object.freeze({
    id,
    name,
    avatar,
    status: 'online',
    lastActive: new Date(),
    metadata: {}
  });
}

/**
 * Updates the status of a presence user
 * @param user Presence user to update
 * @param status New status
 * @returns Updated presence user
 */
export function updatePresenceStatus(
  user: PresenceUser,
  status: PresenceStatus
): PresenceUser {
  if (!user) {
    throw new Error('User is required');
  }
  
  return Object.freeze({
    ...user,
    status,
    lastActive: status === 'offline' ? user.lastActive : new Date()
  });
}

/**
 * Updates the location of a presence user within the application
 * @param user Presence user to update
 * @param workspace Workspace ID
 * @param section Section within the workspace
 * @param documentId Optional document ID
 * @param cursorPosition Optional cursor position in document
 * @returns Updated presence user
 */
export function updatePresenceLocation(
  user: PresenceUser,
  workspace?: string,
  section?: string,
  documentId?: string,
  cursorPosition?: number
): PresenceUser {
  if (!user) {
    throw new Error('User is required');
  }
  
  return Object.freeze({
    ...user,
    lastActive: new Date(),
    currentLocation: Object.freeze({
      workspace,
      section,
      documentId,
      cursorPosition
    })
  });
}

/**
 * Updates the selection range of a presence user
 * @param user Presence user to update
 * @param start Selection start position
 * @param end Selection end position
 * @returns Updated presence user
 */
export function updatePresenceSelection(
  user: PresenceUser,
  start: number,
  end: number
): PresenceUser {
  if (!user) {
    throw new Error('User is required');
  }
  
  return Object.freeze({
    ...user,
    lastActive: new Date(),
    currentLocation: Object.freeze({
      ...user.currentLocation,
      selection: Object.freeze({ start, end })
    })
  });
}

/**
 * Updates user metadata
 * @param user Presence user to update
 * @param metadata Metadata to add or update
 * @returns Updated presence user
 */
export function updatePresenceMetadata(
  user: PresenceUser,
  metadata: Record<string, string>
): PresenceUser {
  if (!user) {
    throw new Error('User is required');
  }
  
  return Object.freeze({
    ...user,
    metadata: Object.freeze({
      ...user.metadata,
      ...metadata
    })
  });
}

/**
 * Generate a unique presence session ID
 * @returns A unique session ID for presence tracking
 */
export function generatePresenceSessionId(): string {
  return WorkspaceIds.generateId('presence');
}

/**
 * Checks if a user is considered active based on their status
 * @param user The presence user to check
 * @returns True if the user is considered active
 */
export function isUserActive(user: PresenceUser): boolean {
  return user.status === 'online' || user.status === 'busy';
}

/**
 * Calculates the time elapsed since a user was last active
 * @param user The presence user to check
 * @returns Time in milliseconds since last activity, or undefined if no lastActive timestamp
 */
export function getTimeSinceActive(user: PresenceUser): number | undefined {
  if (!user.lastActive) return undefined;
  
  return Date.now() - user.lastActive.getTime();
}