import { useMemo } from 'react';
import useNotifications, { Notification } from './useNotifications';

interface NodeWithId {
  id: string;
  type: string;
  [key: string]: any;
}

interface UseNotificationFilterProps {
  /**
   * Filter by notification type (e.g., 'activity', 'insight', etc.)
   */
  notificationType?: string;
  
  /**
   * Filter by notification severity (e.g., 'info', 'warning', 'critical')
   */
  severity?: 'info' | 'warning' | 'critical';
  
  /**
   * Include read notifications in filtering
   */
  includeRead?: boolean;
  
  /**
   * Include dismissed notifications in filtering
   */
  includeDismissed?: boolean;
}

/**
 * Custom hook for filtering map nodes based on notifications.
 * Returns functions to filter nodes with notifications and
 * to check if a specific node has notifications.
 */
function useNotificationFilter(options: UseNotificationFilterProps = {}) {
  const { notifications } = useNotifications();
  const { notificationType, severity, includeRead = false, includeDismissed = false } = options;
  
  // Filter notifications based on the provided criteria
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filter by type if specified
      if (notificationType && notification.type !== notificationType) {
        return false;
      }
      
      // Filter by severity if specified
      if (severity && notification.severity !== severity) {
        return false;
      }
      
      // Filter read notifications if not including them
      if (!includeRead && notification.read_at !== null) {
        return false;
      }
      
      // Filter dismissed notifications if not including them
      if (!includeDismissed && notification.dismissed_at !== null) {
        return false;
      }
      
      return true;
    });
  }, [notifications, notificationType, severity, includeRead, includeDismissed]);
  
  // Get a mapping of entity_type+id -> notifications count
  const entityNotificationsMap = useMemo(() => {
    const map: Record<string, number> = {};
    
    for (const notification of filteredNotifications) {
      if (notification.entity_type && notification.entity_id) {
        const key = `${notification.entity_type}:${notification.entity_id}`;
        map[key] = (map[key] || 0) + 1;
      }
    }
    
    return map;
  }, [filteredNotifications]);
  
  /**
   * Filter an array of nodes to only include those with notifications.
   */
  const filterNodesWithNotifications = <T extends NodeWithId>(nodes: T[]): T[] => {
    return nodes.filter(node => {
      const key = `${node.type}:${node.id}`;
      return entityNotificationsMap[key] > 0;
    });
  };
  
  /**
   * Check if a specific node has notifications.
   */
  const hasNotifications = (nodeType: string, nodeId: string): boolean => {
    const key = `${nodeType}:${nodeId}`;
    return entityNotificationsMap[key] > 0;
  };
  
  /**
   * Get the number of notifications for a specific node.
   */
  const getNotificationCount = (nodeType: string, nodeId: string): number => {
    const key = `${nodeType}:${nodeId}`;
    return entityNotificationsMap[key] || 0;
  };
  
  /**
   * Get all notifications for a specific node.
   */
  const getNotificationsForNode = (nodeType: string, nodeId: string): Notification[] => {
    return filteredNotifications.filter(
      notification => notification.entity_type === nodeType && notification.entity_id === nodeId
    );
  };
  
  return {
    filterNodesWithNotifications,
    hasNotifications,
    getNotificationCount,
    getNotificationsForNode,
    filteredNotifications
  };
}

export default useNotificationFilter;