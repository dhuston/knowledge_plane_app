import React from 'react';
import { Box, keyframes, useColorModeValue } from '@chakra-ui/react';
import { Notification } from '../../../hooks/useNotifications';

interface NotificationMapIndicatorProps {
  notification: Notification;
  size: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/**
 * A visual indicator for notifications on map nodes.
 * Displays a colored dot with optional pulsing animation based on notification severity.
 */
const NotificationMapIndicator: React.FC<NotificationMapIndicatorProps> = ({
  notification,
  size,
  animate = false
}) => {
  // Get color scheme based on notification severity
  const getSeverityColorScheme = () => {
    switch (notification.severity) {
      case 'critical':
        return useColorModeValue('red.500', 'red.300');
      case 'warning':
        return useColorModeValue('yellow.500', 'yellow.300');
      case 'info':
      default:
        return useColorModeValue('blue.500', 'blue.300');
    }
  };

  // Define size dimensions
  const getSizeValue = () => {
    switch (size) {
      case 'xs':
        return '8px';
      case 'sm':
        return '10px';
      case 'md':
        return '12px';
      case 'lg':
        return '16px';
      default:
        return '10px';
    }
  };

  // Define pulse animation
  const pulseAnimation = keyframes`
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  `;

  // Determine if animation should be applied
  const shouldAnimate = animate && !notification.read_at;
  const animation = shouldAnimate ? `${pulseAnimation} 2s infinite` : undefined;

  // Generate class names for testing
  const severityClass = `notification-indicator-${notification.severity}`;
  const sizeClass = `notification-indicator-${size}`;
  const animationClass = shouldAnimate ? 'notification-indicator-pulse' : '';

  return (
    <Box
      data-testid="notification-indicator"
      className={`${severityClass} ${sizeClass} ${animationClass}`}
      position="absolute"
      width={getSizeValue()}
      height={getSizeValue()}
      bgColor={getSeverityColorScheme()}
      borderRadius="full"
      zIndex={10}
      top="-2px"
      right="-2px"
      animation={animation}
      boxShadow="0px 0px 3px rgba(0,0,0,0.4)"
    />
  );
};

export default NotificationMapIndicator;