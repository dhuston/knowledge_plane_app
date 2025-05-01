/**
 * Real-time presence service for collaborative features
 * 
 * In a production environment, this would use WebSockets or similar for real-time updates
 */

import { PresenceUser, createPresenceUser, updatePresenceStatus, updatePresenceLocation } from '../../models/collaboration/PresenceUser';
import { validateRequired } from '../../utils/validation';
import { WorkspaceIds } from '../../utils/uuid';

// Rate limiting constants
const RATE_LIMIT_INTERVAL = 200; // ms
const MAX_EVENTS_PER_INTERVAL = 5;

/**
 * Service class for managing real-time user presence
 */
class PresenceService {
  // In-memory presence storage simulating a real-time database
  private activeUsers = new Map<string, PresenceUser>();
  
  // Callbacks for presence changes
  private changeListeners: ((users: PresenceUser[]) => void)[] = [];
  
  // Rate limiting tracking
  private userEventCounts = new Map<string, number>();
  private lastResetTime = Date.now();

  constructor() {
    // Simulate periodic status updates and cleanup
    setInterval(() => this.simulateStatusUpdates(), 30000);
    setInterval(() => this.cleanupInactiveUsers(), 300000); // 5min
    
    // Reset rate limiting counts periodically
    setInterval(() => {
      this.userEventCounts.clear();
      this.lastResetTime = Date.now();
    }, RATE_LIMIT_INTERVAL);
  }
  
  /**
   * Adds a user to the presence system
   * @param userId User ID
   * @param name User name
   * @param avatar Optional avatar URL
   * @returns The created presence user object
   * @throws Error if inputs are invalid
   */
  registerUser(userId: string, name: string, avatar?: string): PresenceUser {
    try {
      // Validate required parameters
      validateRequired(userId, 'User ID');
      validateRequired(name, 'User name');
      
      const user = createPresenceUser(userId, name, avatar);
      this.activeUsers.set(userId, user);
      this.notifyListeners();
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
  
  /**
   * Updates a user's presence status with rate limiting
   * @param userId User ID
   * @param status New status
   * @returns Updated presence user object, or null if not found or rate limited
   */
  updateUserStatus(userId: string, status: PresenceUser['status']): PresenceUser | null {
    try {
      // Validate parameters
      validateRequired(userId, 'User ID');
      
      // Check rate limiting
      if (this.isRateLimited(userId)) {
        console.warn(`Rate limit exceeded for user ${userId}`);
        return null;
      }
      
      const user = this.activeUsers.get(userId);
      if (!user) return null;
      
      const updatedUser = updatePresenceStatus(user, status);
      this.activeUsers.set(userId, updatedUser);
      this.notifyListeners();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user status:', error);
      return null;
    }
  }
  
  /**
   * Updates a user's location within the application
   * @param userId User ID
   * @param workspace Workspace ID
   * @param section Section within workspace
   * @param documentId Optional document ID
   * @param cursorPosition Optional cursor position
   * @returns Updated presence user object, or null if not found or rate limited
   */
  updateUserLocation(
    userId: string,
    workspace?: string,
    section?: string,
    documentId?: string,
    cursorPosition?: number
  ): PresenceUser | null {
    try {
      // Validate parameters
      validateRequired(userId, 'User ID');
      
      // Check rate limiting
      if (this.isRateLimited(userId)) {
        return null;
      }
      
      const user = this.activeUsers.get(userId);
      if (!user) return null;
      
      const updatedUser = updatePresenceLocation(
        user,
        workspace,
        section,
        documentId,
        cursorPosition
      );
      
      this.activeUsers.set(userId, updatedUser);
      this.notifyListeners();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user location:', error);
      return null;
    }
  }
  
  /**
   * Gets all active users
   * @returns Array of active users
   */
  getActiveUsers(): PresenceUser[] {
    return Array.from(this.activeUsers.values());
  }
  
  /**
   * Gets users active in a specific workspace
   * @param workspaceId Workspace ID
   * @returns Array of users active in the workspace
   */
  getUsersInWorkspace(workspaceId: string): PresenceUser[] {
    try {
      validateRequired(workspaceId, 'Workspace ID');
      
      return Array.from(this.activeUsers.values())
        .filter(user => user.currentLocation?.workspace === workspaceId);
    } catch (error) {
      console.error('Error getting users in workspace:', error);
      return [];
    }
  }
  
  /**
   * Gets users active in a specific document
   * @param documentId Document ID
   * @returns Array of users active in the document
   */
  getUsersInDocument(documentId: string): PresenceUser[] {
    try {
      validateRequired(documentId, 'Document ID');
      
      return Array.from(this.activeUsers.values())
        .filter(user => user.currentLocation?.documentId === documentId);
    } catch (error) {
      console.error('Error getting users in document:', error);
      return [];
    }
  }
  
  /**
   * Removes a user from the presence system
   * @param userId User ID to remove
   * @returns boolean indicating success
   */
  removeUser(userId: string): boolean {
    try {
      validateRequired(userId, 'User ID');
      
      const result = this.activeUsers.delete(userId);
      if (result) {
        this.notifyListeners();
      }
      return result;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }
  
  /**
   * Simulates user status updates for demo purposes
   * In real usage, this would receive real-time updates from users
   */
  private simulateStatusUpdates(): void {
    // Only simulate updates if we have users
    if (this.activeUsers.size === 0) return;
    
    // Get a random user
    const userIds = Array.from(this.activeUsers.keys());
    const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
    const user = this.activeUsers.get(randomUserId);
    
    if (!user) return;
    
    // Generate a random status
    const statuses: PresenceUser['status'][] = ['online', 'away', 'busy', 'offline'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Update the user status
    const updatedUser = updatePresenceStatus(user, randomStatus);
    this.activeUsers.set(randomUserId, updatedUser);
    
    // Notify listeners
    this.notifyListeners();
  }
  
  /**
   * Cleans up inactive users (those who have been offline for too long)
   */
  private cleanupInactiveUsers(): void {
    const now = Date.now();
    const MAX_INACTIVITY = 30 * 60 * 1000; // 30 minutes
    
    let removedAny = false;
    
    this.activeUsers.forEach((user, userId) => {
      if (user.status === 'offline' && user.lastActive) {
        const inactiveTime = now - user.lastActive.getTime();
        if (inactiveTime > MAX_INACTIVITY) {
          this.activeUsers.delete(userId);
          removedAny = true;
        }
      }
    });
    
    if (removedAny) {
      this.notifyListeners();
    }
  }
  
  /**
   * Checks if a user has exceeded the rate limit
   * @param userId User ID to check
   * @returns true if the user has exceeded the rate limit
   */
  private isRateLimited(userId: string): boolean {
    const currentCount = this.userEventCounts.get(userId) || 0;
    
    if (currentCount >= MAX_EVENTS_PER_INTERVAL) {
      return true;
    }
    
    this.userEventCounts.set(userId, currentCount + 1);
    return false;
  }
  
  /**
   * Subscribes to presence changes
   * @param callback Function to call when presence changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (users: PresenceUser[]) => void): () => void {
    this.changeListeners.push(callback);
    
    // Immediately notify with current state
    callback(this.getActiveUsers());
    
    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifies all listeners of presence changes
   */
  private notifyListeners(): void {
    const activeUsers = this.getActiveUsers();
    this.changeListeners.forEach(callback => {
      try {
        callback(activeUsers);
      } catch (error) {
        console.error('Error in presence change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const presenceService = new PresenceService();