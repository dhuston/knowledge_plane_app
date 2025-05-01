import React, { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import useNotifications, { Notification } from '../../../hooks/useNotifications';
import NotificationMapIndicator from './NotificationMapIndicator';

interface NodeWithNotificationsProps {
  node: {
    id: string;
    type: string;
  };
  animate?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a map node component and adds notification indicators when relevant notifications exist.
 * This component is responsible for filtering notifications relevant to the node and
 * displaying appropriate indicators.
 */
const NodeWithNotifications: React.FC<NodeWithNotificationsProps> = ({
  node,
  animate = false,
  children
}) => {
  const { notifications } = useNotifications();
  
  // Filter notifications relevant to this node
  const relevantNotifications = useMemo(() => {
    return notifications.filter(notification => {
      return (
        notification.entity_type === node.type &&
        notification.entity_id === node.id &&
        !notification.dismissed_at
      );
    });
  }, [notifications, node.id, node.type]);
  
  // Get the highest priority notification (critical > warning > info)
  const highestPriorityNotification = useMemo(() => {
    if (relevantNotifications.length === 0) return null;
    
    // First look for critical
    const criticalNotification = relevantNotifications.find(n => n.severity === 'critical' && !n.read_at);
    if (criticalNotification) return criticalNotification;
    
    // Then look for warning
    const warningNotification = relevantNotifications.find(n => n.severity === 'warning' && !n.read_at);
    if (warningNotification) return warningNotification;
    
    // Then look for info
    const infoNotification = relevantNotifications.find(n => n.severity === 'info' && !n.read_at);
    if (infoNotification) return infoNotification;
    
    // If no unread, take the most recent read notification
    return relevantNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [relevantNotifications]);
  
  // Count unread notifications for this node
  const unreadCount = useMemo(() => {
    return relevantNotifications.filter(n => !n.read_at).length;
  }, [relevantNotifications]);
  
  return (
    <Box position="relative">
      {/* Render the original node */}
      {children}
      
      {/* Render notification indicator if there are any relevant notifications */}
      {highestPriorityNotification && (
        <NotificationMapIndicator 
          notification={highestPriorityNotification}
          size={unreadCount > 1 ? "md" : "sm"}
          animate={animate}
        />
      )}
    </Box>
  );
};

export default NodeWithNotifications;