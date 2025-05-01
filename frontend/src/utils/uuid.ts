/**
 * UUID generation utility for consistent ID creation across the application
 */

/**
 * Generates a UUID v4 compliant string
 * @returns A string UUID
 */
export function generateUuid(): string {
  // RFC4122 compliant UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a prefixed unique ID for domain-specific objects
 * @param prefix The prefix to add to the ID (e.g., 'ws' for workspace)
 * @returns A prefixed unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${generateUuid()}`;
}

/**
 * Workspace-specific ID generators
 */
export const WorkspaceIds = {
  workspace: () => generateId('ws'),
  team: () => generateId('team'),
  project: () => generateId('proj'),
  research: () => generateId('rsrch'),
  document: () => generateId('doc'),
  meeting: () => generateId('meet'),
  task: () => generateId('task'),
  note: () => generateId('note'),
  comment: () => generateId('com'),
  resource: () => generateId('res'),
  activityItem: () => generateId('act'),
  widget: () => generateId('wdgt'),
  poll: () => generateId('poll'),
  agenda: () => generateId('agnd')
};